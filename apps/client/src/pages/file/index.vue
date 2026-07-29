<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { UiButton } from '@aid/mq/buttons'
import { iconNames } from '@aid/mq/icons'

type FileMeta = {
  id: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
}

const $q = useQuasar()
const items = ref<FileMeta[]>([])
const loading = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

const hasFiles = computed(() => items.value.length > 0)

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
  })
}

function isImage(mime: string): boolean {
  return mime.startsWith('image/')
}

function viewUrl(id: string): string {
  return `/api/files/${id}`
}

function downloadUrl(id: string): string {
  return `/api/files/${id}/download`
}

function absoluteViewUrl(id: string): string {
  return `${window.location.origin}${viewUrl(id)}`
}

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const r = await fetch('/api/files')
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = (await r.json()) as { items: FileMeta[]; total: number }
    items.value = data.items
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function pickFiles(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = () => {
    if (!input.files || input.files.length === 0) return
    void uploadFiles(Array.from(input.files))
  }
  input.click()
}

async function uploadFiles(files: File[]): Promise<void> {
  uploading.value = true
  error.value = null
  let okCount = 0
  const errors: string[] = []
  for (const f of files) {
    const fd = new FormData()
    fd.append('file', f)
    try {
      const r = await fetch('/api/files', { method: 'POST', body: fd })
      if (!r.ok) {
        const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
        errors.push(`${f.name}: ${data.error?.message ?? `HTTP ${r.status}`}`)
        continue
      }
      okCount++
    } catch (e) {
      errors.push(`${f.name}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  uploading.value = false
  if (errors.length > 0) {
    $q.notify({ type: 'negative', message: `Ошибки: ${errors.join('; ')}` })
  }
  if (okCount > 0) {
    $q.notify({ type: 'positive', message: `Загружено: ${okCount}` })
  }
  void load()
}

async function copyLink(file: FileMeta): Promise<void> {
  const link = absoluteViewUrl(file.id)
  try {
    await navigator.clipboard.writeText(link)
    $q.notify({ type: 'positive', message: 'Ссылка скопирована' })
  } catch {
    $q.notify({ type: 'warning', message: `Не удалось скопировать: ${link}` })
  }
}

function onDelete(file: FileMeta): void {
  if (!confirm(`Удалить "${file.originalName}"?\n\nФайл будет удалён с диска и из БД. Это необратимо.`)) {
    return
  }
  void (async () => {
    try {
      const r = await fetch(`/api/files/${file.id}`, { method: 'DELETE' })
      if (!r.ok && r.status !== 204) {
        const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
        throw new Error(data.error?.message ?? `HTTP ${r.status}`)
      }
      $q.notify({ type: 'positive', message: 'Удалено' })
      void load()
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      error.value = msg
      $q.notify({ type: 'negative', message: `Не удалось: ${msg}` })
    }
  })()
}

onMounted(load)
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Файлы</h1>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="row items-center q-gutter-md">
          <UiButton
            :icon="iconNames.cloudUpload"
            label="Загрузить"
            :loading="uploading"
            @click="pickFiles"
          />
          <UiButton
            :icon="iconNames.refresh"
            label="Обновить"
            flat
            :loading="loading"
            @click="load"
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
      v-if="!loading && !hasFiles"
      class="text-grey-7"
    >
      Файлов пока нет. Нажми «Загрузить» чтобы добавить.
    </p>

    <div class="row q-col-gutter-md">
      <div
        v-for="file in items"
        :key="file.id"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card class="file-card">
          <div class="preview-wrapper">
            <img
              v-if="isImage(file.mimeType)"
              :src="viewUrl(file.id)"
              :alt="file.originalName"
              class="preview-image"
            >
            <q-icon
              v-else
              :name="iconNames.insertDriveFile"
              size="64px"
              class="preview-icon"
            />
          </div>

          <q-card-section class="q-pa-md">
            <div
              class="text-subtitle2 ellipsis"
              :title="file.originalName"
            >
              {{ file.originalName }}
            </div>
            <div class="text-caption text-grey-7">
              {{ formatBytes(file.size) }} · {{ file.mimeType }}
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              {{ formatDate(file.uploadedAt) }}
            </div>
          </q-card-section>

          <q-separator />

          <q-card-actions class="q-pa-sm">
            <q-btn
              :href="viewUrl(file.id)"
              :icon="iconNames.openInNew"
              flat
              dense
              round
              title="Открыть в новой вкладке"
              target="_blank"
            />
            <q-btn
              :href="downloadUrl(file.id)"
              :icon="iconNames.download"
              flat
              dense
              round
              title="Скачать"
              download
            />
            <q-btn
              :icon="iconNames.contentCopy"
              flat
              dense
              round
              title="Скопировать прямую ссылку"
              @click="copyLink(file)"
            />
            <q-space />
            <q-btn
              :icon="iconNames.delete"
              flat
              dense
              round
              color="negative"
              title="Удалить"
              @click="onDelete(file)"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<style scoped>
.file-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.preview-wrapper {
  height: 180px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-top-left-radius: 4px;
  border-top-right-radius: 4px;
}
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.preview-icon {
  color: #b0b0b0;
}
</style>
