<template>
  <q-page padding>
    <h1 class="text-h4 q-mb-md">AID Client</h1>
    <p class="q-mb-md">Базовый каркас клиента. Quasar 2 + Vue 3 + Pinia + Vue Router + Vite.</p>
    <p class="q-mb-lg">
      Dev-proxy: <code>/api/*</code> → <code>http://localhost:3000/*</code> (apps/server).
    </p>
    <q-btn color="primary" label="Проверить сервер" :to="{ name: 'health' }" />
  </q-page>
</template>

<script setup lang="ts"></script>
