import { createRouter, createWebHistory } from 'vue-router'
import Home from './pages/Home.vue'
import Lab from './pages/Lab.vue'

export const router = createRouter({
// Manages navigation history, allowing for cleaner URLs
    history: createWebHistory(),
    routes: [
        { path: '/', component: Home },
        { path: '/lab', component: Lab }
  ]
})