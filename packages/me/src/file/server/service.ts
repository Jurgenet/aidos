import { Types } from 'mongoose'
import { FileModel } from './model.js'
import { HttpError } from '../../shared/http-error/index.js'
import { recordLog } from '../../log/server/index.js'
import type { FileMeta, FileListFilter, UploadedFile } from '../types/index.js'

/** 404 — файл не найден по id. */
export class FileNotFoundError extends HttpError {
  constructor(id: string) {
    super(404, `File not found: ${id}`)
    this.name = 'FileNotFoundError'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMeta(doc: any): FileMeta {
  return {
    id: String(doc._id),
    originalName: doc.originalName,
    mimeType: doc.mimeType,
    size: doc.size,
    uploadedAt: doc.uploadedAt instanceof Date ? doc.uploadedAt.toISOString() : String(doc.uploadedAt),
    tags: Array.isArray(doc.tags) ? doc.tags : [],
  }
}

/** Нормализация тегов: trim, lowercase, пустые отбрасываем, дедуп. */
function normalizeTags(input: readonly string[] | undefined): string[] {
  if (!input) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of input) {
    const t = raw.trim().toLowerCase()
    if (t === '') continue
    if (seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

/** Парсит comma-separated строку в массив тегов (для multipart-формы). */
export function parseTagsString(input: string | undefined): string[] {
  if (!input) return []
  return normalizeTags(input.split(','))
}

/**
 * Сохранить файл на диск и записать метаданные в БД.
 *
 * `storedName` генерируется в `services/file-store.ts` — нам нужен именно
 * он, чтобы вернуть его в БД и потом удалить. Сервис разделен на
 * две части: `apps/server/src/services/file-store.ts` пишет на диск
 * (и знает про FILE_STORE_DIR), этот пишет метаданные и пишет audit log.
 * Чтобы не тащить диск в @aid/me (он про данные, не про fs).
 */
export const fileService = {
  async findById(id: string): Promise<FileMeta> {
    if (!Types.ObjectId.isValid(id)) throw new FileNotFoundError(id)
    const doc = await FileModel.findById(id).lean()
    if (!doc) throw new FileNotFoundError(id)
    return toMeta(doc)
  },

  async list(filter: FileListFilter = {}): Promise<FileMeta[]> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {}
    if (filter.q !== undefined && filter.q !== '') {
      // Case-insensitive substring по originalName
      query.originalName = { $regex: filter.q, $options: 'i' }
    }
    if (filter.tags !== undefined && filter.tags.length > 0) {
      // AND-фильтр: файл должен содержать все указанные теги
      query.tags = { $all: filter.tags.map((t) => t.toLowerCase()) }
    }
    const docs = await FileModel.find(query).sort({ uploadedAt: -1 }).lean()
    return docs.map(toMeta)
  },

  /**
   * Зарегистрировать уже сохранённый на диск файл. Вызывается из
   * роута после `fileStore.save()`.
   */
  async register(
    uploaded: UploadedFile,
    storedName: string,
    tags: string[] = [],
  ): Promise<FileMeta> {
    const normalizedTags = normalizeTags(tags)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created = await FileModel.create({
      originalName: uploaded.originalname,
      storedName,
      mimeType: uploaded.mimetype,
      size: uploaded.size,
      tags: normalizedTags,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = toMeta((created as any).toObject())
    await recordLog({
      entity: 'file',
      action: 'create',
      documentId: meta.id,
      after: {
        id: meta.id,
        originalName: meta.originalName,
        mimeType: meta.mimeType,
        size: meta.size,
        tags: meta.tags,
      },
    })
    return meta
  },

  /** Получить и метаданные, и storedName (для отдачи файла с диска). */
  async findStoredName(id: string): Promise<{ meta: FileMeta; storedName: string }> {
    if (!Types.ObjectId.isValid(id)) throw new FileNotFoundError(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = await FileModel.findById(id).lean()
    if (!doc) throw new FileNotFoundError(id)
    return { meta: toMeta(doc), storedName: doc.storedName as string }
  },

  /**
   * Частичное обновление. `originalName` и/или `tags`. Теги присылаются
   * полным списком и заменяют собой старые (replace, не merge).
   */
  async update(
    id: string,
    input: { originalName?: string; tags?: string[] },
  ): Promise<FileMeta> {
    if (!Types.ObjectId.isValid(id)) throw new FileNotFoundError(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const beforeDoc: any = await FileModel.findById(id).lean()
    if (!beforeDoc) throw new FileNotFoundError(id)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: any = {}
    if (input.originalName !== undefined) {
      const trimmed = input.originalName.trim()
      if (trimmed === '') {
        throw new HttpError(400, 'originalName cannot be empty')
      }
      update.originalName = trimmed.slice(0, 255)
    }
    if (input.tags !== undefined) {
      update.tags = normalizeTags(input.tags)
    }
    if (Object.keys(update).length === 0) {
      // Nothing to update — return current state
      return toMeta(beforeDoc)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterDoc: any = await FileModel.findByIdAndUpdate(id, update, { new: true, setDefaultsOnInsert: false }).lean()
    if (!afterDoc) throw new FileNotFoundError(id)
    const after = toMeta(afterDoc)
    await recordLog({
      entity: 'file',
      action: 'update',
      documentId: id,
      before: {
        id,
        originalName: beforeDoc.originalName,
        mimeType: beforeDoc.mimeType,
        size: beforeDoc.size,
        tags: Array.isArray(beforeDoc.tags) ? beforeDoc.tags : [],
      },
      after: {
        id: after.id,
        originalName: after.originalName,
        mimeType: after.mimeType,
        size: after.size,
        tags: after.tags,
      },
    })
    return after
  },

  async delete(id: string): Promise<{ meta: FileMeta; storedName: string }> {
    if (!Types.ObjectId.isValid(id)) throw new FileNotFoundError(id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc: any = await FileModel.findByIdAndDelete(id)
    if (!doc) throw new FileNotFoundError(id)
    const meta = toMeta(doc)
    await recordLog({
      entity: 'file',
      action: 'delete',
      documentId: meta.id,
      before: {
        id: meta.id,
        originalName: meta.originalName,
        mimeType: meta.mimeType,
        size: meta.size,
        tags: meta.tags,
      },
    })
    return { meta, storedName: doc.storedName as string }
  },
}
