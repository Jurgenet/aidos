/**
 * Глобальные операции над тегами.
 *
 * Теги — это inline-строки в FileModel.tags, отдельной коллекции нет.
 * Здесь только агрегаты (list) и bulk-операции (rename/delete) по всем
 * файлам, у которых этот тег есть.
 */

export type TagCount = {
  name: string
  count: number
}

export type TagRenameResult = {
  from: string
  to: string
  affected: number
}

export type TagDeleteResult = {
  name: string
  affected: number
}
