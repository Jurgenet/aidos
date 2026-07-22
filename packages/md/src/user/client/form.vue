<script setup lang="ts">
import { reactive, watch } from 'vue'
import { UiInput } from '@aid/mq/forms'
import { UiButton } from '@aid/mq/buttons'
import { userRoleOptions, type User, type CreateUserInput } from '../types/index.js'

/**
 * Форма создания/редактирования User.
 *
 * Props:
 * - `user` — если передан, форма в режиме редактирования (поля заполняются)
 * - `loading` — спиннер на кнопке «Сохранить»
 * - `error` — текст ошибки под формой
 *
 * Emits:
 * - `submit` — передаёт `CreateUserInput` (валидация на сервере через zod)
 * - `cancel` — кнопка «Отмена»
 */
const props = withDefaults(
  defineProps<{
    user?: User | null
    loading?: boolean
    error?: string | null
  }>(),
  { user: null, loading: false, error: null },
)

const emit = defineEmits<{
  submit: [input: CreateUserInput]
  cancel: []
}>()

const form = reactive<CreateUserInput>({
  email: props.user?.email ?? '',
  name: props.user?.name ?? '',
  role: props.user?.role ?? 'user',
})

watch(
  () => props.user,
  (u) => {
    form.email = u?.email ?? ''
    form.name = u?.name ?? ''
    form.role = u?.role ?? 'user'
  },
)

function onSubmit() {
  emit('submit', { email: form.email, name: form.name, role: form.role })
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <UiInput
      v-model="form.email"
      label="Email"
      type="email"
      class="q-mb-sm"
    />
    <UiInput
      v-model="form.name"
      label="Имя"
      class="q-mb-sm"
    />
    <div class="q-mb-md">
      <label
        for="user-role"
        class="block q-mb-xs"
        >Роль</label
      >
      <select
        id="user-role"
        v-model="form.role"
        class="q-select"
      >
        <option
          v-for="r in userRoleOptions"
          :key="r"
          :value="r"
        >
          {{ r }}
        </option>
      </select>
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
