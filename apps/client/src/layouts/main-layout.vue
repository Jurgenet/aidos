<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
        <q-toolbar-title>AID Client</q-toolbar-title>
        <div>v{{ version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>Навигация</q-item-label>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'home' }"
          exact
        >
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Главная</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'health' }"
        >
          <q-item-section avatar><q-icon name="monitor_heart" /></q-item-section>
          <q-item-section>Health</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'about' }"
        >
          <q-item-section avatar><q-icon name="info" /></q-item-section>
          <q-item-section>О проекте</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'user' }"
        >
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Пользователи</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'account' }"
        >
          <q-item-section avatar><q-icon name="key" /></q-item-section>
          <q-item-section>Аккаунты</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          :to="{ name: 'note' }"
        >
          <q-item-section avatar><q-icon name="sticky_note_2" /></q-item-section>
          <q-item-section>Заметки</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { version } from '../../package.json'

const leftDrawerOpen = ref(false)
const toggleLeftDrawer = (): void => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
