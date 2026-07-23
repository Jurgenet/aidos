/**
 * Server-часть модуля User: модель, сервис, контроллер, роутер.
 * Импортируется через `@aid/me/user/server` (apps/server).
 */
export { UserModel } from './model.js'
export { userService, UserNotFoundError, UserAlreadyExistsError } from './service.js'
export { userController } from './controller.js'
export { userRouter } from './router.js'
