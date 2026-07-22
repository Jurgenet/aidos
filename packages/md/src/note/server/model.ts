import { Schema, model } from 'mongoose'

/**
 * Mongoose-схема Note.
 *
 * Поля:
 * - `title` — заголовок (1..200 символов), обязательное
 * - `content` — markdown-простыня, опционально
 * - `links` — массив URL, опционально (default [])
 * - `tags` — массив коротких строк-тегов, опционально (default [])
 * - `isPinned` — закреплена ли заметка, default false
 * - `createdAt`/`updatedAt` — опция `timestamps`
 */
const noteSchema = new Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    content: { type: String, required: false, default: '', maxlength: 10_000 },
    links: { type: [String], required: false, default: [] },
    tags: { type: [String], required: false, default: [] },
    isPinned: { type: Boolean, required: false, default: false },
  },
  { timestamps: true },
)

export const NoteModel = model('Note', noteSchema)
