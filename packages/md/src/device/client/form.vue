<script setup lang="ts">
import { reactive, watch } from 'vue'
import { UiInput } from '@aid/mq/forms'
import { UiButton } from '@aid/mq/buttons'
import type { Device, CreateDeviceInput } from '../types/index.js'

/**
 * Форма создания/редактирования Device.
 *
 * Массивы (tags) пока comma-separated, как в NoteForm.
 * Булевы флажки — через `q-checkbox` (нативный для Quasar).
 * `order` — числовое поле для ручной сортировки в списке.
 *
 * Props:
 * - `device` — если передан, форма в режиме редактирования
 * - `loading` — спиннер на кнопке «Сохранить»
 * - `error` — текст ошибки под формой
 *
 * Emits:
 * - `submit` — `CreateDeviceInput` (валидация на сервере через zod)
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
    device?: Device | null
    loading?: boolean
    error?: string | null
  }>(),
  { device: null, loading: false, error: null },
)

const emit = defineEmits<{
  submit: [input: CreateDeviceInput]
  cancel: []
}>()

const form = reactive({
  title: props.device?.title ?? '',
  image: props.device?.image ?? '',
  model: props.device?.model ?? '',
  vendor: props.device?.vendor ?? '',
  location: props.device?.location ?? '',
  order: props.device?.order ?? 0,
  tagsCsv: toCsv(props.device?.tags),
  description: props.device?.description ?? '',
  isPinned: props.device?.isPinned ?? false,
  isZipped: props.device?.isZipped ?? false,
  isBroken: props.device?.isBroken ?? false,
})

watch(
  () => props.device,
  (d) => {
    form.title = d?.title ?? ''
    form.image = d?.image ?? ''
    form.model = d?.model ?? ''
    form.vendor = d?.vendor ?? ''
    form.location = d?.location ?? ''
    form.order = d?.order ?? 0
    form.tagsCsv = toCsv(d?.tags)
    form.description = d?.description ?? ''
    form.isPinned = d?.isPinned ?? false
    form.isZipped = d?.isZipped ?? false
    form.isBroken = d?.isBroken ?? false
  },
)

function onSubmit() {
  emit('submit', {
    title: form.title,
    image: form.image,
    model: form.model,
    vendor: form.vendor,
    location: form.location,
    order: form.order,
    tags: splitList(form.tagsCsv),
    description: form.description,
    isPinned: form.isPinned,
    isZipped: form.isZipped,
    isBroken: form.isBroken,
  })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <UiInput
      v-model="form.title"
      label="Название"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.image"
      label="Картинка (URL или путь)"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.model"
      label="Модель"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.vendor"
      label="Производитель"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.location"
      label="Расположение"
      class="q-mb-sm"
    />
    <UiInput
      v-model.number="form.order"
      label="Порядок (для сортировки)"
      type="number"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.tagsCsv"
      label="Теги (через запятую)"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.description"
      label="Описание"
      class="q-mb-sm"
    />
    <div class="q-mb-md row q-gutter-md">
      <q-checkbox
        v-model="form.isPinned"
        label="Закрепить"
      />
      <q-checkbox
        v-model="form.isZipped"
        label="Упаковано"
      />
      <q-checkbox
        v-model="form.isBroken"
        label="Сломано"
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
