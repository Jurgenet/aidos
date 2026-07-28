# infra/mgob

Каталог инфраструктуры для бэкапов MongoDB.

```
infra/mgob/
├── README.md        # этот файл — что где лежит
└── config/
    └── aid.yaml     # план mgob (cron, retention, target)
```

Полная операционная инструкция (бэкап, restore, статистика, troubleshooting) — в [docs/MGOB.md](../../docs/MGOB.md). Сюда заглядывать, только если нужно поправить расписание или понять, откуда mgob читает конфиг.

План `aid.yaml` монтируется в контейнер `aid-mgob` read-only через `compose.yaml`:

```yaml
volumes:
  - ./infra/mgob/config:/config:ro
```

Изменил план → `docker compose restart mgob`.
