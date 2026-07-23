<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useNoteStore, NoteForm } from '@aid/me/note/client'
import { UiButton } from '@aid/mq/buttons'
import { UiTable } from '@aid/mq/tables'
import type { QTableColumn } from 'quasar'
import type { Note, CreateNoteInput } from '@aid/me/note/types'

const store = useNoteStore()
const showForm = ref(false)
const editing = ref<Note | null>(null)
const formError = ref<string | null>(null)
const submitting = ref(false)

onMounted(() => {
  void store.fetchAll()
})

const columns: QTableColumn<Note>[] = [
  { name: 'title', label: 'Заголовок', field: 'title', align: 'left' },
  { name: 'tags', label: 'Теги', field: 'tags', align: 'left' },
  { name: 'isPinned', label: 'Закреплена', field: 'isPinned', align: 'left' },
  { name: 'actions', label: '', field: () => '', align: 'right' },
]

function startCreate() {
  editing.value = null
  formError.value = null
  showForm.value = true
}

function startEdit(note: Note) {
  editing.value = note
  formError.value = null
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editing.value = null
  formError.value = null
}

async function onSubmit(input: CreateNoteInput) {
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

async function onDelete(note: Note) {
  if (!confirm(`Удалить ${note.title}?`)) return
  try {
    await store.remove(note.id)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  }
}

// Массив тегов → строка для отображения в таблице.
function tagsCell(tags: string[] | undefined): string {
  return tags && tags.length > 0 ? tags.join(', ') : '—'
}
</script>

<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Заметки</h1>

    <div class="row items-center q-mb-md">
      <UiButton
        v-if="!showForm"
        label="Добавить заметку"
        @click="startCreate"
      />
    </div>

    <div
      v-if="showForm"
      class="q-mb-lg"
      style="max-width: 480px"
    >
      <h2 class="text-h6 q-mb-sm">
        {{ editing ? 'Редактировать' : 'Новая заметка' }}
      </h2>
      <NoteForm
        :note="editing"
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
      :rows="store.notes"
      :columns="columns"
      row-key="id"
      :loading="store.loading"
    >
      <template #body-cell-tags="props">
        <q-td :props="props">
          {{ tagsCell(props.row.tags) }}
        </q-td>
      </template>
      <template #body-cell-isPinned="props">
        <q-td :props="props">
          {{ props.row.isPinned ? '★' : '' }}
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
