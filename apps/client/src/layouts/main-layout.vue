<script setup lang="ts">

import { version } from '../../package.json'

import { UiLayout } from '@aid/mq/layouts'
import { UiHeader } from '@aid/mq/headers'
import { UiToolbar } from '@aid/mq/toolbars'
import { UiDrawer } from '@aid/mq/drawers'
import { UiList, UiListItemSection } from '@aid/mq/lists'
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
          <UiListItemSection :icon="iconNames.home" />
          <UiListItemSection label="Главная" />
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/health"
        >
          <UiListItemSection :icon="iconNames.monitorHeart" />
          <UiListItemSection label="Health" />
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/about"
        >
          <UiListItemSection :icon="iconNames.info" />
          <UiListItemSection label="О проекте" />
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/user"
        >
          <UiListItemSection :icon="iconNames.people" />
          <UiListItemSection label="Пользователи" />
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/account"
        >
          <UiListItemSection :icon="iconNames.key" />
          <UiListItemSection label="Аккаунты" />
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/note"
        >
          <UiListItemSection :icon="iconNames.stickyNote2" />
          <UiListItemSection label="Заметки" />
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/device"
        >
          <UiListItemSection :icon="iconNames.devices" />
          <UiListItemSection label="Устройства" />
        </q-item>
      </UiList>
    </UiDrawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </UiLayout>
</template>
