<script setup lang="ts">
import { reactive, watch } from 'vue'
import { UiInput } from '@aid/mq/forms'
import { UiButton } from '@aid/mq/buttons'
import type { Note, CreateNoteInput } from '../types/index.js'

/**
 * Форма создания/редактирования Note.
 *
 * Массивы (links, tags) пока вводятся как comma-separated строка —
 * `splitList()` парсит в массив. Зеркально в NoteForm есть `toCsv()`
 * для обратного преобразования при заполнении из props.
 *
 * Props:
 * - `note` — если передан, форма в режиме редактирования (поля заполняются)
 * - `loading` — спиннер на кнопке «Сохранить»
 * - `error` — текст ошибки под формой
 *
 * Emits:
 * - `submit` — передаёт `CreateNoteInput` (валидация на сервере через zod)
 * - `cancel` — кнопка «Отмена»
 */

function splitList(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter((x) => x.length > 0)
}

function toCsv(arr: string[] | undefined): string {
  return arr && arr.length > 0 ? arr.join(', ') : ''
}

const props = withDefaults(
  defineProps<{
    note?: Note | null
    loading?: boolean
    error?: string | null
  }>(),
  { note: null, loading: false, error: null },
)

const emit = defineEmits<{
  submit: [input: CreateNoteInput]
  cancel: []
}>()

const form = reactive({
  title: props.note?.title ?? '',
  content: props.note?.content ?? '',
  linksCsv: toCsv(props.note?.links),
  tagsCsv: toCsv(props.note?.tags),
  isPinned: props.note?.isPinned ?? false,
})

watch(
  () => props.note,
  (n) => {
    form.title = n?.title ?? ''
    form.content = n?.content ?? ''
    form.linksCsv = toCsv(n?.links)
    form.tagsCsv = toCsv(n?.tags)
    form.isPinned = n?.isPinned ?? false
  },
)

function onSubmit() {
  emit('submit', {
    title: form.title,
    content: form.content,
    links: splitList(form.linksCsv),
    tags: splitList(form.tagsCsv),
    isPinned: form.isPinned,
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <UiInput
      v-model="form.title"
      label="Заголовок"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.content"
      label="Содержимое"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.linksCsv"
      label="Ссылки (через запятую)"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.tagsCsv"
      label="Теги (через запятую)"
      class="q-mb-sm"
    />
    <div class="q-mb-md">
      <q-checkbox
        v-model="form.isPinned"
        label="Закрепить"
      />
    </div>
    <p
      v-if="error"
      class="text-negative q-mb-sm"
    >
      {{ error }}
    </p>
    <div class="row q-gutter-sm">
      <UiButton
        type="submit"
        label="Сохранить"
        :loading="loading"
      />
      <UiButton
        type="button"
        label="Отмена"
        flat
        @click="emit('cancel')"
      />
    </div>
  </form>
</template>
