/**
 * Базовый класс HTTP-ошибки. Бросается в контроллерах, ловится
 * в `errorHandler` middleware (в apps/server) и превращается в JSON-ответ.
 *
 * Доменные ошибки (`UserNotFoundError`, `UserAlreadyExistsError` и т.п.)
 * наследуются от `HttpError` — middleware обрабатывает их единообразно
 * через `instanceof HttpError`.
 */
export class HttpError extends Error {
  public readonly status: number
  public readonly details: unknown

  constructor(status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'HttpError'
    this.status = status
    this.details = details
  }
}
