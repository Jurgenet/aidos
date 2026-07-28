# AGENTS.md

Рабочие инструкции для AI-агентов в проекте AID.

> Файл читается opencode, aider, Cursor и подобными инструментами. Дублировать эти же правила в `README.md` не нужно — там оставлена ссылка.

## Контекст

- Проект: AID — Data Operation System, личный монорепо одного разработчика
- Стек: TypeScript ^6 (ES2022, NodeNext), NodeJS ^24, pnpm 10 workspaces
- Приложения: `apps/server` (Express 5, Mongoose 9, pino), `apps/client` (Quasar 2, Vue 3, Pinia)
- Пакеты: `mq` (UI-кит), `md` (модули сущностей), `mu` (утилиты)
- Тесты: Vitest, E2E: Playwright
- БД: MongoDB ^8, контейнеризация: Docker
- Документация архитектурных решений: [docs/ADR.md](docs/ADR.md)

## Базовые принципы

- Один разработчик — не плодить процессы и абстракции ради процессов
- Смело предлагать breaking changes
- `git commit` — **только** после явного указания разработчика
- Не обновлять git-конфиг, не пушить, не открывать PR без запроса

## Стайлгайд

- Комментарии на русском языке
- Без точек с запятой
- Пробелы вместо табуляции
- Одинарные кавычки вместо двойных
- `async/await` вместо цепочек `.then()`
- Не добавлять комментарии в код, если об этом не попросили явно

## Скрипты

Все команды из корня монорепо (`C:\_dev\aidos`):

- `pnpm install` — установка зависимостей
- `pnpm dev` — параллельный запуск server + client
- `pnpm dev:server` / `pnpm dev:client` / `pnpm dev:electron` — по отдельности
- `pnpm -r build` — сборка всех пакетов и приложений
- `pnpm -r test` — тесты (Vitest)
- `pnpm e2e` / `pnpm e2e:install` — Playwright
- `pnpm -r typecheck` — TypeScript
- `pnpm -r lint` / `pnpm -r lint:fix` — ESLint
- `pnpm format` / `pnpm format:check` — Prettier
- `pnpm clean` — удалить `dist` во всех пакетах

## Чеклист перед сдачей работы

Без CI это единственный фильтр. Прогонять **перед** сообщением «готово»:

- [ ] `pnpm install` — без ошибок и предупреждений peer-deps
- [ ] `pnpm -r lint` — без ошибок (warnings осознанные)
- [ ] `pnpm -r test` — все тесты зелёные, новый код покрыт хотя бы happy-path тестом
- [ ] `pnpm -r build` — все пакеты и приложения собираются
- [ ] `pnpm -r typecheck` — TypeScript без `any`-костылей в публичных API
- [ ] Сценарий из задачи проверен вручную в dev-режиме (`pnpm dev`)
- [ ] Diff пересмотрен: нет закомментированного кода, дебаг-логов, мёртвых файлов
- [ ] Если менялся публичный контракт (типы в `md`, API-роуты, схемы БД) — отражено в [docs/ADR.md](docs/ADR.md)
- [ ] Если менялся стек или инфраструктура — обновлён соответствующий раздел README

## Коммиты

Правила определены в настройках субагента `@committer`. Самостоятельно не коммитить — ждать явного указания разработчика.

## Конвенции кодовой базы

- Сервер: Express-middleware в `apps/server/src/middleware`, роуты собираются в `routes/index.ts`, ошибки через `HttpError` из `middleware/error-handler.ts`
- Клиент: alias `@/` указывает на `src/`, proxy `/api` → `:3000` настроен в `vite.config.ts`
- Сущности (`packages/md`): содержат весь скоуп — типы, модель, сервис, контроллер, роутер, store-фабрику, quasar-формы
- Утилиты (`packages/mu`): чистые функции, модули группируются по типу (`array`, `string`, ...)
- UI-кит (`packages/mq`): компоненты-обёртки над Quasar с префиксом `Ui*` (`UiButton`, `UiInput`, `UiTable`)
