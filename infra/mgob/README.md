# mgob — бэкапы MongoDB

Сервис в `compose.yaml` (контейнер `aid-mgob`), автоматически дампит базу `aid` каждые 6 часов. Архивы лежат в named volume `aid-mongo-backups`.

План бэкапа: [`config/aid.yaml`](config/aid.yaml) (имя файла == plan ID в URL API).

## Доступ

- **Web UI** (только с localhost, без TLS и без auth): <http://localhost:8090/storage>
  - `/storage` — список архивов и лог-файлов
  - `/status` — состояние планировщика и история запусков
  - `/version`, `/metrics` — служебные
- **HTTP API** — задокументирован в upstream README, основные маршруты:
  - `POST /backup/aid` — запустить бэкап немедленно
  - `GET /status/aid` — последний/следующий запуск и результат
  - `GET /storage/aid/<file>.gz` — скачать архив

⚠️ В production за прокси и auth не выставлять — на текущий момент mgob не умеет ни того, ни другого. Для dev-сценария достаточно localhost-биндинга.

## On-demand бэкап

```bash
curl -X POST http://localhost:8090/backup/aid
```

В ответе придёт JSON с именем файла и размером. Файл появится в `/storage` через секунду.

## Где лежат файлы

Физически архивы — внутри named volume `aid-mongo-backups`:

```bash
docker volume inspect aid-mongo-backups
```

Чтобы заглянуть внутрь:

```bash
docker run --rm -v aid-mongo-backups:/data alpine ls -lh /data
```

## Восстановление

Восстановление делается через `mongorestore` — mgob не умеет восстанавливать сам, это by design (restore — деструктивная операция, лучше вручную).

**В текущую БД (поверх существующих данных, дропая коллекции):**

```bash
# Скачиваем нужный архив с mgob
curl -o /tmp/aid-1234567890.gz http://localhost:8090/storage/aid/aid-1234567890.gz

# Копируем в контейнер Mongo и восстанавливаем
docker cp /tmp/aid-1234567890.gz aid-mongo:/tmp/restore.gz
docker exec aid-mongo mongorestore --gzip --archive=/tmp/restore.gz --drop
```

**В новую БД (для проверки, не трогая прод):**

```bash
docker exec aid-mongo mongorestore \
  --gzip --archive=/tmp/restore.gz \
  --nsFrom="aid.*" --nsTo="aid_restore.*" \
  --db aid_restore
```

После проверки: `docker exec aid-mongo mongosh aid_restore --eval "db.dropDatabase()"`.

## Очистка

- `retention: 14` в плане автоматически удаляет старые архивы. Чистить руками обычно не нужно.
- Полный сброс бэкапов: `docker volume rm aid-mongo-backups` (потеря всех точек восстановления).
- Полный сброс dev-окружения включая данные: `docker compose down -v` (⚠️ удалит и `aid-mongo-data`).

## Логи

```bash
docker logs aid-mgob
```

Показывает расписание, статусы запусков, длительность, ошибки mongodump.

## Когда что-то не работает

| Симптом | Что делать |
|---|---|
| `connection refused` на :8090 | `docker ps` — `aid-mgob` поднят? `docker logs aid-mgob` |
| В `/status` `last_run_status: 500` | Смотри `docker logs aid-mgob` и `curl localhost:8090/storage/aid/<last>.log` |
| Архив пустой / 0 байт | Проверь, что `MONGO_DB_NAME=aid` совпадает с `database: aid` в плане |
| Mongo 8 не совместима | См. ADR-0011 — официально mgob:1.12 про 7.0, на 8 проверено вживую; если сломалось после апдейта — откатить или поднять свой sidecar с mongodump |
