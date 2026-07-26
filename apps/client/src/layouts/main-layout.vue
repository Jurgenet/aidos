<script setup lang="ts">

import { version } from '../../package.json'

import { UiLayout } from '@aid/mq/layouts'
import { UiHeader } from '@aid/mq/headers'
import { UiToolbar } from '@aid/mq/toolbars'
import { UiDrawer, UiDrawerLink } from '@aid/mq/drawers'
import { UiList, UiListItem, UiListItemSection } from '@aid/mq/lists'
import { iconNames } from '@aid/mq/icons'

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
        <UiDrawerLink
          :icon="iconNames.home"
          to="/"
          label="Главная"
        />

        <UiDrawerLink
          :icon="iconNames.monitorHeart"
          to="/health"
          label="Health"
        />

        <UiDrawerLink
          :icon="iconNames.info"
          to="/about"
          label="О проекте"
        />

        <UiDrawerLink
          :icon="iconNames.people"
          to="/user"
          label="Пользователи"
        />

        <UiDrawerLink
          :icon="iconNames.key"
          to="/account"
          label="Аккаунты"
        />

        <UiDrawerLink
          :icon="iconNames.stickyNote2"
          to="/note"
          label="Заметки"
        />

        <UiDrawerLink
          :icon="iconNames.devices"
          to="/device"
          label="Устройства"
        />
      </UiList>
    </UiDrawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </UiLayout>
</template>
