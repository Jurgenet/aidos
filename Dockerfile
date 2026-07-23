# syntax=docker/dockerfile:1.7
#
# Базовый образ для dev-окружения AID.
# Используется compose.yaml: один образ, разные команды (server / client).
# Source примонтирован из хоста (см. compose.yaml `volumes:`), так что
# правки в src/ видны сразу без пересборки.

FROM node:24-alpine

WORKDIR /app

# pnpm нужной версии (читаем из packageManager в корневом package.json)
RUN corepack enable

# --- 1. Кэшируемый слой с зависимостями ---
# Копируем только manifest-файлы, чтобы pnpm install закэшировался
# отдельно от src. Меняешь deps → пересобирается только этот слой.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY tsconfig.base.json ./
COPY apps/server/package.json       ./apps/server/
COPY apps/client/package.json       ./apps/client/
COPY packages/me/package.json       ./packages/me/
COPY packages/mq/package.json       ./packages/mq/
COPY packages/mu/package.json       ./packages/mu/

RUN pnpm install --frozen-lockfile

# --- 2. Копируем исходники ---
# В compose.yaml mount'ы перекроют только src/, остальное останется
# из образа (важно: node_modules со symlinks pnpm).
COPY apps/server ./apps/server
COPY apps/client ./apps/client
COPY packages    ./packages

# Собираем общие workspace-пакеты: @aid/me, @aid/mq, @aid/mu.
# Без `dist/*` в образе `tsx` не сможет зарезолвить workspace-импорты
# вроде `@aid/me/shared/http-error` (они смотрят на ./dist/.../index.js).
# .dockerignore исключает dist/* из build context, так что в момент
# COPY packages каталоги пусты — сборка ниже их наполняет.
RUN pnpm --filter @aid/me --filter @aid/mq --filter @aid/mu build

EXPOSE 3000 4173

# Дефолт — запуск обоих через concurrently (используется напрямую
# только в `docker run`). В compose каждая служба переопределяет
# `command:` на свой фильтр.
CMD ["pnpm", "dev"]
