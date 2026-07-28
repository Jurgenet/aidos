<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import { iconNames } from '@aid/mq/icons'
import type { QTableColumn } from 'quasar'

type BackupInfo = {
  filename: string
  size: number
  createdAt: string
}

type MgobStatus = {
  plan: string
  next_run?: string
  last_run?: string
  last_run_status?: string
  last_run_log?: string
}

const $q = useQuasar()

const items = ref<BackupInfo[]>([])
const status = ref<MgobStatus | null>(null)
const loading = ref(false)
const triggering = ref(false)
const restoring = ref<string | null>(null)
const error = ref<string | null>(null)

const columns: QTableColumn<BackupInfo>[] = [
  { name: 'filename', label: 'Файл', field: 'filename', align: 'left' },
  { name: 'size', label: 'Размер', field: 'size', align: 'right', format: (v: unknown) => formatBytes(Number(v)) },
  { name: 'createdAt', label: 'Создан', field: 'createdAt', align: 'left', format: (v: unknown) => formatDate(String(v)) },
  { name: 'actions', label: '', field: () => '', align: 'right' },
]

const hasBackups = computed(() => items.value.length > 0)

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
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

function downloadUrl(filename: string): string {
  return `/api/backups/${encodeURIComponent(filename)}/download`
}

async function loadList(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const r = await fetch('/api/backups')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = (await r.json()) as { items: BackupInfo[] }
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

async function loadStatus(): Promise<void> {
  try {
    const r = await fetch('/api/backups/status')
    if (r.status === 502) {
      status.value = null
      return
    }
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    status.value = (await r.json()) as MgobStatus
  } catch {
    status.value = null
  }
}

async function loadAll(): Promise<void> {
  await Promise.all([loadList(), loadStatus()])
}

async function onTrigger(): Promise<void> {
  triggering.value = true
  error.value = null
  try {
    const r = await fetch('/api/backups', { method: 'POST' })
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
      throw new Error(data.error?.message ?? `HTTP ${r.status}`)
    }
    $q.notify({ type: 'positive', message: 'Бэкап создан' })
    await loadAll()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
    $q.notify({ type: 'negative', message: `Не удалось: ${error.value}` })
  } finally {
    triggering.value = false
  }
}

async function onRestore(filename: string): Promise<void> {
  $q.dialog({
    title: 'Восстановить?',
    message: `Все текущие данные в базе будут заменены данными из архива ${filename}. Это необратимо.`,
    cancel: { label: 'Отмена', flat: true, color: 'grey' },
    ok: { label: 'Восстановить', color: 'negative' },
    persistent: true,
  }).onOk(async () => {
    restoring.value = filename
    error.value = null
    try {
      const r = await fetch(`/api/backups/${encodeURIComponent(filename)}/restore`, { method: 'POST' })
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? `HTTP ${r.status}`)
      }
      $q.notify({ type: 'positive', message: `Восстановлено из ${filename}` })
      await loadAll()
    } catch (e) {
      error.value = e instanceof Error ? e.message : String(e)
      $q.notify({ type: 'negative', message: `Не удалось: ${error.value}` })
    } finally {
      restoring.value = null
    }
  })
}

onMounted(loadAll)
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Бэкапы</h1>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <UiButton
            :icon="iconNames.backup"
            label="Сделать бэкап сейчас"
            :loading="triggering"
            @click="onTrigger"
          />
          <UiButton
            :icon="iconNames.refresh"
            label="Обновить"
            flat
            :loading="loading"
            @click="loadAll"
          />
        </div>
        <p
          v-if="status"
          class="text-caption q-mt-sm q-mb-none"
        >
          Следующий по расписанию: {{ status.next_run ? formatDate(status.next_run) : '—' }}
          <span v-if="status.last_run"> · последний: {{ formatDate(status.last_run) }} ({{ status.last_run_status }})</span>
        </p>
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
      v-if="!loading && !hasBackups"
      class="text-grey-7"
    >
      Архивов пока нет. Нажми «Сделать бэкап сейчас» или подожди 6 часов (расписание).
    </p>

    <UiTable
      v-if="hasBackups"
      :rows="items"
      :columns="columns"
      row-key="filename"
      :loading="loading"
    >
      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :href="downloadUrl(props.row.filename)"
            :icon="iconNames.cloudDownload"
            title="Скачать .gz"
            flat
            dense
            round
            download
          />
          <UiButton
            :icon="iconNames.restore"
            label="Восстановить"
            flat
            dense
            color="negative"
            :loading="restoring === props.row.filename"
            @click="onRestore(props.row.filename)"
          />
        </q-td>
      </template>
    </UiTable>
  </q-page>
</template>
