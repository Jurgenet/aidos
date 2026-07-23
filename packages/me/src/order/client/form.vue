<script setup lang="ts">
import { reactive, watch } from 'vue'
import { UiInput } from '@aid/mq/forms'
import { UiButton } from '@aid/mq/buttons'
import type { Order, CreateOrderInput } from '../types/index.js'

function toDateInput(d: Date | string | undefined): string {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function fromDateInput(s: string): Date {
  const d = new Date(s)
  return isNaN(d.getTime()) ? new Date() : d
}

/**
 * Форма создания/редактирования Order.
 *
 * Props:
 * - `order` — если передан, форма в режиме редактирования (поля заполняются)
 * - `loading` — спиннер на кнопке «Сохранить»
 * - `error` — текст ошибки под формой
 *
 * Emits:
 * - `submit` — передаёт `CreateOrderInput` (валидация на сервере через zod)
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
    order?: Order | null
    loading?: boolean
    error?: string | null
  }>(),
  { order: null, loading: false, error: null },
)

const emit = defineEmits<{
  submit: [input: CreateOrderInput]
  cancel: []
}>()

const form = reactive({
  date: toDateInput(props.order?.date),
  group: props.order?.group ?? '',
  title: props.order?.title ?? '',
  price: props.order?.price ?? 0,
  amount: props.order?.amount ?? 1,
  vendor: props.order?.vendor ?? '',
  seller: props.order?.seller ?? '',
  link: props.order?.link ?? '',
  tags: props.order?.tags ?? [],
  tagsCsv: toCsv(props.order?.tags),
  description: props.order?.description ?? '',
})

watch(
  () => props.order,
  (o) => {
    form.date = toDateInput(o?.date)
    form.group = o?.group ?? ''
    form.title = o?.title ?? ''
    form.price = o?.price ?? 0
    form.amount = o?.amount ?? 1
    form.vendor = o?.vendor ?? ''
    form.seller = o?.seller ?? ''
    form.link = o?.link ?? ''
    form.description = o?.description ?? ''
    form.tags = o?.tags ?? []
    form.tagsCsv = toCsv(o?.tags)
  },
)

function onSubmit() {
  emit('submit', {
    date: fromDateInput(form.date),
    group: form.group,
    title: form.title,
    price: form.price,
    amount: form.amount,
    vendor: form.vendor,
    seller: form.seller,
    link: form.link,
    tags: splitList(form.tagsCsv),
    description: form.description,
  })
}

</script>

<template>
  <form @submit.prevent="onSubmit">
    <UiInput
      v-model="form.date"
      label="Дата (ГГГГ-ММ-ДД)"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.group"
      label="Группа"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.title"
      label="Название"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.price"
      label="Цена"
      type="number"
      step="0.01"
      class="q-mb-sm"
    />
    <UiInput
      v-model.number="form.amount"
      label="Количество"
      type="number"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.vendor"
      label="Поставщик"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.seller"
      label="Продавец"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.link"
      label="Ссылка"
      type="url"
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