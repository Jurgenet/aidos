import { Types } from 'mongoose'
import { FileModel } from './model.js'
import { HttpError } from '../../shared/http-error/index.js'
import { recordLog } from '../../log/server/index.js'
import type { FileMeta, UploadedFile } from '../types/index.js'

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
  }
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

  async list(): Promise<FileMeta[]> {
    const docs = await FileModel.find().sort({ uploadedAt: -1 }).lean()
    return docs.map(toMeta)
  },

  /**
   * Зарегистрировать уже сохранённый на диск файл. Вызывается из
   * роута после `fileStore.save()`.
   */
  async register(
    uploaded: UploadedFile,
    storedName: string,
  ): Promise<FileMeta> {
    const created = await FileModel.create({
      originalName: uploaded.originalname,
      storedName,
      mimeType: uploaded.mimetype,
      size: uploaded.size,
    })
    const meta = toMeta(created.toObject())
    await recordLog({
      entity: 'file',
      action: 'create',
      documentId: meta.id,
      after: { id: meta.id, originalName: meta.originalName, mimeType: meta.mimeType, size: meta.size },
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

  async update(id: string, input: { originalName?: string }): Promise<FileMeta> {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const afterDoc: any = await FileModel.findByIdAndUpdate(id, update, { new: true }).lean()
    if (!afterDoc) throw new FileNotFoundError(id)
    const after = toMeta(afterDoc)
    await recordLog({
      entity: 'file',
      action: 'update',
      documentId: id,
      before: { id, originalName: beforeDoc.originalName, mimeType: beforeDoc.mimeType, size: beforeDoc.size },
      after: { id: after.id, originalName: after.originalName, mimeType: after.mimeType, size: after.size },
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
      before: { id: meta.id, originalName: meta.originalName, mimeType: meta.mimeType, size: meta.size },
    })
    return { meta, storedName: doc.storedName as string }
  },
}
