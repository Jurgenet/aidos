import { Schema, model } from 'mongoose'

/**
 * Mongoose-схема User.
 *
 * Поля:
 * - `email` — уникальный, валидируется zod-схемой в контроллере
 * - `name` — 1..100 символов
 * - `role` — admin | user | manager (по умолчанию user)
 * - `createdAt`/`updatedAt` — проставляются автоматически опцией `timestamps`
 */
const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true, minlength: 1, maxlength: 100 },
    role: {
      type: String,
      enum: ['admin', 'user', 'manager'],
      required: true,
      default: 'user',
    },
  },
  { timestamps: true },
)

export const UserModel = model('User', userSchema)
