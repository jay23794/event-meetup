import { useForm } from 'react-hook-form'
import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  HStack,
  Image,
  Box,
} from '@chakra-ui/react'
import { ExtractedFields } from '../types'

interface ScanReviewProps {
  imageUrl: string
  extractedFields: ExtractedFields
  onConfirm: (fields: ExtractedFields) => void
  onDelete: () => void
  onRescan: () => void
}

export function ScanReview({
  imageUrl,
  extractedFields,
  onConfirm,
  onDelete,
  onRescan,
}: ScanReviewProps) {
  const { register, handleSubmit, getValues } = useForm<ExtractedFields>({
    defaultValues: extractedFields,
  })

  return (
    <form onSubmit={handleSubmit(() => onConfirm(getValues()))}>
      <VStack spacing={4} w="full">
        <Box borderRadius="md" overflow="hidden" bg="brand.300" p={2}>
          <Image
            src={imageUrl}
            alt="Scan preview"
            maxH="120px"
            objectFit="cover"
          />
        </Box>

        <VStack spacing={3} w="full">
          <FormControl>
            <FormLabel htmlFor="name" fontSize="sm">
              Name
            </FormLabel>
            <Input id="name" size="sm" {...register('name')} />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="company" fontSize="sm">
              Company
            </FormLabel>
            <Input id="company" size="sm" {...register('company')} />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="title" fontSize="sm">
              Title
            </FormLabel>
            <Input id="title" size="sm" {...register('title')} />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="phone" fontSize="sm">
              Phone
            </FormLabel>
            <Input id="phone" size="sm" {...register('phone')} />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="email" fontSize="sm">
              Email
            </FormLabel>
            <Input id="email" size="sm" type="email" {...register('email')} />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="website" fontSize="sm">
              Website
            </FormLabel>
            <Input id="website" size="sm" {...register('website')} />
          </FormControl>

          <FormControl>
            <FormLabel htmlFor="address" fontSize="sm">
              Address
            </FormLabel>
            <Input id="address" size="sm" {...register('address')} />
          </FormControl>
        </VStack>

        <HStack spacing={2} w="full" justify="space-between">
          <HStack spacing={2}>
            <Button size="sm" variant="ghost" onClick={onRescan}>
              Re-scan
            </Button>
            <Button size="sm" variant="ghost" colorScheme="red" onClick={onDelete}>
              Delete
            </Button>
          </HStack>
          <Button
            size="sm"
            type="submit"
            bg="brand.800"
            color="white"
            _hover={{ bg: 'brand.700' }}
          >
            Confirm
          </Button>
        </HStack>
      </VStack>
    </form>
  )
}
