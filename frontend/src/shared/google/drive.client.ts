const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'
const FOLDER_MIME = 'application/vnd.google-apps.folder'

export class GoogleDriveError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GoogleDriveError'
    this.status = status
  }
}

export interface UploadResult {
  fileId: string
  webViewLink: string
}

export class GoogleDriveClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  private authHeader(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}` }
  }

  private async parseError(response: Response, fallback: string): Promise<never> {
    let detail = ''
    try {
      const body = await response.json()
      detail = body?.error?.message ?? ''
    } catch {
      // body wasn't JSON; ignore
    }
    throw new GoogleDriveError(
      detail ? `${fallback}: ${detail}` : fallback,
      response.status,
    )
  }

  async ensureFolder(name: string, parentId: string = 'root'): Promise<string> {
    const escapedName = name.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
    const q = `name='${escapedName}' and mimeType='${FOLDER_MIME}' and '${parentId}' in parents and trashed=false`
    const params = new URLSearchParams({ q, fields: 'files(id,name)', pageSize: '1' })

    const searchRes = await fetch(`${DRIVE_API}/files?${params.toString()}`, {
      method: 'GET',
      headers: this.authHeader(),
    })

    if (!searchRes.ok) {
      await this.parseError(searchRes, 'Drive folder lookup failed')
    }

    const searchBody = (await searchRes.json()) as { files?: Array<{ id: string }> }
    const existing = searchBody.files?.[0]
    if (existing?.id) return existing.id

    const createRes = await fetch(`${DRIVE_API}/files?fields=id`, {
      method: 'POST',
      headers: { ...this.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        mimeType: FOLDER_MIME,
        parents: [parentId],
      }),
    })

    if (!createRes.ok) {
      await this.parseError(createRes, 'Drive folder creation failed')
    }

    const createBody = (await createRes.json()) as { id: string }
    return createBody.id
  }

  uploadFile(
    file: File,
    folderId: string,
    onProgress?: (pct: number) => void,
  ): Promise<UploadResult> {
    const boundary = `meetsync-${Math.random().toString(36).slice(2)}-${Date.now()}`
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metadata = {
      name: file.name,
      parents: [folderId],
    }

    const metadataPart =
      `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`
    const filePartHeader =
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`

    const body = new Blob([
      delimiter,
      metadataPart,
      delimiter,
      filePartHeader,
      file,
      closeDelimiter,
    ])

    const url = `${UPLOAD_API}/files?uploadType=multipart&fields=id,webViewLink`

    return new Promise<UploadResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`)
      xhr.setRequestHeader('Content-Type', `multipart/related; boundary=${boundary}`)

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            onProgress((event.loaded / event.total) * 100)
          }
        })
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const parsed = JSON.parse(xhr.responseText) as {
              id: string
              webViewLink: string
            }
            resolve({ fileId: parsed.id, webViewLink: parsed.webViewLink })
          } catch {
            reject(new GoogleDriveError('Drive upload returned malformed JSON', xhr.status))
          }
          return
        }

        let detail = ''
        try {
          const parsed = JSON.parse(xhr.responseText)
          detail = parsed?.error?.message ?? ''
        } catch {
          // non-JSON body; ignore
        }
        const message = detail
          ? `Drive upload failed: ${detail}`
          : `Drive upload failed (${xhr.status})`
        reject(new GoogleDriveError(message, xhr.status))
      })

      xhr.addEventListener('error', () => {
        reject(new GoogleDriveError('Network error during Drive upload', 0))
      })
      xhr.addEventListener('abort', () => {
        reject(new GoogleDriveError('Drive upload aborted', 0))
      })

      xhr.send(body)
    })
  }

  async setPublicPermission(fileId: string): Promise<void> {
    const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}/permissions`, {
      method: 'POST',
      headers: { ...this.authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'anyone', role: 'reader' }),
    })

    if (!res.ok) {
      await this.parseError(res, 'Drive permission update failed')
    }
  }
}
