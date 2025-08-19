'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type Kind = 'video' | 'tour'

export function KindSelect({
  value,
  onChange,
}: {
  value: Kind
  onChange: (k: Kind) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor="kind">Type</Label>
      <Select value={value} onValueChange={(v) => onChange(v as Kind)}>
        <SelectTrigger id="kind" className="h-9">
          <SelectValue placeholder="Select type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="video">Video (YouTube/Vimeo)</SelectItem>
          <SelectItem value="tour">360 Tour (Matterport)</SelectItem>
        </SelectContent>
      </Select>
      <input type="hidden" name="kind" value={value} />
    </div>
  )
}
