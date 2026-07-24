<script setup lang="ts">

import { version } from '../../package.json'

import { UiLayout } from '@aid/mq/layouts'
import { UiHeader } from '@aid/mq/headers'
import { UiToolbar } from '@aid/mq/toolbars'
import { UiDrawer } from '@aid/mq/drawers'
import { UiList } from '@aid/mq/lists'
import { UiIcon, iconNames } from '@aid/mq/icons'

import { useAppUiSettingsStore } from '@/stores/app-ui-settings'

const appUiSettingsStore = useAppUiSettingsStore()

appUiSettingsStore.$subscribe((mutation, state) => {
  console.log('MUTATING APP UI SETTTINGS:', mutation, state)
})

</script>

<template>
  <UiLayout>
    <UiHeader>
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
          @click="appUiSettingsStore.toggleDrawerLeft"
        />
      </UiToolbar>
    </UiHeader>

    <UiDrawer v-model="appUiSettingsStore.isOpenDrawerLeft">
      <UiList topic="Навигация">
        <q-item
          clickable
          v-ripple
          to="/"
          exact
        >
          <q-item-section avatar><UiIcon :name="iconNames.home" /></q-item-section>
          <q-item-section>Главная</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/health"
        >
          <q-item-section avatar><UiIcon :name="iconNames.monitorHeart" /></q-item-section>
          <q-item-section>Health</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/about"
        >
          <q-item-section avatar><UiIcon :name="iconNames.info" /></q-item-section>
          <q-item-section>О проекте</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/user"
        >
          <q-item-section avatar><UiIcon :name="iconNames.people" /></q-item-section>
          <q-item-section>Пользователи</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/account"
        >
          <q-item-section avatar><UiIcon :name="iconNames.key" /></q-item-section>
          <q-item-section>Аккаунты</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/note"
        >
          <q-item-section avatar><UiIcon :name="iconNames.stickyNote2" /></q-item-section>
          <q-item-section>Заметки</q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/device"
        >
          <q-item-section avatar><UiIcon :name="iconNames.devices" /></q-item-section>
          <q-item-section>Устройства</q-item-section>
        </q-item>
      </UiList>
    </UiDrawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </UiLayout>
</template>
