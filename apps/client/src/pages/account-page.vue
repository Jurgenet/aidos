<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAccountStore, AccountForm } from '@aid/me/account/client'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import type { QTableColumn } from 'quasar'
import type { Account, CreateAccountInput } from '@aid/me/account/types'

const store = useAccountStore()
const showForm = ref(false)
const editing = ref<Account | null>(null)
const formError = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  void store.fetchAll()
})

const columns: QTableColumn<Account>[] = [
  { name: 'title', label: 'Название', field: 'title', align: 'left' },
  { name: 'group', label: 'Группа', field: 'group', align: 'left' },
  { name: 'email', label: 'Email', field: 'email', align: 'left' },
  { name: 'login', label: 'Логин', field: 'login', align: 'left' },
  { name: 'actions', label: '', field: () => '', align: 'right' },
]

function startCreate() {
  editing.value = null
  formError.value = null
  showForm.value = true
}

function startEdit(account: Account) {
  editing.value = account
  formError.value = null
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editing.value = null
  formError.value = null
}

async function onSubmit(input: CreateAccountInput) {
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

async function onDelete(account: Account) {
  if (!confirm(`Удалить ${account.title}?`)) return
  try {
    await store.remove(account.id)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  }
}
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Аккаунты</h1>

    <div class="row items-center q-mb-md">
      <UiButton
        v-if="!showForm"
        label="Добавить аккаунт"
        @click="startCreate"
      />
    </div>

    <div
      v-if="showForm"
      class="q-mb-lg"
      style="max-width: 480px"
    >
      <h2 class="text-h6 q-mb-sm">
        {{ editing ? 'Редактировать' : 'Новый аккаунт' }}
      </h2>
      <AccountForm
        :account="editing"
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
      :rows="store.accounts"
      :columns="columns"
      row-key="id"
      :loading="store.loading"
    >
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
