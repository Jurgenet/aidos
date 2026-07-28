<script setup lang="ts">

import { version } from '../../../package.json'

import { UiHeader } from '@aid/mq/headers'
import { UiToolbar } from '@aid/mq/toolbars'

import { useAppUiSettingsStore } from '@/stores/app-ui-settings'

const appUiSettingsStore = useAppUiSettingsStore()

appUiSettingsStore.$subscribe((mutation, state) => {
  console.log('MUTATING APP UI SETTTINGS:', mutation, state)
})

</script>

<template>
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
</template>
