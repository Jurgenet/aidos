/**
 * Server-часть модуля Device: модель, сервис, контроллер, роутер.
 * Импортируется через `@aid/md/device/server` (apps/server).
 */
export { DeviceModel } from './model.js'
export { deviceService, DeviceNotFoundError } from './service.js'
export { deviceController } from './controller.js'
export { deviceRouter } from './router.js'
