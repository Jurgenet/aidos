import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useExampleStore = defineStore('example', () => {
  const count = ref(0)
  const increment = (): void => {
    count.value += 1
  }
  return { count, increment }
})
