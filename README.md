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

### Server API

Stack: NodeJS ^24, ExpressJS 5, Mongoose 9, TypesScript

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
- [ ] Если менялся публичный контракт (типы в `md`, API-роуты, схемы БД) — отражено в `## Принятые решения`
- [ ] Если менялся стек или инфраструктура — обновлён соответствующий раздел README
- [ ] Коммиты прошли `git rebase -i` (squash мусорных/WIP)

### Принятые решения

Здесь фиксируем архитектурные и инфраструктурные ADR в формате коротких записей. Новая запись добавляется наверх.

#### ADR-0001 — Monorepo на pnpm workspaces

Контекст: клиент, сервер и три пакета общего кода живут в одном репозитории. Решение: `pnpm` workspaces, `apps/*` для приложений, `packages/*` для библиотек. Альтернативы (npm/yarn workspaces, turborepo, nx) — избыточны для одного разработчика.

#### ADR-0002 — Self-contained, без CI/husky/ревью

Контекст: проект ведёт один человек, AI-агенты помогают с рутиной. Решение: PR-чеклист обязателен, но прогоняет его сам автор. CI/husky добавим, когда появится второй контрибьютор или стабилизируется MVP. Альтернативы (полноценный CI с первого коммита) — оверкилл на старте.

#### ADR-0003 — Шаринг сущностей через `md`

Контекст: модели данных нужны и фронту, и бэку. Решение: пакет `md` содержит «толстые» модули сущностей — типы, схемы, сервисы, контроллеры, роутеры, store-фабрики, quasar-компоненты. Альтернативы (отдельные DTO-пакеты, GraphQL codegen, OpenAPI) — лишний слой абстракции для текущего масштаба.

#### ADR-0004 — Свободные breaking changes

Контекст: на стадии MVP стабильность публичного API не требуется. Решение: допустимы breaking changes между коммитами, помечаем `!` и описываем в футере коммита. Когда выйдем из MVP — пересмотрим.

#### ADR-0005 — TS ^6, NodeNext, ES2022

Контекст: нужна максимальная совместимость с современными фичами ESM. Решение: TypeScript ^6, module resolution `NodeNext`, target `ES2022`. Альтернативы (CommonJS, ES2020) — устаревшие.

#### ADR-0006 — Vitest + ESLint + Prettier (root flat config)

Контекст: единые инструменты на весь монорепо. Решение: `vitest` для тестов (быстрее jest, нативная ESM-поддержка), `eslint` + `prettier` с плоскими конфигами в корне. Альтернативы (jest, отдельные конфиги на пакет) — лишняя сложность.

#### ADR-0007 — MongoDB ^8 как основное хранилище

Контекст: данные слабо структурированы, схема будет эволюционировать. Решение: MongoDB 8 + Mongoose 9, без отдельной ORM/ODM-схемы. Альтернативы (Postgres + Prisma) — добавим, если появится реляционная нагрузка.

## Roadmap

1. Настройка архитектуры на MVP
2. Базовый каркас `apps/server` (Express 5, Mongoose 9, pino, healthcheck, graceful shutdown)
3. Базовый каркас `apps/client` (Quasar 2, роутинг, Pinia-store, dev-proxy на сервер)
4. Пакет `mu` — первый набор утилит (логгер-обёртка, env-loader, http-error)
5. Пакет `mq` — базовые UI-компоненты поверх Quasar (AppButton, AppInput, AppTable)
6. Пакет `md` — первая сущность `User` (типы, модель, сервис, контроллер, роутер, store-фабрика, форма)
7. Docker-compose для dev-окружения (MongoDB + server + client)
8. Сценарий `pnpm dev` (одной командой поднимает всё окружение)
9. Vitest-каркас + smoke-тест на User entity
10. E2E-сценарий CRUD User через UI после выхода MVP-каркаса

## Future Features
