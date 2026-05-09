import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useDropzone, FileRejection } from 'react-dropzone'
import {
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Image,
  Input,
  Progress,
  Select,
  Stack,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react'
import { Layout } from '../../../shared/components/Layout'
import { PageContainer } from '../../../shared/components/PageContainer'
import { LoadingSpinner } from '../../../shared/components/LoadingSpinner'
import { useToast } from '../../../shared/hooks/useToast'
import { authStore } from '../../auth/store/authStore'
import { authApi } from '../../auth/api/auth.api'
import { useExhibitorEvent } from '../hooks/useExhibitorEvents'
import {
  GoogleDriveClient,
  GoogleDriveError,
} from '../../../shared/google/drive.client'
import { exhibitorBoothsApi } from '../api/exhibitorBooths.api'
import { ExhibitorDocumentFileType } from '../types'
import axios from 'axios'

const MAX_FILE_BYTES = 10 * 1024 * 1024
const UPLOAD_CONCURRENCY = 3

const formSchema = z.object({
  boothName: z
    .string()
    .min(1, 'Booth name is required')
    .max(200, 'Booth name must be 200 characters or fewer'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(5000, 'Description must be 5000 characters or fewer'),
})

type FormValues = z.infer<typeof formSchema>

type DocStatus = 'pending' | 'uploading' | 'done' | 'error'

interface DocumentEntry {
  id: string
  file: File
  type: ExhibitorDocumentFileType
  status: DocStatus
  progress: number
  driveFileId?: string
  driveFileUrl?: string
  error?: string
}

const newId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(36).slice(2)}`

async function runWithLimit<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const queue = items.slice()
  const runners = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length > 0) {
        const next = queue.shift()
        if (next === undefined) return
        await worker(next)
      }
    },
  )
  await Promise.all(runners)
}

export function CreateBoothPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()
  const { success: showSuccess, error: showError, info: showInfo } = useToast()

  const { event, isLoading: eventLoading } = useExhibitorEvent(eventId || '')

  const [documents, setDocuments] = useState<DocumentEntry[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [boothId, setBoothId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { boothName: '', description: '' },
  })

  const description = watch('description') ?? ''

  const previewUrls = useMemo(() => {
    const map = new Map<string, string>()
    documents.forEach((doc) => {
      if (doc.file.type.startsWith('image/')) {
        map.set(doc.id, URL.createObjectURL(doc.file))
      }
    })
    return map
  }, [documents])

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const onDrop = useCallback(
    (accepted: File[], rejections: FileRejection[]) => {
      if (rejections.length > 0) {
        const reasons = rejections
          .map((r) => `${r.file.name}: ${r.errors[0]?.message ?? 'rejected'}`)
          .join('; ')
        showError(`Some files were rejected — ${reasons}`)
      }
      if (accepted.length === 0) return
      setDocuments((prev) => [
        ...prev,
        ...accepted.map<DocumentEntry>((file) => ({
          id: newId(),
          file,
          type: 'brochure',
          status: 'pending',
          progress: 0,
        })),
      ])
    },
    [showError],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': ['.pdf'],
    },
    maxSize: MAX_FILE_BYTES,
    disabled: isSubmitting,
  })

  const removeDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
  }

  const setDocumentType = (id: string, type: ExhibitorDocumentFileType) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, type } : d)),
    )
  }

  const updateDocument = (id: string, patch: Partial<DocumentEntry>) => {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    )
  }

  const handleReconnectGoogle = (message: string) => {
    showError(message)
    authStore.getState().logout()
    navigate('/signin')
  }

  const fetchFreshDriveToken = async (): Promise<string | null> => {
    try {
      const { accessToken } = await authApi.getGoogleAccessToken()
      authStore.getState().setGoogleAccessToken(accessToken)
      return accessToken
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 412) {
        handleReconnectGoogle(
          'Google connection expired — please sign in again to reconnect',
        )
        return null
      }
      showError('Could not refresh Google access — please try again')
      return null
    }
  }

  const buildEventFolder = async (
    drive: GoogleDriveClient,
    eventName: string,
  ): Promise<string> => {
    const rootId = await drive.ensureFolder('MeetSync', 'root')
    const myBoothsId = await drive.ensureFolder('My Booths', rootId)
    return drive.ensureFolder(eventName, myBoothsId)
  }

  const uploadOneDocument = async (
    driveRef: { current: GoogleDriveClient },
    eventFolderId: string,
    targetBoothId: string,
    doc: DocumentEntry,
    refreshDrive: () => Promise<GoogleDriveClient | null>,
  ): Promise<boolean> => {
    updateDocument(doc.id, {
      status: 'uploading',
      progress: 0,
      error: undefined,
    })

    const doUpload = async (drive: GoogleDriveClient) => {
      const { fileId, webViewLink } = await drive.uploadFile(
        doc.file,
        eventFolderId,
        (pct) => updateDocument(doc.id, { progress: Math.round(pct) }),
      )
      await drive.setPublicPermission(fileId)
      return { fileId, webViewLink }
    }

    try {
      let result
      try {
        result = await doUpload(driveRef.current)
      } catch (err) {
        if (err instanceof GoogleDriveError && err.status === 401) {
          const fresh = await refreshDrive()
          if (!fresh) {
            updateDocument(doc.id, { status: 'error', error: 'Session expired' })
            return false
          }
          driveRef.current = fresh
          result = await doUpload(fresh)
        } else {
          throw err
        }
      }

      await exhibitorBoothsApi.createDocument(targetBoothId, {
        driveFileId: result.fileId,
        driveFileUrl: result.webViewLink,
        fileName: doc.file.name,
        fileType: doc.type,
        mimeType: doc.file.type || undefined,
        sizeBytes: doc.file.size,
        isPublic: true,
      })
      updateDocument(doc.id, {
        status: 'done',
        progress: 100,
        driveFileId: result.fileId,
        driveFileUrl: result.webViewLink,
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed'
      updateDocument(doc.id, { status: 'error', error: message })
      return false
    }
  }

  const runUploads = async (
    targetBoothId: string,
    eventName: string,
    docs: DocumentEntry[],
  ): Promise<{ ok: boolean; allSucceeded: boolean }> => {
    const accessToken = await fetchFreshDriveToken()
    if (!accessToken) return { ok: false, allSucceeded: false }

    const driveRef = { current: new GoogleDriveClient(accessToken) }

    const refreshDrive = async (): Promise<GoogleDriveClient | null> => {
      const fresh = await fetchFreshDriveToken()
      if (!fresh) return null
      const next = new GoogleDriveClient(fresh)
      driveRef.current = next
      return next
    }

    let eventFolderId: string
    try {
      eventFolderId = await buildEventFolder(driveRef.current, eventName)
    } catch (err) {
      if (err instanceof GoogleDriveError && err.status === 401) {
        const fresh = await refreshDrive()
        if (!fresh) return { ok: false, allSucceeded: false }
        try {
          eventFolderId = await buildEventFolder(fresh, eventName)
        } catch (retryErr) {
          const message =
            retryErr instanceof Error ? retryErr.message : 'Drive setup failed'
          showError(`Could not prepare Drive folder — ${message}`)
          return { ok: false, allSucceeded: false }
        }
      } else {
        const message = err instanceof Error ? err.message : 'Drive setup failed'
        showError(`Could not prepare Drive folder — ${message}`)
        return { ok: false, allSucceeded: false }
      }
    }

    let allSucceeded = true
    await runWithLimit(docs, UPLOAD_CONCURRENCY, async (doc) => {
      const success = await uploadOneDocument(
        driveRef,
        eventFolderId,
        targetBoothId,
        doc,
        refreshDrive,
      )
      if (!success) allSucceeded = false
    })

    return { ok: true, allSucceeded }
  }

  const onSubmit = async (values: FormValues) => {
    if (!eventId) {
      showError('Missing event id')
      return
    }
    if (documents.length === 0) {
      showError('Please add at least one document')
      return
    }
    if (!event?.name) {
      showError('Event details not loaded yet — please wait')
      return
    }

    setIsSubmitting(true)

    let targetBoothId = boothId
    try {
      if (!targetBoothId) {
        const created = await exhibitorBoothsApi.createBooth(eventId, {
          boothName: values.boothName,
          description: values.description,
        })
        targetBoothId = created.id
        setBoothId(targetBoothId)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create booth'
      showError(`Could not create booth — ${message}`)
      setIsSubmitting(false)
      return
    }

    const docsToUpload = documents.filter((d) => d.status !== 'done')

    const { ok, allSucceeded } = await runUploads(
      targetBoothId,
      event.name,
      docsToUpload,
    )
    setIsSubmitting(false)
    if (!ok) return

    if (allSucceeded) {
      showSuccess('Booth created')
      navigate(`/events/${eventId}/booths/${targetBoothId}/qr`)
    } else {
      showInfo('Some uploads failed — retry the highlighted files')
    }
  }

  const retryDocument = async (docId: string) => {
    if (!eventId || !boothId || !event?.name) return

    const target = documents.find((d) => d.id === docId)
    if (!target) return

    setIsSubmitting(true)
    const { ok, allSucceeded } = await runUploads(boothId, event.name, [target])
    setIsSubmitting(false)
    if (!ok || !allSucceeded) return

    const remainingFailures = documents.some(
      (d) => d.id !== docId && d.status !== 'done',
    )
    if (!remainingFailures) {
      showSuccess('Booth created')
      navigate(`/events/${eventId}/booths/${boothId}/qr`)
    }
  }

  if (!eventId) {
    return (
      <Layout>
        <PageContainer>
          <Text>Missing event id.</Text>
        </PageContainer>
      </Layout>
    )
  }

  if (eventLoading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingSpinner fullPage />
        </PageContainer>
      </Layout>
    )
  }

  return (
    <Layout>
      <PageContainer>
        <Card maxW="2xl" mx="auto">
          <CardHeader>
            <Heading size="md" color="brand.900">
              New Booth
            </Heading>
            {event?.name && (
              <Text fontSize="sm" color="gray.600" mt={1}>
                {event.name}
              </Text>
            )}
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={5}>
                <FormControl isInvalid={!!errors.boothName} isRequired>
                  <FormLabel htmlFor="boothName">Booth Name</FormLabel>
                  <Input
                    id="boothName"
                    placeholder="Acme Innovations"
                    maxLength={200}
                    {...register('boothName')}
                  />
                  {errors.boothName && (
                    <FormErrorMessage>{errors.boothName.message}</FormErrorMessage>
                  )}
                </FormControl>

                <FormControl isInvalid={!!errors.description} isRequired>
                  <FormLabel htmlFor="description">Description</FormLabel>
                  <Textarea
                    id="description"
                    rows={6}
                    maxLength={5000}
                    placeholder="What does your booth showcase?"
                    {...register('description')}
                  />
                  {errors.description ? (
                    <FormErrorMessage>{errors.description.message}</FormErrorMessage>
                  ) : (
                    <FormHelperText textAlign="right">
                      {description.length} / 5000
                    </FormHelperText>
                  )}
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Documents</FormLabel>
                  <Box
                    {...getRootProps()}
                    borderWidth="2px"
                    borderStyle="dashed"
                    borderColor={isDragActive ? 'brand.700' : 'gray.300'}
                    bg={isDragActive ? 'brand.50' : 'gray.50'}
                    rounded="md"
                    p={6}
                    textAlign="center"
                    cursor={isSubmitting ? 'not-allowed' : 'pointer'}
                    opacity={isSubmitting ? 0.6 : 1}
                    transition="background-color 0.15s"
                  >
                    <input {...getInputProps()} />
                    <Text fontSize="sm" color="gray.700">
                      {isDragActive
                        ? 'Drop the files here'
                        : 'Drag & drop or click to add files'}
                    </Text>
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Images or PDF, up to 10 MB each
                    </Text>
                  </Box>
                  <FormHelperText>At least one file required.</FormHelperText>
                </FormControl>

                {documents.length > 0 && (
                  <Stack spacing={3}>
                    {documents.map((doc) => (
                      <DocumentRow
                        key={doc.id}
                        doc={doc}
                        previewUrl={previewUrls.get(doc.id)}
                        disabled={isSubmitting}
                        onRemove={() => removeDocument(doc.id)}
                        onTypeChange={(t) => setDocumentType(doc.id, t)}
                        onRetry={() => retryDocument(doc.id)}
                      />
                    ))}
                  </Stack>
                )}

                <HStack justify="flex-end" spacing={4}>
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/events/${eventId}`)}
                    isDisabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    bg="brand.800"
                    color="white"
                    _hover={{ bg: 'brand.700' }}
                    isLoading={isSubmitting}
                    loadingText={boothId ? 'Uploading…' : 'Creating…'}
                    isDisabled={documents.length === 0}
                  >
                    {boothId ? 'Retry Failed Uploads' : 'Create Booth'}
                  </Button>
                </HStack>
              </Stack>
            </form>
          </CardBody>
        </Card>
      </PageContainer>
    </Layout>
  )
}

interface DocumentRowProps {
  doc: DocumentEntry
  previewUrl: string | undefined
  disabled: boolean
  onRemove: () => void
  onTypeChange: (type: ExhibitorDocumentFileType) => void
  onRetry: () => void
}

function DocumentRow({
  doc,
  previewUrl,
  disabled,
  onRemove,
  onTypeChange,
  onRetry,
}: DocumentRowProps) {
  const isImage = doc.file.type.startsWith('image/')
  const sizeKb = Math.round(doc.file.size / 1024)
  const showProgress = doc.status === 'uploading'

  return (
    <Box
      borderWidth="1px"
      borderColor={doc.status === 'error' ? 'red.300' : 'gray.200'}
      rounded="md"
      p={3}
      bg="white"
    >
      <HStack spacing={3} align="flex-start">
        <Box
          w="56px"
          h="56px"
          rounded="md"
          bg="gray.100"
          overflow="hidden"
          flexShrink={0}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {isImage && previewUrl ? (
            <Image
              src={previewUrl}
              alt={doc.file.name}
              w="full"
              h="full"
              objectFit="cover"
            />
          ) : (
            <Text fontSize="xs" fontWeight="bold" color="gray.600">
              PDF
            </Text>
          )}
        </Box>

        <VStack align="stretch" spacing={1} flex={1} minW={0}>
          <HStack justify="space-between" align="flex-start">
            <Box minW={0}>
              <Text fontSize="sm" fontWeight="medium" noOfLines={1}>
                {doc.file.name}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {sizeKb} KB
              </Text>
            </Box>
            <HStack>
              <StatusBadge status={doc.status} />
              <IconButton
                aria-label="Remove file"
                size="xs"
                variant="ghost"
                onClick={onRemove}
                isDisabled={disabled || doc.status === 'uploading'}
              >
                ✕
              </IconButton>
            </HStack>
          </HStack>

          <HStack spacing={2}>
            <Select
              size="sm"
              value={doc.type}
              onChange={(e) =>
                onTypeChange(e.target.value as ExhibitorDocumentFileType)
              }
              isDisabled={disabled || doc.status === 'uploading' || doc.status === 'done'}
              maxW="160px"
            >
              <option value="brochure">Brochure</option>
              <option value="card">Card</option>
            </Select>
            {doc.status === 'error' && (
              <Button size="xs" variant="outline" onClick={onRetry} isDisabled={disabled}>
                Retry
              </Button>
            )}
          </HStack>

          {showProgress && (
            <Progress
              value={doc.progress}
              size="xs"
              colorScheme="brand"
              hasStripe
              isAnimated
            />
          )}
          {doc.status === 'error' && doc.error && (
            <Text fontSize="xs" color="red.500">
              {doc.error}
            </Text>
          )}
        </VStack>
      </HStack>
    </Box>
  )
}

function StatusBadge({ status }: { status: DocStatus }) {
  switch (status) {
    case 'pending':
      return <Badge colorScheme="gray">Pending</Badge>
    case 'uploading':
      return <Badge colorScheme="blue">Uploading</Badge>
    case 'done':
      return <Badge colorScheme="green">Done</Badge>
    case 'error':
      return <Badge colorScheme="red">Failed</Badge>
  }
}
