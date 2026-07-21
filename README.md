# AID (Data Operation System)

## Project Overview

Monorepo via pnpm, worspaces: app and packages
Self-contaned, без CI/husky/review

Main code language: TypeScript ^6, root flat confiruration ES2022, NodeNext
Testing: vitest, root flat configuration
Linting: exlint + prettier
Database: MongoDB ^8
Containers: Docker

## Core Dependencies

Logger: pino + pino-pretty

## Apps

### Client

Stack: Quasar 2, Vue 3, Pinia, SASS, TypesScript

```
apps/client/
├── package.json              # @aid/client, скрипты dev/build/typecheck/lint/preview
├── tsconfig.json             # src/ — ES2022, Bundler, DOM, vite/client
├── tsconfig.node.json        # vite.config.ts — Node-типы
├── vite.config.ts            # vue + @quasar/vite-plugin, alias @/, proxy /api→:3000
├── index.html                # entry, lang="ru"
└── src/
    ├── main.ts               # Vue + Pinia + Router + Quasar (Notify, ru, material-icons)
    ├── app.vue               # <router-view />
    ├── env.d.ts              # vite/client + .vue shim
    ├── router/index.ts       # 3 маршрута + 404
    ├── layouts/main-layout.vue     # QLayout + QHeader + QDrawer + nav
    ├── pages/index-page.vue        # /
    ├── pages/health-page.vue       # /health → fetch('/api/health/ready')
    ├── pages/about-page.vue        # /about
    ├── pages/error-not-found.vue   # 404
    ├── stores/example.ts          # Pinia setup-store
    └── css/
        ├── quasar-variables.sass  # $primary, $dark, ...
        └── app.scss
```

### Server API

Stack: NodeJS ^24, ExpressJS 5, Mongoose 9, TypesScript

```
apps/server/
├── package.json              # @aid/server, Express + Mongoose + Pino, скрипты dev/build/start
├── tsconfig.json             # extends ../../tsconfig.base.json; outDir: dist, rootDir: src
└── src/
    ├── index.ts              # Entry point: connect Mongo, start HTTP, signal handlers
    ├── app.ts                # Express app factory: JSON, logging, routes, error/404 middleware
    ├── server.ts             # HTTP lifecycle: start / graceful shutdown (close + Mongo disconnect)
    ├── config/
    │   ├── env.ts            # typed config (PORT, MONGO_URI, LOG_LEVEL, ...)
    │   ├── load-env.ts       # .env loader (без dotenv, одноразовый вызов)
    │   └── logger.ts         # Pino instance; pretty в dev, JSON в prod
    ├── db/
    │   └── mongo.ts          # Mongoose connection manager: connect, disconnect, state checks
    ├── routes/
    │   ├── index.ts          # API router aggregator (mounts health)
    │   └── health.ts         # GET /health (liveness), GET /health/ready (readiness + Mongo)
    └── middleware/
        ├── error-handler.ts  # Express error middleware + HttpError class
        └── not-found.ts      # 404 catch-all → HttpError(404)
```

## Packages

### MQ (mod quasar)

Quasar2 UI-KIT Базовых компонентов

### MD (mod modules of entities)

Библиотека модулей сущностей с типами для шеринга между Client и Server
Сущности содержат весь скоуп набора функциональности: типы, сервисы, контроллеры, роутеры, store-фабрики, quasar-компоненты и прочее...

### MU (mod utils)

Библиотека независимых утилит на TypesScript

## Рабочие инструкции для AI-агентов

### Ключевые особенности

Один разработчик
Не плодить процессы ради процессов
Смело предлагать breaking changes

### Стайлгайд

Комментарии на русском языке
Без точек с запятой
Пробелы вместо табуляции
Одинарные кавычки вместо двойных

### Правила коммитов

Правила определены в настройках субагента @committer

### Чеклист перед PR

Перед тем как считать работу готовой, прогоняем self-check. Без CI — это наш единственный фильтр.

- [ ] `pnpm install` — без ошибок и предупреждений peer-deps
- [ ] `pnpm -r lint` — без ошибок (warnings допустимы, но должны быть осознанными)
- [ ] `pnpm -r test` — все тесты зелёные, новый код покрыт хотя бы минимальным happy-path тестом
- [ ] `pnpm -r build` — все пакеты и приложения собираются
- [ ] `pnpm -r typecheck` (если выделено в скрипт) — TypeScript без `any`-костылей в публичных API
- [ ] Вручную проверен сценарий из задачи в dev-режиме (`pnpm dev`)
- [ ] Diff пересмотрен самому: нет закомментированного кода, дебаг-логов, мёртвых файлов
- [ ] Если менялся публичный контракт (типы в `md`, API-роуты, схемы БД) — отражено в [docs/ADR.md](docs/ADR.md)
- [ ] Если менялся стек или инфраструктура — обновлён соответствующий раздел README
- [ ] Коммиты прошли `git rebase -i` (squash мусорных/WIP)

### Принятые решения

Список ADR вынесен в [docs/ADR.md](docs/ADR.md).

## Roadmap

1. ~~Настройка архитектуры на MVP~~
2. ~~Базовый каркас `apps/server` (Express 5, Mongoose 9, pino, healthcheck, graceful shutdown)~~
3. ~~Базовый каркас `apps/client` (Quasar 2, роутинг, Pinia-store, dev-proxy на сервер)~~
4. Пакет `mu` — первый набор утилит (логгер-обёртка, env-loader, http-error)
5. Пакет `mq` — базовые UI-компоненты поверх Quasar (AppButton, AppInput, AppTable)
6. Пакет `md` — первая сущность `User` (типы, модель, сервис, контроллер, роутер, store-фабрика, форма)
7. Docker-compose для dev-окружения (MongoDB + server + client)
8. Сценарий `pnpm dev` (одной командой поднимает всё окружение)
9. Vitest-каркас + smoke-тест на User entity
10. E2E-сценарий CRUD User через UI после выхода MVP-каркаса

## Future Features
