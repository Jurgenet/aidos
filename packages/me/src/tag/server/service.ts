import { FileModel } from '../../file/server/model.js'
import { recordLog } from '../../log/server/index.js'
import { HttpError } from '../../shared/http-error/index.js'
import type { TagCount, TagDeleteResult, TagRenameResult } from '../types/index.js'

/** Нормализация имени тега: trim + lowercase. */
function normalize(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Список всех уникальных тегов с количеством файлов. Сортировка:
 * по убыванию count, потом по имени. Делаем через aggregate —
 * самый быстрый способ (один проход по индексу tags).
 */
export async function listTags(): Promise<TagCount[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows: any[] = await FileModel.aggregate([
    { $unwind: '$tags' },
    { $group: { _id: '$tags', count: { $sum: 1 } } },
    { $project: { _id: 0, name: '$_id', count: 1 } },
    { $sort: { count: -1, name: 1 } },
  ])
  return rows.map((r) => ({ name: String(r.name), count: Number(r.count) }))
}

/**
 * Переименовать тег `from` в `to` во всех файлах, у которых он есть.
 * Idempotent: если `from` нигде нет, возвращает affected=0.
 * Нормализация (lowercase/trim) применяется к обоим.
 *
 * Reject: если `to` уже существует у какого-то файла — слияние не
 * делаем (это семантически двусмысленная операция), отвечаем 409.
 */
export async function renameTag(from: string, to: string): Promise<TagRenameResult> {
  const fromN = normalize(from)
  const toN = normalize(to)
  if (fromN === '') throw new HttpError(400, 'tag name cannot be empty')
  if (toN === '') throw new HttpError(400, 'new tag name cannot be empty')
  if (fromN === toN) {
    // no-op
    return { from: fromN, to: toN, affected: 0 }
  }
  // Проверяем, не существует ли уже `to` — иначе слияние
  const existingTo = await FileModel.exists({ tags: toN })
  if (existingTo) {
    throw new HttpError(409, `tag '${toN}' already exists; merge not supported`)
  }
  // Меняем через aggregation pipeline update — MongoDB умеет менять
  // элементы массива через $map, в отличие от обычного update.
  // Mongoose 9 требует явный флаг `updatePipeline: true` для массивных
  // обновлений, иначе кидает MongooseError на этапе валидации.
  const result = await FileModel.updateMany(
    { tags: fromN },
    [
      {
        $set: {
          tags: {
            $map: {
              input: '$tags',
              as: 't',
              in: { $cond: [{ $eq: ['$$t', fromN] }, toN, '$$t'] },
            },
          },
        },
      },
    ],
    { updatePipeline: true },
  )
  const affected = result.modifiedCount ?? 0
  if (affected > 0) {
    await recordLog({
      entity: 'file',
      action: 'update',
      documentId: `tag:${fromN}`,
      before: { tag: fromN },
      after: { tag: toN, affectedFiles: affected },
    })
  }
  return { from: fromN, to: toN, affected }
}

/**
 * Удалить тег `name` из всех файлов (через $pull).
 * Idempotent: если тега нигде нет, affected=0.
 */
export async function deleteTag(name: string): Promise<TagDeleteResult> {
  const nameN = normalize(name)
  if (nameN === '') throw new HttpError(400, 'tag name cannot be empty')
  const result = await FileModel.updateMany(
    { tags: nameN },
    { $pull: { tags: nameN } },
  )
  const affected = result.modifiedCount ?? 0
  if (affected > 0) {
    await recordLog({
      entity: 'file',
      action: 'update',
      documentId: `tag:${nameN}`,
      before: { tag: nameN },
      after: { tag: null, affectedFiles: affected },
    })
  }
  return { name: nameN, affected }
}
