# OpenCode Go — модели

Провайдер `opencode-go`. В конфиге opencode (`model`, `agent.*.model`) используется как `opencode-go/<id>`.

Источник: <https://models.dev/providers/opencode-go>

## Все модели

| ID | Контекст | Выход | Цена in / out (за 1M токенов) | Reasoning | Tool call | Structured | Temperature |
|---|---|---|---|---|---|---|---|
| `minimax-m3` | 1 000 000 | 131 072 | $0.30 / $1.20 | yes | yes | yes | yes |
| `minimax-m2.7` | 204 800 | 131 072 | $0.30 / $1.20 | yes | yes | yes | yes |
| `minimax-m2.5` | 204 800 | 65 536 | $0.30 / $1.20 | yes | yes | yes | yes |
| `deepseek-v4-pro` | 1 000 000 | 384 000 | $0.43 / $0.87 | yes | yes | yes | yes |
| `deepseek-v4-flash` | 1 000 000 | 384 000 | $0.14 / $0.28 | yes | yes | yes | yes |
| `glm-5.2` | 1 000 000 | 131 072 | $1.40 / $4.40 | yes | yes | yes | yes |
| `glm-5.1` | 202 752 | 32 768 | $1.40 / $4.40 | yes | yes | — | yes |
| `glm-5` | 202 752 | 32 768 | $1.00 / $3.20 | yes | yes | — | yes |
| `grok-4.5` | 500 000 | 500 000 | $2.00 / $6.00 | yes | yes | yes | yes |
| `kimi-k3` | 1 048 576 | 131 072 | $3.00 / $15.00 | yes | yes | yes | no |
| `kimi-k2.7-code` | 262 144 | 262 144 | $0.95 / $4.00 | yes | yes | yes | no |
| `kimi-k2.6` | 262 144 | 65 536 | $0.95 / $4.00 | yes | yes | yes | yes |
| `kimi-k2.5` | 262 144 | 65 536 | $0.60 / $3.00 | yes | yes | yes | yes |
| `mimo-v2.5-pro` | 1 048 576 | 128 000 | $0.43 / $0.87 | yes | yes | yes | yes |
| `mimo-v2.5` | 1 000 000 | 128 000 | $0.14 / $0.28 | yes | yes | yes | yes |
| `mimo-v2-pro` | 1 048 576 | 128 000 | $1.00 / $3.00 | yes | yes | yes | yes |
| `mimo-v2-omni` | 262 144 | 128 000 | $0.40 / $2.00 | yes | yes | yes | yes |
| `qwen3.7-max` | 1 000 000 | 65 536 | $2.50 / $7.50 | yes | yes | yes | yes |
| `qwen3.7-plus` | 1 000 000 | 65 536 | $0.40 / $1.60 | yes | yes | yes | yes |
| `qwen3.6-plus` | 1 000 000 | 65 536 | $0.50 / $3.00 | yes | yes | yes | yes |
| `qwen3.5-plus` | 262 144 | 65 536 | $0.20 / $1.20 | yes | yes | yes | yes |

## Сортировка по цене (in, дешевле → дороже)

| ID | in / out (за 1M) |
|---|---|
| `deepseek-v4-flash` | $0.14 / $0.28 |
| `mimo-v2.5` | $0.14 / $0.28 |
| `qwen3.5-plus` | $0.20 / $1.20 |
| `minimax-m2.5` | $0.30 / $1.20 |
| `minimax-m2.7` | $0.30 / $1.20 |
| `minimax-m3` | $0.30 / $1.20 |
| `mimo-v2-omni` | $0.40 / $2.00 |
| `qwen3.7-plus` | $0.40 / $1.60 |
| `deepseek-v4-pro` | $0.43 / $0.87 |
| `mimo-v2.5-pro` | $0.43 / $0.87 |
| `qwen3.6-plus` | $0.50 / $3.00 |
| `kimi-k2.5` | $0.60 / $3.00 |
| `kimi-k2.6` | $0.95 / $4.00 |
| `kimi-k2.7-code` | $0.95 / $4.00 |
| `mimo-v2-pro` | $1.00 / $3.00 |
| `glm-5` | $1.00 / $3.20 |
| `glm-5.1` | $1.40 / $4.40 |
| `glm-5.2` | $1.40 / $4.40 |
| `grok-4.5` | $2.00 / $6.00 |
| `qwen3.7-max` | $2.50 / $7.50 |
| `kimi-k3` | $3.00 / $15.00 |

## Примеры использования

В `opencode.json`:

```json
{
  "model": "opencode-go/minimax-m3",
  "agent": {
    "build": { "model": "opencode-go/minimax-m3" },
    "plan": { "model": "opencode-go/deepseek-v4-flash" }
  }
}
```

В `.opencode/agents/review.md`:

```yaml
---
model: opencode-go/qwen3.5-plus
---
```

## Обновление

Дата выгрузки: 2026-07-21. Для актуальных цен и состава — `opencode models` или страница провайдера.
