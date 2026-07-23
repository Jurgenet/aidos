import { Schema, model } from 'mongoose'

/**
 * Mongoose-схема Device.
 *
 * Поля:
 * - `title` — название (1..200 символов), обязательное
 * - `image` — URL или путь до картинки, опционально
 * - `model` — модель, опционально
 * - `vendor` — производитель/бренд, опционально
 * - `location` — где находится, опционально
 * - `order` — для ручной сортировки, default 0
 * - `tags` — массив коротких строк, default []
 * - `description` — свободный текст, опционально
 * - `isPinned` — закреплено ли, default false
 * - `isZipped` — упаковано ли (на хранении), default false
 * - `isBroken` — сломано ли, default false
 * - `createdAt`/`updatedAt` — опция `timestamps`
 */
const deviceSchema = new Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    image: { type: String, required: false, default: '', maxlength: 500 },
    model: { type: String, required: false, default: '', maxlength: 100 },
    vendor: { type: String, required: false, default: '', maxlength: 100 },
    location: { type: String, required: false, default: '', maxlength: 200 },
    order: { type: Number, required: false, default: 0, min: 0 },
    tags: { type: [String], required: false, default: [] },
    description: { type: String, required: false, default: '', maxlength: 2000 },
    isPinned: { type: Boolean, required: false, default: false },
    isZipped: { type: Boolean, required: false, default: false },
    isBroken: { type: Boolean, required: false, default: false },
  },
  { timestamps: true },
)

export const DeviceModel = model('Device', deviceSchema)
