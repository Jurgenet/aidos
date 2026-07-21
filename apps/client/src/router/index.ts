import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/IndexPage.vue') },
      { path: 'health', name: 'health', component: () => import('@/pages/HealthPage.vue') },
      { path: 'about', name: 'about', component: () => import('@/pages/AboutPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'not-found',
    component: () => import('@/pages/ErrorNotFound.vue'),
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
