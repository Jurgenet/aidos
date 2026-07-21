import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/main-layout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/index-page.vue') },
      { path: 'health', name: 'health', component: () => import('@/pages/health-page.vue') },
      { path: 'about', name: 'about', component: () => import('@/pages/about-page.vue') },
      { path: 'user', name: 'user', component: () => import('@/pages/user-page.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('@/pages/error-not-found.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
