# AID (Data Operation System)

## Project Overview

Monorepo via pnpm, worspaces: app and packages
Self-contaned, без CI/husky/review

Main code language: TypeScript ^7, root flat confiruration ES2022, NodeNext
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
Не плодить процессы ради процессов.
Смело предлагать breaking changes

### Правила коммитов

### Чеклист перед PR

### Принятые решения

## Roadmap

1. Настройка архитектуры на MVP
