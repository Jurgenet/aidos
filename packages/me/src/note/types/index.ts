import { z } from 'zod'

/**
 * Общая форма пользовательского ввода для Note — задаётся ОДИН раз.
 * Из неё собираются `createNoteSchema` (== этот же), `updateNoteSchema`
 * (partial) и `noteSchema` (extend с серверными полями).
 */
const noteInputSchema = z.object({
  title: z.string().min(1).max(200),
  // content — markdown-простыня, 0..10000 символов. На UI пока single-line
  // (UiInput не поддерживает textarea); multi-line добавим в @aid/mq.
  // default('') — согласовано с Mongoose (default: ''), чтобы при create
  // без поля content был пустой строкой, а не undefined.
  content: z.string().max(10_000).default(''),
  // links — массив URL. На форме вводится как comma-separated строка,
  // парсится в store/controller.
  links: z.array(z.string().url()).max(50).optional().default([]),
  // tags — массив коротких строк. Аналогично comma-separated.
  tags: z.array(z.string().min(1).max(50)).max(20).optional().default([]),
  isPinned: z.boolean().optional().default(false),
})

/** Тело POST /note — создание. */
export const createNoteSchema = noteInputSchema
export type CreateNoteInput = z.infer<typeof createNoteSchema>

/** Тело PATCH /note/:id — частичное обновление. */
export const updateNoteSchema = createNoteSchema.partial()
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>

/** Полная сущность Note — то, что возвращает API. */
export const noteSchema = noteInputSchema.extend({
  id: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})
export type Note = z.infer<typeof noteSchema>
