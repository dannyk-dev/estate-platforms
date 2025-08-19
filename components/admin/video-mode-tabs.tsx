'use client'

import * as React from 'react'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'

export type VideoMode = 'link' | 'upload'

export function VideoModeTabs({
  value,
  onChange,
  children,
}: {
  value: VideoMode
  onChange: (v: VideoMode) => void
  children: React.ReactNode
}) {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as VideoMode)} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="link">Link</TabsTrigger>
        <TabsTrigger value="upload">Upload</TabsTrigger>
      </TabsList>
      {children}
    </Tabs>
  )
}

export { TabsContent } from '@/components/ui/tabs'
