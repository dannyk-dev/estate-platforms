import { z } from 'zod'

export const slug = z.string().min(1).max(64).regex(/^[a-z0-9-]+$/)
export const hostname = z.string().min(1).max(255).transform(v => v.toLowerCase())
  .refine(v => /^[a-z0-9.-]+$/.test(v), 'invalid hostname')
  .refine(v => v.includes('.'), 'hostname must include a dot')
export const uuid = z.string().uuid()

export const imageFile = z.custom<File>().superRefine((f, ctx) => {
  if (!(f instanceof File)) return ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'file required' })
  if (f.size === 0) return ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'empty file' })
  if (f.size > 25 * 1024 * 1024) return ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'max 25MB' })
  const type = (f as File).type || ''
  if (!/^image\/(jpeg|png|webp|avif)$/.test(type)) {
    return ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'unsupported type' })
  }
})

export const imageMeta = z.object({
  alt: z.string().max(200).optional(),
  caption: z.string().max(500).optional(),
  position: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional()
})
