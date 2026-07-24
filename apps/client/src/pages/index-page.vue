<script setup lang="ts">
import { ref, computed } from 'vue'
import { UiButton } from '@aid/mq/buttons'
import { UiInput } from '@aid/mq/forms'
import { UiTable, type QTableColumn } from '@aid/mq/tables'

interface DemoUser {
  id: number
  name: string
  role: string
}

const search = ref('')

const rows: DemoUser[] = [
  { id: 1, name: 'Алексей', role: 'admin' },
  { id: 2, name: 'Мария', role: 'user' },
  { id: 3, name: 'Иван', role: 'manager' },
  { id: 4, name: 'Ольга', role: 'user' },
]

const columns: QTableColumn<DemoUser>[] = [
  { name: 'id', label: 'ID', field: 'id', align: 'left' },
  { name: 'name', label: 'Имя', field: 'name', align: 'left' },
  { name: 'role', label: 'Роль', field: 'role', align: 'left' },
]

const hasRows = computed(() => rows.length > 0)
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">AID Client</h1>
    <p class="q-mb-md">Базовый каркас клиента. Quasar 2 + Vue 3 + Pinia + Vue Router + Vite.</p>
    <p class="q-mb-lg">Dev-proxy: <code>/api/*</code> → <code>http://localhost:3000/*</code> (apps/server).</p>

    <UiButton
      label="Проверить сервер"
      to="/health"
    />

    <q-card
      flat
      bordered
      class="q-mt-xl"
    >
      <q-card-section>
        <div class="text-h6 q-mb-sm">Демо @aid/mq</div>
        <p class="text-caption q-mb-md text-grey-7">Проверка работы пакета: UiButton, UiInput, UiTable.</p>
        <UiInput
          v-model="search"
          label="Поиск"
          class="q-mb-md"
        />
        <UiTable
          :rows="rows"
          :columns="columns"
          :filter="search"
          row-key="id"
        />
        <p
          v-if="!hasRows"
          class="text-caption q-mt-sm text-grey-7"
        >
          Нет данных
        </p>
      </q-card-section>
    </q-card>
  </q-page>
</template>
