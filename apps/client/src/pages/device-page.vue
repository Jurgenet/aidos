<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useDeviceStore, DeviceForm } from '@aid/me/device/client'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import type { QTableColumn } from 'quasar'
import type { Device, CreateDeviceInput } from '@aid/me/device/types'

const store = useDeviceStore()
const showForm = ref(false)
const editing = ref<Device | null>(null)
const formError = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  void store.fetchAll()
})

const columns: QTableColumn<Device>[] = [
  { name: 'title', label: 'Название', field: 'title', align: 'left' },
  { name: 'model', label: 'Модель', field: 'model', align: 'left' },
  { name: 'vendor', label: 'Производитель', field: 'vendor', align: 'left' },
  { name: 'location', label: 'Расположение', field: 'location', align: 'left' },
  { name: 'order', label: 'Порядок', field: 'order', align: 'left' },
  { name: 'flags', label: 'Флаги', field: 'isPinned', align: 'left' },
  { name: 'actions', label: '', field: () => '', align: 'right' },
]

function startCreate() {
  editing.value = null
  formError.value = null
  showForm.value = true
}

function startEdit(device: Device) {
  editing.value = device
  formError.value = null
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editing.value = null
  formError.value = null
}

async function onSubmit(input: CreateDeviceInput) {
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

async function onDelete(device: Device) {
  if (!confirm(`Удалить ${device.title}?`)) return
  try {
    await store.remove(device.id)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  }
}

function flagsCell(d: Device): string {
  const parts: string[] = []
  if (d.isPinned) parts.push('★')
  if (d.isZipped) parts.push('📦')
  if (d.isBroken) parts.push('⚠')
  return parts.join(' ')
}
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Устройства</h1>

    <div class="row items-center q-mb-md">
      <UiButton
        v-if="!showForm"
        label="Добавить устройство"
        @click="startCreate"
      />
    </div>

    <div
      v-if="showForm"
      class="q-mb-lg"
      style="max-width: 480px"
    >
      <h2 class="text-h6 q-mb-sm">
        {{ editing ? 'Редактировать' : 'Новое устройство' }}
      </h2>
      <DeviceForm
        :device="editing"
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
      :rows="store.devices"
      :columns="columns"
      row-key="id"
      :loading="store.loading"
    >
      <template #body-cell-flags="props">
        <q-td :props="props">
          {{ flagsCell(props.row) }}
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
