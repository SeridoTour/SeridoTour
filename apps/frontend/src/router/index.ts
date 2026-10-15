import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import HomeView from '../views/HomeView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: () => import ( '../views/TelaManutencaoView.vue') },
    { 
      path: '/places/:id', 
      name: 'place-details', 
      component: () => import('../views/PlaceDetailsView.vue') 
    },
    { 
      path: '/places/new', 
      name: 'place-new', 
      component: () => import('../views/PlaceFormView.vue'),
      meta: { requiresAuth: true, requiresGuia: true }
    },
    {
      path: '/places/:id/edit',
      name: 'place-edit',
      component: () => import('../views/PlaceFormView.vue'),
      meta: { requiresAuth: true, requiresGuia: true }
    },
    { 
      path: '/roteiros', 
      name: 'roteiros', 
      component: () => import('../views/RoteirosView.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/roteiros/new', 
      name: 'roteiros-new', 
      component: () => import('../views/RoteiroFormView.vue'),
      meta: { requiresAuth: true }
    },
    { 
      path: '/roteiros/:id', 
      name: 'roteiro-details', 
      component: () => import('../views/RoteiroDetailsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersListView.vue'),
      meta: { requiresAuth: true, requiresGuia: true }
    },
        { 
      path: '/login', 
      name: 'login', 
      component: () => import('../views/LoginView.vue'),
      meta: { requiresAuth: false }
    }
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    await authStore.refreshSession();
    if (!authStore.isAuthenticated) return { name: 'login' };
  }

  if (to.meta.requiresGuia && !authStore.isGuia) return { name: 'home' };
});

export default router;
