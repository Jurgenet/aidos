import { userService } from './service.js'
import { createUserSchema, updateUserSchema } from '../types/index.js'
import type { UserRole } from '../types/index.js'
import { createCrudController } from '../../shared/crud-controller.js'

/**
 * Контроллер User — собран через общий `createCrudController` factory.
 * Специфична только функция-экстрактор query-параметра `role`.
 */
export const userController = createCrudController(
  userService,
  { create: createUserSchema, update: updateUserSchema },
  (query) => {
    const role = (query as Record<string, unknown>)['role']
    return { role: typeof role === 'string' ? (role as UserRole) : undefined } as {
      role?: UserRole
    }
  },
)
