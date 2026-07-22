# Принятые решения (ADR)

Здесь фиксируем архитектурные и инфраструктурные ADR в формате коротких записей. Новая запись добавляется наверх, нумерация — обратная хронология (свежие сверху, по убыванию номера).

#### ADR-0010 — Docker-окружение для dev: Caddy как единая точка входа с авто-HTTPS

Контекст: для воспроизводимого локального dev'а нужны MongoDB + server + client, плюс HTTPS, чтобы не разводить «HTTP локально, HTTPS в проде» и тестировать secure cookies, Service Worker, `Permissions-Policy` и пр. на раннем этапе. Решение: один `Dockerfile` + `compose.yaml` с четырьмя сервисами (`mongo`, `server`, `client`, `caddy`). Caddy слушает `:80`/`:443` и сам выпускает TLS-сертификат для `localhost` через встроенный XCA (для других хостов — Let's Encrypt), HTTP автоматически редиректится на HTTPS. Проксирование: `/api/*` через `uri strip_prefix` → `server:3000`, остальное (включая WebSocket для Vite HMR) → `client:4173`. Данные Mongo — в named volume `aid-mongo-data` (переживает `docker compose down`, удаляется только `down -v` или `docker volume rm`); кэш сертификатов Caddy — в `aid-caddy-data`/`aid-caddy-config`. Сопутствующие правки: `vite.config.ts` — `host: '0.0.0.0'` + `allowedHosts: true` (Vite 5+ режет запросы из-за reverse-proxy с 403 без этой опции); `.npmrc` — `shamefully-hoist=true` (workspace-пакеты не находили `mongoose`/`zod` из своих dist-файлов при строгой изоляции pnpm). На хосте Windows: `infra/caddy/extract-ca.ps1` — одноразовый скрипт, извлекает CA из контейнера и ставит в `Local Machine\Root` (или `Current User\Root` как fallback без admin), идемпотентен. Альтернативы: nginx + `mkcert` (две движущиеся части — серт + конфиг прокси; nginx не умеет авто-HTTPS из коробки); bare `pnpm dev` без Docker (нет воспроизводимости, проблемы с MongoDB на Windows-хостах).

#### ADR-0009 — Версионирование apps/packages при коммитах (SemVer вручную)

Контекст: при росте числа пакетов в монорепо нужны простые правила бампа версий, согласованные с Conventional Commits и ролью пакета (приложение vs библиотека). Решение: SemVer `MAJOR.MINOR.PATCH`, бамп — часть самого коммита, `@committer` обновляет `version` перед `git commit`. Apps (`apps/*`) версионируются по стабильности сборки: `feat` → MINOR, `fix` → PATCH, `refactor`/`style`/`chore` без `!` → PATCH, `!`-breaking → MAJOR, `docs`/`test` → без бампа. Packages (`packages/*`) — строгий SemVer по API-поверхности: `feat` (новый экспорт) → MINOR, `fix` (без смены сигнатур) → PATCH, любой `!` → MAJOR, остальное → без бампа. Один коммит — один пакет (правило «одна логическая правка»); root `package.json` (`aid`) не бампится. Альтернативы: `changesets` / `release-please` / `nx release` — оверкилл на MVP, пересмотрим при выходе из `0.x.y`.

#### ADR-0008 — Клиент на Vue 3 + Vite + Quasar 2 (UI-kit), без `@quasar/app-vite`

Контекст: нужен современный SPA-клиент с готовыми UI-компонентами, при этом без жёсткой привязки к Quasar-CLI. Решение: `Vue 3.5` + `Vite 5` + ручной setup, Quasar 2 подключается как библиотека компонентов через `@quasar/vite-plugin`. Состояние — `Pinia`, роутинг — `vue-router 4`. Для корректной типизации в монорепо с `NodeNext` на сервере — отдельный `tsconfig.node.json` под `vite.config.ts` с `moduleResolution: "Bundler"`. UI на русском (`quasar/lang/ru`), иконки Material. Альтернативы: `@quasar/app-vite` (тянет свой opinionated CLI и не дружит с pnpm-монорепо без плясок), Nuxt/SvelteKit (избыточно для MVP).

#### ADR-0007 — MongoDB ^8 как основное хранилище

Контекст: данные слабо структурированы, схема будет эволюционировать. Решение: MongoDB 8 + Mongoose 9, без отдельной ORM/ODM-схемы. Альтернативы (Postgres + Prisma) — добавим, если появится реляционная нагрузка.

#### ADR-0006 — Vitest + ESLint + Prettier (root flat config)

Контекст: единые инструменты на весь монорепо. Решение: `vitest` для тестов (быстрее jest, нативная ESM-поддержка), `eslint` + `prettier` с плоскими конфигами в корне. Альтернативы (jest, отдельные конфиги на пакет) — лишняя сложность.

#### ADR-0005 — TS ^6, NodeNext, ES2022

Контекст: нужна максимальная совместимость с современными фичами ESM. Решение: TypeScript ^6, module resolution `NodeNext`, target `ES2022`. Альтернативы (CommonJS, ES2020) — устаревшие.

#### ADR-0004 — Свободные breaking changes

Контекст: на стадии MVP стабильность публичного API не требуется. Решение: допустимы breaking changes между коммитами, помечаем `!` и описываем в футере коммита. Когда выйдем из MVP — пересмотрим.

#### ADR-0003 — Шаринг сущностей через `md`

Контекст: модели данных нужны и фронту, и бэку. Решение: пакет `md` содержит «толстые» модули сущностей — типы, схемы, сервисы, контроллеры, роутеры, store-фабрики, quasar-компоненты. Альтернативы (отдельные DTO-пакеты, GraphQL codegen, OpenAPI) — лишний слой абстракции для текущего масштаба.

#### ADR-0002 — Self-contained, без CI/husky/ревью

Контекст: проект ведёт один человек, AI-агенты помогают с рутиной. Решение: PR-чеклист обязателен, но прогоняет его сам автор. CI/husky добавим, когда появится второй контрибьютор или стабилизируется MVP. Альтернативы (полноценный CI с первого коммита) — оверкилл на старте.

#### ADR-0001 — Monorepo на pnpm workspaces

Контекст: клиент, сервер и три пакета общего кода живут в одном репозитории. Решение: `pnpm` workspaces, `apps/*` для приложений, `packages/*` для библиотек. Альтернативы (npm/yarn workspaces, turborepo, nx) — избыточны для одного разработчика.
