// components/ui/file-upload.tsx
'use client'

import { useRef } from 'react'

type Props = {
  action: (fd: FormData) => void | Promise<any>
  name?: string
  accept?: string
  multiple?: boolean
}

export function FileUpload({
  action,
  name = 'images',
  accept = 'image/*',
  multiple = true,
}: Props) {
  const ref = useRef<HTMLFormElement>(null)

  return (
    <form action={action} encType="multipart/form-data" ref={ref}>
      <input
        type="file"
        name={name}
        accept={accept}
        multiple={multiple}
        onChange={() => ref.current?.requestSubmit()}
        className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-gray-50"
      />
    </form>
  )
}
