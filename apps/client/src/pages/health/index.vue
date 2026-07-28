<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">Server health</h1>

    <q-card
      v-if="loading"
      class="q-mb-md"
    >
      <q-card-section class="row items-center">
        <q-spinner class="q-mr-sm" />
        <span>Загрузка...</span>
      </q-card-section>
    </q-card>

    <q-card
      v-else-if="error"
      class="bg-negative text-white q-mb-md"
    >
      <q-card-section>
        <div class="text-h6">Ошибка</div>
        <div>{{ error }}</div>
      </q-card-section>
    </q-card>

    <q-card
      v-else-if="data"
      class="q-mb-md"
    >
      <q-card-section>
        <div class="text-h6">status: {{ data.status }}</div>
        <div>mongo: {{ data.mongo ?? '—' }}</div>
        <div v-if="data.uptime !== undefined">uptime: {{ data.uptime }}s</div>
        <div class="text-caption q-mt-sm">{{ data.timestamp }}</div>
      </q-card-section>
    </q-card>

    <q-btn
      color="primary"
      label="Обновить"
      :loading="loading"
      @click="load"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

type Health = {
  status: string
  mongo?: string
  uptime?: number
  timestamp: string
}

const data = ref<Health | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  try {
    const res = await fetch('/api/health/ready')
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    data.value = (await res.json()) as Health
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
