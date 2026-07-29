/**
 * Доменные типы файлового хранилища.
 *
 * `storedName` клиенту НЕ отдаётся — он внутренний, для удаления
 * и отдачи с диска. Клиент работает через `id` (он же ObjectId).
 */

export type FileMeta = {
  id: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
}

/** То, что приходит от multer (memoryStorage). */
export type UploadedFile = {
  originalname: string
  mimetype: string
  size: number
  buffer: Buffer
}
