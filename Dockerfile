# syntax=docker/dockerfile:1.7
#
# Базовый образ для dev-окружения AID.
# Используется compose.yaml: один образ, разные команды (server / client).
# Source примонтирован из хоста (см. compose.yaml `volumes:`), так что
# правки в src/ видны сразу без пересборки.

FROM node:24-bookworm-slim

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

# Системные зависимости mongorestore (см. блок 1.5 ниже): libgssapi_krb5,
# libsasl2. Ставим ДО pnpm install, чтобы кэшировалось отдельно от src.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgssapi-krb5-2 \
    libsasl2-2 \
    && rm -rf /var/lib/apt/lists/*

RUN pnpm install --frozen-lockfile

# --- 1.5. mongorestore для server ---
# Server шелмит mongorestore из endpoint /api/backups/:file/restore
# (mgob 2.0.28 /restore падает с nil pointer, см. ADR-0011 и комментарий
# в apps/server/src/routes/backups.ts). mongo:8 — debian-based, glibc,
# совместим с нашей новой базой bookworm-slim. Alpine-вариант не подходит
# (musl vs glibc), alpine-пакета mongodb-tools в репах Alpine 3.24 нет.
COPY --from=mongo:8 /usr/bin/mongorestore /usr/local/bin/mongorestore

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
