import { Schema, model } from 'mongoose'

/**
 * Mongoose-схема Account.
 *
 * Поля:
 * - `title` — название записи (1..200 символов), обязательное
 * - `group` — категория/группа (например "Email", "Banking"), обязательное
 * - `email` — опционально, валидируется zod-схемой в контроллере
 * - `login` — опционально
 * - `password` — чувствительное, `select: false` — НЕ возвращается в API по умолчанию
 *   (если нужна запись с паролем — `findById(id).select('+password')` явно)
 * - `link` — URL, опционально
 * - `description` — свободный текст, опционально
 * - `createdAt`/`updatedAt` — опция `timestamps`
 */
const accountSchema = new Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 200 },
    group: { type: String, required: true, minlength: 1, maxlength: 100 },
    email: { type: String, required: false, default: '' },
    login: { type: String, required: false, default: '' },
    password: { type: String, required: false, default: '', select: false },
    link: { type: String, required: false, default: '' },
    description: { type: String, required: false, default: '' },
  },
  { timestamps: true },
)

export const AccountModel = model('Account', accountSchema)
