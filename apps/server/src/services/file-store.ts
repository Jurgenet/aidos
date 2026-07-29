import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

/**
 * Запись и удаление файлов на диске. Каталог — `env.FILE_STORE_DIR`
 * (по дефолту `.data/file_store`, в compose `/files` через bind-mount
 * `-.data/file_store:/files`).
 *
 * Безопасность:
 * - На диск пишется ТОЛЬКО сгенерированный `storedName` (UUID + ext),
 *   не `originalName` от пользователя — никаких path traversal
 * - `originalName` хранится в БД и используется только в UI /
 *   Content-Disposition (с экранированием)
 * - При удалении проверяем, что путь внутри FILE_STORE_DIR (resolve +
 *   startsWith), иначе отказываем
 */

const FILE_STORE_DIR = env.FILE_STORE_DIR

/** Сгенерировать уникальное имя файла на диске из оригинального. */
function makeStoredName(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase().slice(0, 16) // не более 16 символов на расширение
  return `${randomUUID()}${ext}`
}

/** Содержимое файла + его тип из multer. */
export type SaveInput = {
  buffer: Buffer
  originalName: string
  mimeType: string
  size: number
}

/** Результат записи. */
export type SaveResult = {
  storedName: string
  size: number
}

export async function saveFile(input: SaveInput): Promise<SaveResult> {
  await fs.mkdir(FILE_STORE_DIR, { recursive: true })
  const storedName = makeStoredName(input.originalName)
  const target = path.join(FILE_STORE_DIR, storedName)
  await fs.writeFile(target, input.buffer)
  return { storedName, size: input.size }
}

/** Безопасно удалить файл (проверка на path traversal). */
export async function deleteFile(storedName: string): Promise<void> {
  const target = path.resolve(FILE_STORE_DIR, storedName)
  const root = path.resolve(FILE_STORE_DIR) + path.sep
  if (!target.startsWith(root) && target !== path.resolve(FILE_STORE_DIR)) {
    // Не позволим выйти за пределы FILE_STORE_DIR даже через `..`
    throw new Error(`path traversal attempt: ${storedName}`)
  }
  try {
    await fs.unlink(target)
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
      // ENOENT = уже нет файла (норма, гонка с ручным удалением),
      // пробрасываем остальные ошибки, но не валим DB-delete.
      logger.error({ err: e, storedName }, 'failed to delete file from disk')
      throw e
    }
  }
}

/** Проверить, что файл существует на диске (для отдачи). */
export async function fileExists(storedName: string): Promise<boolean> {
  try {
    const target = path.resolve(FILE_STORE_DIR, storedName)
    const root = path.resolve(FILE_STORE_DIR) + path.sep
    if (!target.startsWith(root) && target !== path.resolve(FILE_STORE_DIR)) {
      return false
    }
    await fs.access(target)
    return true
  } catch {
    return false
  }
}

/** Абсолютный путь к файлу на диске (для createReadStream). */
export function resolveFilePath(storedName: string): string {
  return path.resolve(FILE_STORE_DIR, storedName)
}
