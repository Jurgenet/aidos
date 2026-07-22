<script setup lang="ts">
import { reactive, watch } from 'vue'
import { UiInput } from '@aid/mq/forms'
import { UiButton } from '@aid/mq/buttons'
import type { Account, CreateAccountInput } from '../types/index.js'

/**
 * Форма создания/редактирования Account.
 *
 * Props:
 * - `account` — если передан, форма в режиме редактирования (поля заполняются)
 * - `loading` — спиннер на кнопке «Сохранить»
 * - `error` — текст ошибки под формой
 *
 * Emits:
 * - `submit` — передаёт `CreateAccountInput` (валидация на сервере через zod)
 * - `cancel` — кнопка «Отмена»
 */
const props = withDefaults(
  defineProps<{
    account?: Account | null
    loading?: boolean
    error?: string | null
  }>(),
  { account: null, loading: false, error: null },
)

const emit = defineEmits<{
  submit: [input: CreateAccountInput]
  cancel: []
}>()

const form = reactive<CreateAccountInput>({
  title: props.account?.title ?? '',
  group: props.account?.group ?? '',
  email: props.account?.email ?? '',
  login: props.account?.login ?? '',
  password: props.account?.password ?? '',
  link: props.account?.link ?? '',
  description: props.account?.description ?? '',
})

watch(
  () => props.account,
  (a) => {
    form.title = a?.title ?? ''
    form.group = a?.group ?? ''
    form.email = a?.email ?? ''
    form.login = a?.login ?? ''
    form.password = a?.password ?? ''
    form.link = a?.link ?? ''
    form.description = a?.description ?? ''
  },
)

function onSubmit() {
  emit('submit', {
    title: form.title,
    group: form.group,
    email: form.email,
    login: form.login,
    password: form.password,
    link: form.link,
    description: form.description,
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
      v-model="form.group"
      label="Группа"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.email"
      label="Email"
      type="email"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.login"
      label="Логин"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.password"
      label="Пароль"
      type="password"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.link"
      label="Ссылка"
      type="url"
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
