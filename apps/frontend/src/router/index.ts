import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'Explorar locais' },
    },
    {
      path: '/manutencao',
      name: 'manutencao',
      component: () => import('../views/TelaManutencaoView.vue'),
      meta: { title: 'Em breve' },
    },
    {
      path: '/places/new',
      name: 'place-new',
      component: () => import('../views/PlaceFormView.vue'),
      meta: { requiresAuth: true, requiresGuia: true },
    },
    {
      path: '/places/:id',
      name: 'place-details',
      component: () => import('../views/PlaceDetailsView.vue'),
    },
    {
      path: '/places/:id/edit',
      name: 'place-edit',
      component: () => import('../views/PlaceFormView.vue'),
      meta: { requiresAuth: true, requiresGuia: true },
    },
    {
      path: '/roteiros',
      name: 'roteiros',
      component: () => import('../views/RoteirosView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/roteiros/new',
      name: 'roteiros-new',
      component: () => import('../views/RoteiroFormView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/roteiros/:id',
      name: 'roteiro-details',
      component: () => import('../views/RoteiroDetailsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/roteiros-publicos',
      name: 'roteiros-publicos',
      component: () => import('../views/RoteirosPublicosView.vue'),
      meta: { title: 'Roteiros publicados' },
    },
    {
      path: '/roteiros-publicos/:id',
      name: 'roteiro-publico-details',
      component: () => import('../views/RoteiroDetailsView.vue'),
      meta: { title: 'Roteiro publicado' },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersListView.vue'),
      meta: { requiresAuth: true, requiresGuia: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true, title: 'Entrar' },
    },
    {
      // Qualquer rota desconhecida cai na tela de manutenção/em breve
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/TelaManutencaoView.vue'),
      meta: { title: 'Em breve' },
    },
  ],
});

router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    await authStore.refreshSession();
    if (!authStore.isAuthenticated) {
      return { name: 'login', query: { redirect: to.fullPath } };
    }
  }

  if (to.meta.requiresGuia && !authStore.isGuia) {
    return { name: 'home' };
  }

  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    return { name: 'home' };
  }
});

router.afterEach((to) => {
  const title = typeof to.meta.title === 'string' ? to.meta.title : '';
  document.title = title ? `${title} · NortheasTour` : 'NortheasTour - Roteiros';
});

export default router;
