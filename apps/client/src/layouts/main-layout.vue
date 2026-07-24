<script setup lang="ts">
import { ref } from 'vue'
import { version } from '../../package.json'
import { UiToolbar } from '@aid/mq/toolbars'

const leftDrawerOpen = ref(false)
const toggleLeftDrawer = (): void => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<template>
  <q-layout view="hHh Lpr lFf">
    <q-header elevated>
      <UiToolbar
        :version="version"
        title="AID"
      >
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />
      </UiToolbar>
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
          to="/home"
          exact
        >
          <q-item-section avatar><q-icon name="home" /></q-item-section>
          <q-item-section>Главная</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/health"
        >
          <q-item-section avatar><q-icon name="monitor_heart" /></q-item-section>
          <q-item-section>Health</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/about"
        >
          <q-item-section avatar><q-icon name="info" /></q-item-section>
          <q-item-section>О проекте</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/user"
        >
          <q-item-section avatar><q-icon name="people" /></q-item-section>
          <q-item-section>Пользователи</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/account"
        >
          <q-item-section avatar><q-icon name="key" /></q-item-section>
          <q-item-section>Аккаунты</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/note"
        >
          <q-item-section avatar><q-icon name="sticky_note_2" /></q-item-section>
          <q-item-section>Заметки</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/device"
        >
          <q-item-section avatar><q-icon name="devices" /></q-item-section>
          <q-item-section>Устройства</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>
