<script setup lang="ts">

import { UiLayout } from '@aid/mq/layouts'
import { UiPageContainer } from '@aid/mq/pages'
import { UiDrawer, UiDrawerLink } from '@aid/mq/drawers'
import { UiList } from '@aid/mq/lists'
import { iconNames } from '@aid/mq/icons'

import AppHeader from '@/components/app-header/index.vue'

import { useAppUiSettingsStore } from '@/stores/app-ui-settings'

const appUiSettingsStore = useAppUiSettingsStore()

appUiSettingsStore.$subscribe((mutation, state) => {
  console.log('MUTATING APP UI SETTTINGS:', mutation, state)
})

</script>

<template>
  <UiLayout>
    <AppHeader />

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

        <UiDrawerLink
          :icon="iconNames.backup"
          to="/backup"
          label="Бэкапы"
        />

        <UiDrawerLink
          :icon="iconNames.history"
          to="/log"
          label="История"
        />

        <UiDrawerLink
          :icon="iconNames.folder"
          to="/file"
          label="Файлы"
        />
      </UiList>
    </UiDrawer>

    <UiPageContainer>
      <router-view />
    </UiPageContainer>
  </UiLayout>
</template>
