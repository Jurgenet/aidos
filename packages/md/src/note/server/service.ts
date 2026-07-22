import { Types } from 'mongoose'
import { NoteModel } from './model.js'
import { HttpError } from '../../http-error/index.js'
import type { Note, CreateNoteInput, UpdateNoteInput } from '../types/index.js'

/** 404 — заметка не найдена по id (или id невалидный ObjectId). */
export class NoteNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `Note not found: ${id}`)
    this.name = 'NoteNotFoundError'
  }
}

/**
 * Приводит документ Mongoose к `Note` (id вместо _id, без служебных полей).
 * Использует `any` для lean-документа, т.к. типы Mongoose lean сильно зашумлены.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toNote(doc: any): Note {
  return {
    id: String(doc._id),
    title: doc.title,
    content: doc.content,
    links: doc.links,
    tags: doc.tags,
    isPinned: doc.isPinned,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

/** Сервисный слой Note. Бросает доменные ошибки (наследники HttpError). */
export const noteService = {
  async findById(id: string): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NoteNotFoundError(id)
    }
    const doc = await NoteModel.findById(id).lean()
    if (!doc) throw new NoteNotFoundError(id)
    return toNote(doc)
  },

  async list(filter: { isPinned?: boolean; tag?: string } = {}): Promise<Note[]> {
    // Строим query явно, чтобы undefined не превращался в WHERE field IS NULL.
    const query: Record<string, unknown> = {}
    if (filter.isPinned !== undefined) query.isPinned = filter.isPinned
    if (filter.tag !== undefined) query.tags = filter.tag
    const docs = await NoteModel.find(query).lean()
    return docs.map(toNote)
  },

  async create(input: CreateNoteInput): Promise<Note> {
    const created = await NoteModel.create(input)
    return toNote(created.toObject())
  },

  async update(id: string, input: UpdateNoteInput): Promise<Note> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NoteNotFoundError(id)
    }
    const doc = await NoteModel.findByIdAndUpdate(id, input, { new: true }).lean()
    if (!doc) throw new NoteNotFoundError(id)
    return toNote(doc)
  },

  async delete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NoteNotFoundError(id)
    }
    const result = await NoteModel.findByIdAndDelete(id)
    if (!result) throw new NoteNotFoundError(id)
  },
}
