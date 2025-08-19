// components/ui/file-upload.tsx
'use client'

import React, { useRef, useState, useTransition } from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { IconUpload, IconTrash } from '@tabler/icons-react'
import { useDropzone } from 'react-dropzone'

type ExistingImage = { id: string; url: string; alt?: string }
type Section = { title: string; images: ExistingImage[] }

type Props = {
  action?: (fd: FormData) => Promise<any> | void      // from useActionState
  removeAction?: (fd: FormData) => Promise<any> | void // from useActionState(deleteImageAction)
  onChange?: (files: File[]) => void
  name?: string
  accept?: string
  multiple?: boolean
  sections?: Section[]
}

const mainVariant = { initial: { x: 0, y: 0 }, animate: { x: 20, y: -20, opacity: 0.9 } }
const secondaryVariant = { initial: { opacity: 0 }, animate: { opacity: 1 } }

export function FileUpload({
  action,
  removeAction,
  onChange,
  name = 'images',
  accept = 'image/*',
  multiple = true,
  sections = [],
}: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [pending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submitFiles = (newFiles: File[]) => {
    if (!newFiles.length || !action) return
    const fd = new FormData()
    for (const f of newFiles) fd.append(name, f)
    startTransition(() => { void action(fd) })
  }

  const handleFileChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
    onChange?.(newFiles)
    submitFiles(newFiles)
  }

  const handleClick = () => fileInputRef.current?.click()

  const { getRootProps, isDragActive } = useDropzone({
    multiple,
    noClick: true,
    onDrop: handleFileChange,
    onDropRejected: () => {},
  })

  return (
    <div className="w-full space-y-6">
      <div className="w-full" {...getRootProps()}>
        <motion.div
          onClick={handleClick}
          whileHover="animate"
          className="p-10 group/file block rounded-lg cursor-pointer w-full relative overflow-hidden bg-white "
        >
          <input
            ref={fileInputRef}
            id="file-upload-handle"
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={(e) => handleFileChange(Array.from(e.target.files || []))}
            className="hidden"
          />
          <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] pointer-events-none">
            <GridPattern />
          </div>
          <div className="flex flex-col items-center justify-center">
            <p className="relative z-20 font-sans font-bold text-neutral-700  text-base">Upload file</p>
            <p className="relative z-20 font-sans font-normal text-neutral-400  text-base mt-2">
              Drag or drop your files here or click to upload
            </p>

            <div className="relative w-full mt-10 max-w-xl mx-auto">
              {files.length > 0 ? (
                files.map((file, idx) => (
                  <motion.div
                    key={'file' + idx}
                    layoutId={idx === 0 ? 'file-upload' : 'file-upload-' + idx}
                    className={cn(
                      'relative overflow-hidden z-40 bg-white  flex flex-col items-start justify-start md:h-24 p-4 mt-4 w-full mx-auto rounded-md',
                      'shadow-sm'
                    )}
                  >
                    <div className="flex justify-between w-full items-center gap-4">
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="text-base text-neutral-700  truncate max-w-xs">
                        {file.name}
                      </motion.p>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="rounded-lg px-2 py-1 w-fit shrink-0 text-sm text-neutral-600  shadow-input">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </motion.p>
                    </div>
                    <div className="flex text-sm md:flex-row flex-col items-start md:items-center w-full mt-2 justify-between text-neutral-600 ">
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout className="px-1 py-0.5 rounded-md bg-gray-100  ">
                        {file.type || 'binary/octet-stream'}
                      </motion.p>
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} layout>
                        modified {new Date(file.lastModified).toLocaleDateString()}
                      </motion.p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <>
                  <motion.div
                    layoutId="file-upload"
                    variants={mainVariant}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={cn(
                      'relative group-hover/file:shadow-2xl z-40 bg-white  flex items-center justify-center h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md',
                      'shadow-[0px_10px_50px_rgba(0,0,0,0.1)]'
                    )}
                  >
                    {isDragActive ? (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-neutral-600 flex flex-col items-center">
                        Drop it
                        <IconUpload className="h-4 w-4 text-neutral-600 " />
                      </motion.p>
                    ) : (
                      <IconUpload className="h-4 w-4 text-neutral-600 " />
                    )}
                  </motion.div>
                  <motion.div variants={secondaryVariant} className="absolute opacity-0 border border-dashed border-sky-400 inset-0 z-30 bg-transparent h-32 mt-4 w-full max-w-[8rem] mx-auto rounded-md" />
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {sections.length > 0 && (
        <div className="space-y-6">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-3">
              <h3 className="text-sm font-medium text-neutral-700 ">{sec.title}</h3>
              {sec.images.length === 0 ? (
                <div className="text-xs text-neutral-500">No images.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {sec.images.map((img) => (
                    <div key={img.id} className="relative group rounded-md overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.alt || ''} className="h-28 w-full object-cover" />
                      {!!removeAction && (
                        <button
                          type="button"
                          onClick={() => {
                            const fd = new FormData()
                            fd.set('imageId', img.id)
                            startTransition(() => { void removeAction(fd) })
                          }}
                          className="absolute top-1 right-1 inline-flex items-center gap-1 rounded-md bg-white/90 px-2 py-1 text-xs text-red-700 shadow hover:bg-white"
                          title="Remove"
                        >
                          <IconTrash className="h-3 w-3" />
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function GridPattern() {
  const columns = 41
  const rows = 11
  return (
    <div className="flex bg-gray-100  shrink-0 flex-wrap justify-center items-center gap-x-px gap-y-px  scale-105">
      {Array.from({ length: rows }).map((_, row) =>
        Array.from({ length: columns }).map((_, col) => {
          const index = row * columns + col
          return (
            <div
              key={`${col}-${row}`}
              className={`w-10 h-10 flex shrink-0 rounded-[2px] ${
                index % 2 === 0
                  ? 'bg-gray-50 '
                  : 'bg-gray-50 '
              }`}
            />
          )
        })
      )}
    </div>
  )
}
