/**
 * Server-часть модуля Account: модель, сервис, контроллер, роутер.
 * Импортируется через `@aid/me/account/server` (apps/server).
 */
export { AccountModel } from './model.js'
export { accountService, AccountNotFoundError } from './service.js'
export { accountController } from './controller.js'
export { accountRouter } from './router.js'
