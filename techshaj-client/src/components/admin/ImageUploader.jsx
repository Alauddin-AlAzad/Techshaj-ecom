import { ArrowLeft, ImagePlus, TriangleAlert, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { IMAGE_TYPES, useImageUpload, validateImage } from '../../hooks/useImageUpload.js'
import { cn } from '../../lib/cn.js'
import Spinner from './Spinner.jsx'

const tile = 'relative aspect-square w-full overflow-hidden rounded-[10px] border border-border-strong'

// value: image urls, the first one is the main image.
export default function ImageUploader({ value = [], onChange, max = 8, multiple = true }) {
  const { upload } = useImageUpload()
  const [uploads, setUploads] = useState([])
  const [error, setError] = useState(null)
  const inputRef = useRef(null)
  const inputId = useId()
  // Uploads finish one after another; keep the newest list so none overwrite each other.
  const latest = useRef(value)
  useEffect(() => {
    latest.current = value
  }, [value])

  const slots = max - value.length - uploads.length

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList ?? [])
    inputRef.current.value = ''
    if (!files.length) return
    setError(null)
    if (files.length > slots) setError(`You can add up to ${max} images`)

    for (const file of files.slice(0, Math.max(slots, 0))) {
      const invalid = validateImage(file)
      if (invalid) {
        setError(invalid)
        continue
      }
      const id = crypto.randomUUID()
      setUploads((list) => [...list, { id, progress: 0 }])
      try {
        const url = await upload(file, { onProgress: (progress) => setUploads((list) => list.map((u) => (u.id === id ? { ...u, progress } : u))) })
        latest.current = [...latest.current, url]
        onChange(latest.current)
      } catch (err) {
        setError(err.message)
      } finally {
        setUploads((list) => list.filter((u) => u.id !== id))
      }
    }
  }

  const remove = (i) => onChange(value.filter((_, j) => j !== i))
  const moveLeft = (i) => {
    const next = [...value]
    ;[next[i - 1], next[i]] = [next[i], next[i - 1]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5">
        {value.map((url, i) => (
          // Seeded products can repeat the same placeholder url, so the index is part of the key.
          <li key={`${i}-${url}`} className={cn(tile, 'group bg-fill-soft')}>
            <img src={url} alt={`Image ${i + 1}`} className="size-full object-cover" />
            {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">MAIN</span>}
            <div className="absolute top-1.5 right-1.5 flex gap-1">
              {i > 0 && (
                <button type="button" onClick={() => moveLeft(i)} aria-label={`Move image ${i + 1} left`} className="flex size-9 items-center justify-center rounded-full bg-white/90 md:size-7 text-text shadow-sm hover:bg-white">
                  <ArrowLeft size={14} />
                </button>
              )}
              <button type="button" onClick={() => remove(i)} aria-label={`Remove image ${i + 1}`} className="flex size-9 items-center justify-center rounded-full bg-white/90 md:size-7 text-error shadow-sm hover:bg-white">
                <X size={14} />
              </button>
            </div>
          </li>
        ))}
        {uploads.map((u) => (
          <li key={u.id} className={cn(tile, 'flex flex-col items-center justify-center gap-1.5 bg-fill-soft text-primary')} role="status" aria-label={`Uploading ${u.progress}%`}>
            <Spinner size={22} />
            <span className="text-label-sm text-text-muted">{u.progress}%</span>
          </li>
        ))}
        {slots > 0 && (
          <li>
            <label
              htmlFor={inputId}
              className={cn(tile, 'flex cursor-pointer flex-col items-center justify-center gap-1.5 border-dashed text-text-muted hover:border-primary hover:text-primary')}
            >
              <ImagePlus size={22} />
              <span className="text-label-sm">Add image</span>
            </label>
            <input
              ref={inputRef}
              id={inputId}
              type="file"
              accept={IMAGE_TYPES.join(',')}
              multiple={multiple}
              onChange={(e) => handleFiles(e.target.files)}
              className="sr-only"
            />
          </li>
        )}
      </ul>
      <p className="text-body-sm text-text-muted">
        JPG, PNG or WEBP, up to 5 MB each. {value.length}/{max} images.
      </p>
      {error && (
        <p role="alert" className="flex items-center gap-[5px] text-body-sm font-medium text-error">
          <TriangleAlert size={13} className="shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
