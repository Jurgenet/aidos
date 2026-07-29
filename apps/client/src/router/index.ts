import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/main-layout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/index/index.vue') },
      { path: 'health', name: 'health', component: () => import('@/pages/health/index.vue') },
      { path: 'about', name: 'about', component: () => import('@/pages/about/index.vue') },
      { path: 'user', name: 'user', component: () => import('@/pages/user/index.vue') },
      { path: 'account', name: 'account', component: () => import('@/pages/account/index.vue') },
      { path: 'note', name: 'note', component: () => import('@/pages/note/index.vue') },
      { path: 'device', name: 'device', component: () => import('@/pages/device/index.vue') },
      { path: 'backup', name: 'backup', component: () => import('@/pages/backup/index.vue') },
      { path: 'log', name: 'log', component: () => import('@/pages/log/index.vue') },
      { path: 'file', name: 'file', component: () => import('@/pages/file/index.vue') },
      { path: 'tag', name: 'tag', component: () => import('@/pages/tag/index.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('@/pages/error-not-found/index.vue'),
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
