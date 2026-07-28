# MGOB — бэкапы MongoDB

Операционная инструкция к сервису `mgob` (`maxisam/mgob:2.0.28`), который пятым сервисом поднимается в `compose.yaml` и автоматически дампит базу `aid` каждые 6 часов.

- **Сервис:** `aid-mgob`
- **Web UI / API:** <http://localhost:8090> (только localhost, без TLS и без auth)
- **Compose-файл:** [`compose.yaml`](../compose.yaml)
- **План:** [`infra/mgob/config/aid.yaml`](../infra/mgob/config/aid.yaml)
- **Архивы бэкапов:** [`.data/mongo-backups/`](../.data/mongo-backups/) (внутри проекта, трекается в git)
- **Краткая справка по структуре каталога:** [`infra/mgob/README.md`](../infra/mgob/README.md)
- **Обоснование выбора:** [ADR-0011](ADR.md#adr-0011--бэкапы-mongodb-через-mgob-форк-maxisammgob)

## Содержание

- [Запуск и остановка](#запуск-и-остановка)
- [Бэкап](#бэкап)
- [Статистика и логи](#статистика-и-логи)
- [Восстановление](#восстановление)
- [Где лежат файлы](#где-лежат-файлы)
- [Retention и очистка](#retention-и-очистка)
- [Troubleshooting](#troubleshooting)

## Запуск и остановка

mgob стартует как часть общего стека:

```bash
docker compose up -d              # весь стек (caddy, mongo, server, client, mgob)
docker compose up -d mongo mgob    # только mgob + его зависимость mongo
```

Проверить, что работает:

```bash
docker ps --filter name=aid-mgob  # статус контейнера
& curl.exe -s http://localhost:8090/status
# [{"plan":"aid","next_run":"2026-07-28T18:00:00Z"}]
```

Остановить (без удаления бэкапов):

```bash
docker compose stop mgob
```

## Бэкап

### По расписанию (автоматически)

План в [`infra/mgob/config/aid.yaml`](../infra/mgob/config/aid.yaml):

```yaml
scheduler:
  cron: "0 */6 * * *"   # каждые 6 часов
  retention: 14         # хранить последние 14 архивов
  timeout: 60           # минут
target:
  host: "mongo"
  port: 27017
  database: "aid"
```

Изменить расписание — отредактировать YAML и перезапустить:

```bash
docker compose restart mgob
```

### On-demand

Когда нужно срочно сделать снапшот (например, перед опасной миграцией):

```bash
& curl.exe -X POST http://localhost:8090/backup/aid
# {"plan":"aid","file":"aid-1785238674.gz","duration":"45ms","size":"1.5 kB","timestamp":"..."}
```

Файл появится в `/storage/aid/` через секунду, не зависимо от расписания.

### Через Web UI

Открыть <http://localhost:8090/storage/aid/> — там же кнопка запуска и кнопка скачивания.

## Статистика и логи

### Состояние планировщика

```bash
# Общее состояние всех планов
& curl.exe -s http://localhost:8090/status
# [{"plan":"aid","next_run":"2026-07-28T18:00:00Z"}]

# Детально по плану aid
& curl.exe -s http://localhost:8090/status/aid
# {"plan":"aid","next_run":"...","last_run":"...","last_run_status":200,"last_run_log":"Backup finished in 45ms archive size 1.5 kB"}
```

`last_run_status` — HTTP-код: `200` = успех, `500` = ошибка.

### Список архивов

```bash
# Через API
& curl.exe -s http://localhost:8090/storage/aid/

# Через UI
# http://localhost:8090/storage
```

### Метрики Prometheus

```bash
& curl.exe -s http://localhost:8090/metrics
# mgob_scheduler_backup_total{plan="aid",status="200"} 8
# mgob_scheduler_backup_latency_sum{plan="aid",status="200"} 12.5
```

Полезные метрики:

- `mgob_scheduler_backup_total{status="200"|"500"}` — счётчик успешных/упавших бэкапов
- `mgob_scheduler_backup_latency_seconds{quantile="0.5"|"0.9"|"0.99"}` — длительность

### Логи

```bash
docker logs aid-mgob                       # все
docker logs aid-mgob --tail 50 --follow    # последние 50 + фолловить
```

Показывают расписание, статусы запусков, длительность, ошибки mongodump.

### Лог конкретного бэкапа

Рядом с каждым `.gz` лежит `.log` (вывод mongodump). Можно открыть через UI (`/storage/aid/`) или скачать напрямую:

```bash
& curl.exe -s http://localhost:8090/storage/aid/aid-1785238674.log
```

## Восстановление

Восстановление делается вручную через `mongorestore` (mgob не делает restore — деструктивная операция by design).

### Шаг 1. Скачать архив

Из mgob (поменять `<timestamp>` на нужный):

```bash
# PowerShell
& curl.exe -o .tmp\restore.gz http://localhost:8090/storage/aid/aid-<timestamp>.gz
```

### Шаг 2. Скопировать в контейнер Mongo

```bash
docker cp .tmp\restore.gz aid-mongo:/tmp/restore.gz
```

### Шаг 3. mongorestore

**Поверх существующей БД (дропая коллекции с теми же именами):**

```bash
docker exec aid-mongo mongorestore --gzip --archive=/tmp/restore.gz --drop
```

**В отдельную БД для проверки (рекомендуется первый раз):**

```bash
docker exec aid-mongo mongorestore \
  --gzip --archive=/tmp/restore.gz \
  --nsFrom='aid.*' --nsTo='aid_restore.*'
```

Проверить:

```bash
docker exec aid-mongo mongosh aid_restore --quiet --eval "db.getCollectionNames()"
# ['notes', 'devices', 'users', 'accounts']

docker exec aid-mongo mongosh aid_restore --quiet --eval "db.users.find().toArray()"
```

Если всё ок — переключиться на основную БД первым вариантом. Если нет — `db.dropDatabase()` в `aid_restore` и разбираться.

**Только одна коллекция:**

```bash
docker exec aid-mongo mongorestore \
  --gzip --archive=/tmp/restore.gz \
  -c users -d aid
```

### Шаг 4. Уборка

```bash
docker exec aid-mongo rm /tmp/restore.gz
Remove-Item .tmp\restore.gz
```

## Где лежат файлы

Архивы лежат в каталоге **`.data/mongo-backups/`** внутри проекта (bind-mount в compose). Этот каталог **трекается в git** — каждая резервная копия коммитится отдельным коммитом или пачкой. Структура:

```
.data/mongo-backups/
└── aid/                  # plan ID
    ├── aid-1785238674.gz # mongodump-архив
    ├── aid-1785238674.log
    ├── aid-1785240023.gz
    └── aid-1785240023.log
```

Заглянуть внутрь:

```bash
ls -lh .data/mongo-backups/aid/
```

Скопировать архив к себе на хост — он уже на хосте, просто `cp`:

```bash
cp .data/mongo-backups/aid/aid-1785238674.gz ./aid-restore.gz
```

Сырые данные Mongo лежат в соседнем `.data/mongo/` (тоже bind-mount) — **в `.gitignore`**, в репо не попадают.

## Retention и очистка

`retention: 14` в плане — mgob автоматически удаляет архивы старше 14-го по счёту. Чистить руками обычно не нужно.

Принудительная очистка бэкапов (на хосте, не в контейнере):

```bash
rm -rf .data/mongo-backups/aid/*   # ⚠️ потеря всех точек восстановления
```

Полный сброс dev-окружения (данные Mongo + бэкапы):

```bash
docker compose down
rm -rf .data/mongo    # ⚠️ потеря всех данных
```

## Troubleshooting

| Симптом | Что делать |
|---|---|
| `connection refused` на :8090 | `docker ps` — контейнер `aid-mgob` жив? `docker logs aid-mgob` — что в логе? |
| `last_run_status: 500` | Скачать `.log` соседнего бэкапа (`/storage/aid/<file>.log`) — там stderr mongodump |
| Архив 0 байт или очень маленький | Сверить `database: aid` в плане с реальным именем БД (`docker exec aid-mongo mongosh --quiet --eval "db.adminCommand('listDatabases')"`) |
| `manifest unknown` при `docker compose up` | Тег mgob в `compose.yaml` устарел. Проверить актуальные: <https://hub.docker.com/r/maxisam/mgob/tags> |
| Mongo 8 не совместима после апдейта | См. [ADR-0011](ADR.md#adr-0011--бэкапы-mongodb-через-mgob-форк-maxisammgob) — официально 2.0.28 про 7.0, на 8 проверено вживую. Если сломалось: `docker compose down mgob` и поднять свой sidecar с mongodump |
| Место на диске кончилось | `du -sh .data/mongo-backups/`. Снизить `retention` в плане и перезапустить mgob |
| После `git clone` Mongo не стартует | Каталог `.data/mongo/` не создан (его содержимое в .gitignore). Создай руками: `mkdir -p .data/mongo` перед `docker compose up` |
