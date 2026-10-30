import axios from 'axios'
import { useCallback, useState } from 'react'

// A bare instance so the admin token is never sent to Cloudinary.
const cloudinary = axios.create()

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024

export function validateImage(file) {
  if (!IMAGE_TYPES.includes(file?.type)) return 'Only JPG, PNG or WEBP images are allowed'
  if (file.size > MAX_IMAGE_SIZE) return 'Image must be 5 MB or smaller'
  return null
}

// upload(file, { onProgress }) resolves to the image's secure_url.
export function useImageUpload() {
  const [pending, setPending] = useState(0)
  const [error, setError] = useState(null)

  const upload = useCallback(async (file, { onProgress } = {}) => {
    const fail = (message) => {
      setError(message)
      throw new Error(message)
    }
    const invalid = validateImage(file)
    if (invalid) fail(invalid)
    if (!CLOUD_NAME || !UPLOAD_PRESET) fail('Image upload is not configured')

    const body = new FormData()
    body.append('file', file)
    body.append('upload_preset', UPLOAD_PRESET)

    setError(null)
    setPending((n) => n + 1)
    try {
      const { data } = await cloudinary.post(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, body, {
        onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
      })
      return data.secure_url
    } catch (err) {
      return fail(err.response?.data?.error?.message ?? 'Upload failed. Please try again.')
    } finally {
      setPending((n) => n - 1)
    }
  }, [])

  return { upload, isUploading: pending > 0, error }
}
