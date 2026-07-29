<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { UiButton } from '@aid/mq/buttons'
import { iconNames } from '@aid/mq/icons'

type FileMeta = {
  id: string
  originalName: string
  mimeType: string
  size: number
  uploadedAt: string
  tags: string[]
}

const $q = useQuasar()
const items = ref<FileMeta[]>([])
const loading = ref(false)
const uploading = ref(false)
const error = ref<string | null>(null)

const renameDialog = ref(false)
const renameInput = ref('')
const renameTagsInput = ref<string[]>([])
const renameTarget = ref<FileMeta | null>(null)
const renaming = ref(false)

const lightboxOpen = ref(false)
const lightboxUrl = ref<string | null>(null)
const lightboxName = ref('')

const searchQuery = ref('')
const activeTagFilters = ref<string[]>([])
const allKnownTags = computed(() => {
  const set = new Set<string>()
  for (const f of items.value) {
    for (const t of f.tags) set.add(t)
  }
  return Array.from(set).sort()
})
/** Теги, которые припишутся следующему batch-upload (comma-separated). */
const nextUploadTags = ref('')

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
    const params = new URLSearchParams()
    if (searchQuery.value.trim() !== '') {
      params.set('q', searchQuery.value.trim())
    }
    for (const t of activeTagFilters.value) {
      params.append('tag', t)
    }
    const qs = params.toString()
    const r = await fetch(`/api/files${qs !== '' ? `?${qs}` : ''}`)
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
  // Парсим теги для batch-upload: split по запятой, trim, lowercase, dedup
  const tagsForBatch = Array.from(
    new Set(
      nextUploadTags.value
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t !== ''),
    ),
  )
  let okCount = 0
  const errors: string[] = []
  for (const f of files) {
    const fd = new FormData()
    fd.append('file', f)
    if (tagsForBatch.length > 0) {
      fd.append('tags', tagsForBatch.join(','))
    }
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

function onRename(file: FileMeta): void {
  renameTarget.value = file
  renameInput.value = file.originalName
  renameTagsInput.value = [...file.tags]
  renameDialog.value = true
}

function openLightbox(file: FileMeta): void {
  lightboxUrl.value = viewUrl(file.id)
  lightboxName.value = file.originalName
  lightboxOpen.value = true
}

function toggleTagFilter(tag: string): void {
  const idx = activeTagFilters.value.indexOf(tag)
  if (idx >= 0) activeTagFilters.value.splice(idx, 1)
  else activeTagFilters.value.push(tag)
}

async function confirmRename(): Promise<void> {
  const target = renameTarget.value
  if (!target) {
    renameDialog.value = false
    return
  }
  const trimmedName = renameInput.value.trim()
  const cleanedTags = renameTagsInput.value
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t !== '')
  const tagsChanged =
    cleanedTags.length !== target.tags.length ||
    cleanedTags.some((t, i) => t !== target.tags[i])
  const nameChanged = trimmedName !== '' && trimmedName !== target.originalName
  if (!nameChanged && !tagsChanged) {
    renameDialog.value = false
    return
  }
  renaming.value = true
  try {
    const body: { originalName?: string; tags?: string[] } = {}
    if (nameChanged) body.originalName = trimmedName
    if (tagsChanged) body.tags = cleanedTags
    const r = await fetch(`/api/files/${target.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!r.ok) {
      const data = (await r.json().catch(() => ({}))) as { error?: { message?: string } }
      throw new Error(data.error?.message ?? `HTTP ${r.status}`)
    }
    $q.notify({ type: 'positive', message: 'Сохранено' })
    renameDialog.value = false
    renameTarget.value = null
    void load()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    error.value = msg
    $q.notify({ type: 'negative', message: `Не удалось: ${msg}` })
  } finally {
    renaming.value = false
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

// Live-фильтрация: при изменении поиска или выбранных тегов — load().
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimer !== null) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void load()
  }, 250)
})
watch(activeTagFilters, () => {
  void load()
}, { deep: true })
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Файлы</h1>

    <q-card class="q-mb-md">
      <q-card-section class="q-gutter-md">
        <div class="row items-center q-gutter-md">
          <UiButton
            :icon="iconNames.cloudUpload"
            label="Загрузить"
            :loading="uploading"
            @click="pickFiles"
          />
          <q-input
            v-model="nextUploadTags"
            outlined
            dense
            label="Теги (через запятую)"
            style="min-width: 240px"
            clearable
            placeholder="work, screenshot, 2026"
            @keyup.enter="pickFiles"
          >
            <template #prepend>
              <q-icon :name="iconNames.label" />
            </template>
          </q-input>
          <UiButton
            :icon="iconNames.refresh"
            label="Обновить"
            flat
            :loading="loading"
            @click="load"
          />
        </div>
        <div class="row items-center q-gutter-md q-mt-sm">
          <q-input
            v-model="searchQuery"
            outlined
            dense
            clearable
            placeholder="Поиск по имени"
            style="min-width: 240px"
          >
            <template #prepend>
              <q-icon :name="iconNames.search" />
            </template>
          </q-input>
          <q-select
            v-model="activeTagFilters"
            :options="allKnownTags"
            label="Фильтр по тегам (AND)"
            multiple
            use-chips
            clearable
            dense
            outlined
            style="min-width: 320px"
          />
          <span
            v-if="searchQuery || activeTagFilters.length > 0"
            class="text-caption text-grey-7"
          >
            Найдено: {{ items.length }}
          </span>
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
          <div
            class="preview-wrapper"
            :class="{ 'is-clickable': isImage(file.mimeType) }"
            @click="isImage(file.mimeType) && openLightbox(file)"
          >
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
            <div
              v-if="file.tags.length > 0"
              class="q-mt-sm q-gutter-xs row"
            >
              <q-chip
                v-for="tag in file.tags"
                :key="tag"
                :label="tag"
                size="sm"
                :clickable="!activeTagFilters.includes(tag)"
                :color="activeTagFilters.includes(tag) ? 'primary' : undefined"
                :text-color="activeTagFilters.includes(tag) ? 'white' : undefined"
                icon="label"
                @click="toggleTagFilter(tag)"
              />
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
            <q-btn
              :icon="iconNames.edit"
              flat
              dense
              round
              title="Переименовать"
              @click="onRename(file)"
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

    <q-dialog
      v-model="renameDialog"
      persistent
    >
      <q-card style="min-width: 380px">
        <q-card-section>
          <div class="text-h6">Переименовать</div>
        </q-card-section>
        <q-card-section class="q-pt-none q-gutter-sm">
          <q-input
            v-model="renameInput"
            autofocus
            outlined
            dense
            label="Новое имя"
            :rules="[(v: string) => (v.trim().length > 0) || 'Имя не может быть пустым']"
          />
          <q-select
            v-model="renameTagsInput"
            :options="allKnownTags"
            label="Теги"
            multiple
            use-chips
            use-input
            new-value-mode="add-unique"
            outlined
            dense
            clearable
            hint="Enter — добавить, Backspace — удалить"
            @new-value="(v: string) => renameTagsInput.push(v.trim().toLowerCase())"
            @keyup.enter.stop
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            label="Отмена"
            :disable="renaming"
            @click="renameDialog = false"
          />
          <q-btn
            color="primary"
            label="Сохранить"
            :loading="renaming"
            @click="confirmRename"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      v-model="lightboxOpen"
      full-width
      full-height
      seamless
    >
      <div
        class="lightbox-backdrop"
        @click.self="lightboxOpen = false"
      >
        <q-btn
          :icon="iconNames.openInNew"
          flat
          dense
          round
          color="white"
          class="lightbox-open-btn"
          :href="lightboxUrl ?? '#'"
          target="_blank"
          title="Открыть в новой вкладке"
        />
        <q-btn
          :icon="'close'"
          flat
          dense
          round
          color="white"
          class="lightbox-close-btn"
          title="Закрыть"
          @click="lightboxOpen = false"
        />
        <img
          v-if="lightboxUrl"
          :src="lightboxUrl"
          :alt="lightboxName"
          class="lightbox-image"
        >
        <div class="lightbox-caption">
          {{ lightboxName }}
        </div>
      </div>
    </q-dialog>
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
  position: relative;
}
.preview-wrapper.is-clickable {
  cursor: zoom-in;
}
.preview-wrapper.is-clickable:hover .preview-image {
  transform: scale(1.02);
  transition: transform 0.15s ease;
}
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  transition: transform 0.15s ease;
}
.preview-icon {
  color: #b0b0b0;
}

.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 6000;
}
.lightbox-image {
  max-width: 95vw;
  max-height: 90vh;
  object-fit: contain;
  user-select: none;
  -webkit-user-drag: none;
}
.lightbox-caption {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-family: monospace;
  max-width: 80vw;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lightbox-close-btn,
.lightbox-open-btn {
  position: absolute;
  top: 16px;
  background: rgba(0, 0, 0, 0.4);
}
.lightbox-close-btn {
  right: 16px;
}
.lightbox-open-btn {
  right: 64px;
}
</style>
