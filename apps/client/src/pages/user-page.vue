<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useUserStore, UserForm } from '@aid/md/user/client'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import type { QTableColumn } from 'quasar'
import type { User, CreateUserInput, UserRole } from '@aid/md/user/types'

const store = useUserStore()
const showForm = ref(false)
const editing = ref<User | null>(null)
const formError = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  void store.fetchAll()
})

const columns: QTableColumn<User>[] = [
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'name', label: 'Имя', field: 'name', align: 'left' },
  { name: 'role', label: 'Роль', field: 'role', align: 'left' },
  { name: 'actions', label: '', field: () => '', align: 'right' },
]

function startCreate() {
  editing.value = null
  formError.value = null
  showForm.value = true
}

function startEdit(user: User) {
  editing.value = user
  formError.value = null
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editing.value = null
  formError.value = null
}

async function onSubmit(input: CreateUserInput) {
  submitting.value = true
  formError.value = null
  try {
    if (editing.value) {
      await store.update(editing.value.id, input)
    } else {
      await store.create(input)
    }
    showForm.value = false
    editing.value = null
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

async function onDelete(user: User) {
  if (!confirm(`Удалить ${user.email}?`)) return
  try {
    await store.remove(user.id)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  }
}

function roleLabel(r: UserRole): string {
  const map: Record<UserRole, string> = { admin: 'Админ', user: 'Пользователь', manager: 'Менеджер' }
  return map[r]
}
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Пользователи</h1>

    <div class="row items-center q-mb-md">
      <UiButton
        v-if="!showForm"
        label="Добавить пользователя"
        @click="startCreate"
      />
    </div>

    <div
      v-if="showForm"
      class="q-mb-lg"
      style="max-width: 480px"
    >
      <h2 class="text-h6 q-mb-sm">
        {{ editing ? 'Редактировать' : 'Новый пользователь' }}
      </h2>
      <UserForm
        :user="editing"
        :loading="submitting"
        :error="formError"
        @submit="onSubmit"
        @cancel="cancelForm"
      />
    </div>

    <p
      v-if="store.error"
      class="text-negative q-mb-sm"
    >
      {{ store.error }}
    </p>

    <UiTable
      :rows="store.users"
      :columns="columns"
      row-key="id"
      :loading="store.loading"
    >
      <template #body-cell-role="props">
        <q-td :props="props">
          {{ roleLabel(props.row.role) }}
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props">
          <UiButton
            label="Изменить"
            flat
            dense
            @click="startEdit(props.row)"
          />
          <UiButton
            label="Удалить"
            flat
            dense
            color="negative"
            @click="onDelete(props.row)"
          />
        </q-td>
      </template>
    </UiTable>
  </q-page>
</template>
