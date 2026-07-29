<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import { iconNames } from '@aid/mq/icons'
import type { QTableColumn } from 'quasar'

type TagCount = { name: string; count: number }

const $q = useQuasar()
const items = ref<TagCount[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const renaming = ref<string | null>(null)
const deleting = ref<string | null>(null)

const columns: QTableColumn<TagCount>[] = [
  { name: 'name', label: 'Тег', field: 'name', align: 'left' },
  { name: 'count', label: 'Файлов', field: 'count', align: 'right' },
  { name: 'actions', label: '', field: () => '', align: 'right' },
]

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const r = await fetch('/api/tags')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = (await r.json()) as { items: TagCount[]; total: number }
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function onRename(tag: TagCount): void {
  const newName = prompt(
    `Переименовать тег "${tag.name}" (${tag.count} ${pluralize(tag.count)})?\n\nНовое имя:`,
    tag.name,
  )
  if (newName === null) return
  const trimmed = newName.trim().toLowerCase()
  if (trimmed === '' || trimmed === tag.name) return
  if (!confirm(`Переименовать "${tag.name}" → "${trimmed}" в ${tag.count} ${pluralize(tag.count)}?`)) return
  void (async () => {
    renaming.value = tag.name
    try {
      const r = await fetch(
        `/api/tags/${encodeURIComponent(tag.name)}/rename`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newName: trimmed }),
        },
      )
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? `HTTP ${r.status}`)
      }
      const data = (await r.json()) as { affected: number }
      $q.notify({ type: 'positive', message: `Переименовано в ${data.affected} ${pluralize(data.affected)}` })
      void load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      $q.notify({ type: 'negative', message: `Не удалось: ${msg}` })
    } finally {
      renaming.value = null
    }
  })()
}

function onDelete(tag: TagCount): void {
  if (!confirm(`Удалить тег "${tag.name}" из ${tag.count} ${pluralize(tag.count)}?`)) return
  void (async () => {
    deleting.value = tag.name
    try {
      const r = await fetch(`/api/tags/${encodeURIComponent(tag.name)}`, {
        method: 'DELETE',
      })
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? `HTTP ${r.status}`)
      }
      const data = (await r.json()) as { affected: number }
      $q.notify({ type: 'positive', message: `Удалён из ${data.affected} ${pluralize(data.affected)}` })
      void load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      $q.notify({ type: 'negative', message: `Не удалось: ${msg}` })
    } finally {
      deleting.value = null
    }
  })()
}

function pluralize(n: number): string {
  // Простая русская плюрализация для слова «файл»
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'файла'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'файлов'
  return 'файлов'
}

onMounted(load)
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Теги</h1>

    <q-card class="q-mb-md">
      <q-card-section>
        <UiButton
          :icon="iconNames.refresh"
          label="Обновить"
          flat
          :loading="loading"
          @click="load"
        />
        <span class="q-ml-md text-caption text-grey-7">
          Всего уникальных тегов: {{ items.length }}
        </span>
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
      Тегов пока нет. Загрузи файл с тегами на странице «Файлы».
    </p>

    <UiTable
      v-if="items.length > 0"
      :rows="items"
      :columns="columns"
      row-key="name"
      :loading="loading"
    >
      <template #body-cell-name="props">
        <q-td :props="props">
          <q-chip
            :label="props.row.name"
            icon="label"
            size="sm"
            clickable
            @click="$router.push({ path: '/file', query: { tag: props.row.name } })"
          />
        </q-td>
      </template>

      <template #body-cell-actions="props">
        <q-td :props="props">
          <q-btn
            :icon="iconNames.edit"
            flat
            dense
            round
            title="Переименовать глобально"
            :loading="renaming === props.row.name"
            @click="onRename(props.row)"
          />
          <q-btn
            :icon="iconNames.delete"
            flat
            dense
            round
            color="negative"
            title="Удалить глобально"
            :loading="deleting === props.row.name"
            @click="onDelete(props.row)"
          />
        </q-td>
      </template>
    </UiTable>
  </q-page>
</template>
