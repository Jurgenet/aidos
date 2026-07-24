/*
 * Хранилище установок UI
 */

import { defineStore, acceptHMRUpdate } from 'pinia'
import { type Ref, ref } from 'vue'

export const useAppUiSettingsStore = defineStore('AppUiSettings', () => {
    const isOpenDrawerLeft: Ref<boolean> = ref(false)
    const isOpenDrawerRight: Ref<boolean> = ref(false)

    function toggleDrawerLeft() {
      isOpenDrawerLeft.value = !isOpenDrawerLeft.value
    }

    function toggleDrawerRight() {
      isOpenDrawerLeft.value = !isOpenDrawerLeft.value
    }

    function $reset() {
      isOpenDrawerLeft.value = false
      isOpenDrawerRight.value = false
    }

    return {
      isOpenDrawerLeft,
      toggleDrawerLeft,
      //
      isOpenDrawerRight,
      toggleDrawerRight,
      //
      $reset,
    }
  },
  // {
  //   persist: true,
  // }
)

// if (import.meta.hot) {
//   import.meta.hot.accept(acceptHMRUpdate(useSettingsStore, import.meta.hot))
// }