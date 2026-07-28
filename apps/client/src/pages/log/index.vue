<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import { iconNames } from '@aid/mq/icons'
import type { QTableColumn } from 'quasar'

type Log = {
  id: string
  entity: 'user' | 'account' | 'note' | 'device' | 'order'
  action: 'create' | 'update' | 'delete'
  documentId: string
  userId: string | null
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  timestamp: string
}

const ENTITIES: Log['entity'][] = ['user', 'account', 'note', 'device', 'order']
const ACTIONS: Log['action'][] = ['create', 'update', 'delete']

const items = ref<Log[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const expandedIds = ref<Set<string>>(new Set())

const filterEntity = ref<'' | Log['entity']>('')
const filterAction = ref<'' | Log['action']>('')
const filterDocumentId = ref<string>('')
const limit = ref(100)

const hasFilters = computed(
  () => filterEntity.value !== '' || filterAction.value !== '' || filterDocumentId.value !== '',
)

const columns: QTableColumn<Log>[] = [
  { name: 'timestamp', label: 'Время', field: 'timestamp', align: 'left', format: (v: unknown) => formatDate(String(v)) },
  { name: 'entity', label: 'Сущность', field: 'entity', align: 'left' },
  { name: 'action', label: 'Действие', field: 'action', align: 'left' },
  { name: 'documentId', label: 'ID документа', field: 'documentId', align: 'left' },
  { name: 'expand', label: '', field: () => '', align: 'right' },
]

function actionColor(action: Log['action']): string {
  if (action === 'create') return 'positive'
  if (action === 'update') return 'warning'
  return 'negative'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function toggleExpand(id: string): void {
  if (expandedIds.value.has(id)) expandedIds.value.delete(id)
  else expandedIds.value.add(id)
}

function diffSummary(log: Log): string {
  if (log.action === 'create') return `Создан документ: ${JSON.stringify(log.after)}`
  if (log.action === 'delete') return `Удалён документ: ${JSON.stringify(log.before)}`
  if (log.action === 'update') {
    const keys = new Set<string>([
      ...Object.keys(log.before ?? {}),
      ...Object.keys(log.after ?? {}),
    ])
    const changed: string[] = []
    for (const k of keys) {
      if (k === 'id' || k === 'createdAt' || k === 'updatedAt') continue
      const b = JSON.stringify((log.before ?? {})[k])
      const a = JSON.stringify((log.after ?? {})[k])
      if (b !== a) changed.push(`${k}: ${b} → ${a}`)
    }
    return changed.length ? changed.join('\n') : '— без изменений полей —'
  }
  return ''
}

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams()
    if (filterEntity.value !== '') params.set('entity', filterEntity.value)
    if (filterAction.value !== '') params.set('action', filterAction.value)
    if (filterDocumentId.value !== '') params.set('documentId', filterDocumentId.value)
    params.set('limit', String(limit.value))
    const r = await fetch(`/api/logs?${params.toString()}`)
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = (await r.json()) as { items: Log[]; total: number }
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function clearFilters(): void {
  filterEntity.value = ''
  filterAction.value = ''
  filterDocumentId.value = ''
  void load()
}

onMounted(load)
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">История изменений</h1>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row q-gutter-md items-end">
          <q-select
            v-model="filterEntity"
            :options="['', ...ENTITIES]"
            label="Сущность"
            emit-value
            map-options
            clearable
            dense
            outlined
            style="min-width: 160px"
            @update:model-value="load"
          />
          <q-select
            v-model="filterAction"
            :options="['', ...ACTIONS]"
            label="Действие"
            emit-value
            map-options
            clearable
            dense
            outlined
            style="min-width: 160px"
            @update:model-value="load"
          />
          <q-input
            v-model="filterDocumentId"
            label="ID документа"
            dense
            outlined
            clearable
            @keyup.enter="load"
          />
          <UiButton
            :icon="iconNames.refresh"
            label="Обновить"
            flat
            :loading="loading"
            @click="load"
          />
          <UiButton
            v-if="hasFilters"
            label="Сбросить"
            flat
            @click="clearFilters"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-card
      v-if="error"
      class="bg-negative text-white q-mb-md"
    >
      <q-card-section>
        <div class="text-h6">Ошибка</div>
        <div>{{ error }}</div>
      </q-card-section>
    </q-card>

    <p
      v-if="!loading && items.length === 0"
      class="text-grey-7"
    >
      Записей нет. Сделай любое изменение в User/Account/Note/Device/Order, чтобы появились логи.
    </p>

    <UiTable
      v-if="items.length > 0"
      :rows="items"
      :columns="columns"
      row-key="id"
      :loading="loading"
    >
      <template #body-cell-entity="props">
        <q-td :props="props">{{ props.row.entity }}</q-td>
      </template>

      <template #body-cell-action="props">
        <q-td :props="props">
          <q-badge :color="actionColor(props.row.action)">
            {{ props.row.action }}
          </q-badge>
        </q-td>
      </template>

      <template #body-cell-expand="props">
        <q-td :props="props">
          <q-btn
            :icon="expandedIds.has(props.row.id) ? iconNames.historyEdu : iconNames.history"
            flat
            dense
            round
            :title="expandedIds.has(props.row.id) ? 'Скрыть детали' : 'Показать детали'"
            @click="toggleExpand(props.row.id)"
          />
        </q-td>
      </template>

      <template #body="props">
        <tr :props="props">
          <td
            v-for="col in props.cols"
            :key="col.name"
            :class="col.classes"
            :style="col.style"
          >
            <template v-if="col.name === 'action'">
              <q-badge :color="actionColor(props.row.action)">
                {{ props.row.action }}
              </q-badge>
            </template>
            <template v-else-if="col.name === 'expand'">
              <q-btn
                :icon="expandedIds.has(props.row.id) ? iconNames.historyEdu : iconNames.history"
                flat
                dense
                round
                size="sm"
                @click="toggleExpand(props.row.id)"
              />
            </template>
            <template v-else>
              {{ col.value }}
            </template>
          </td>
        </tr>
        <tr v-if="expandedIds.has(props.row.id)">
          <td
            :colspan="columns.length"
            class="bg-grey-2"
          >
            <pre class="q-ma-sm" style="white-space: pre-wrap; font-family: monospace;">{{ diffSummary(props.row) }}</pre>
          </td>
        </tr>
      </template>
    </UiTable>
  </q-page>
</template>
