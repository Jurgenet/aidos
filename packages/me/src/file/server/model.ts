import { Schema, model } from 'mongoose'

/**
 * Метаданные загруженного файла. Сам файл лежит на диске в
 * `FILE_STORE_DIR` (bind-mount в compose); здесь только описание.
 *
 * Поля:
 * - originalName  — как пользователь назвал файл при загрузке (для UI/download)
 * - storedName    — уникальное имя на диске (UUID + ext). Не показывается
 *                   пользователю, нужно для удаления и отдачи.
 * - mimeType      — из multer, для Content-Type при отдаче
 * - size          — в байтах
 * - uploadedAt    — время создания записи (= загрузки)
 *
 * `description` / `tags` / `linkedTo` намеренно НЕ добавляем — MVP,
 * при появлении реальных use-cases (аватары, вложения заметок) доедем.
 */
const fileSchema = new Schema(
  {
    originalName: { type: String, required: true, maxlength: 255 },
    storedName: { type: String, required: true, unique: true, maxlength: 255 },
    mimeType: { type: String, required: true, maxlength: 127 },
    size: { type: Number, required: true, min: 0 },
    // Теги — короткие строки без пробелов. Trim/lowercase в сервисе.
    // default не ставим — `toMeta` инициализирует пустым массивом для
    // документов, созданных до миграции (см. `normalizeTags`).
    tags: { type: [String] },
  },
  { timestamps: { createdAt: 'uploadedAt', updatedAt: false } },
)
// Индекс для AND-фильтра `find({tags: {$all: ['foo', 'bar']}})` и
// сортировки/выборки по тегам.
fileSchema.index({ tags: 1 })

export const FileModel = model('File', fileSchema)
