import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior: () => ({ top: 0 }),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'Explorar destinos', section: 'places' },
    },
    {
      path: '/mapa',
      name: 'map',
      component: () => import('../views/HomeView.vue'),
      meta: { title: 'Mapa do Seridó', section: 'map' },
    },
    {
      path: '/favoritos',
      name: 'favorites',
      component: () => import('../views/FavoritesView.vue'),
      meta: { title: 'Favoritos', section: 'favorites' },
    },
    {
      path: '/places/new',
      name: 'place-new',
      component: () => import('../views/PlaceFormView.vue'),
      meta: { title: 'Cadastrar local', requiresAuth: true, requiresGuia: true, section: 'places' },
    },
    {
      path: '/places/:id',
      name: 'place-details',
      component: () => import('../views/PlaceDetailsView.vue'),
      meta: { title: 'Detalhes do destino', section: 'places' },
    },
    {
      path: '/places/:id/edit',
      name: 'place-edit',
      component: () => import('../views/PlaceFormView.vue'),
      meta: { title: 'Editar local', requiresAuth: true, requiresGuia: true, section: 'places' },
    },
    {
      path: '/roteiros',
      name: 'itineraries',
      component: () => import('../views/ItinerariesView.vue'),
      meta: { title: 'Meus roteiros', requiresAuth: true, section: 'itineraries' },
    },
    {
      path: '/roteiros/new',
      name: 'itinerary-new',
      component: () => import('../views/ItineraryFormView.vue'),
      meta: { title: 'Criar roteiro', requiresAuth: true, section: 'itineraries' },
    },
    {
      path: '/roteiros/:id',
      name: 'itinerary-details',
      component: () => import('../views/ItineraryDetailsView.vue'),
      meta: { title: 'Detalhes do roteiro', requiresAuth: true, section: 'itineraries' },
    },
    {
      path: '/roteiros/:id/edit',
      name: 'itinerary-edit',
      component: () => import('../views/ItineraryFormView.vue'),
      meta: { title: 'Editar roteiro', requiresAuth: true, section: 'itineraries' },
    },
    {
      path: '/roteiros-publicos',
      name: 'public-itineraries',
      component: () => import('../views/ItinerariesView.vue'),
      meta: { title: 'Roteiros publicados', section: 'public-itineraries' },
    },
    {
      path: '/roteiros-publicos/:id',
      name: 'public-itinerary-details',
      component: () => import('../views/ItineraryDetailsView.vue'),
      meta: { title: 'Roteiro publicado', section: 'public-itineraries' },
    },
    {
      path: '/moderacao',
      name: 'moderation',
      component: () => import('../views/ModerationView.vue'),
      meta: {
        title: 'Moderação de roteiros',
        requiresAuth: true,
        requiresGuia: true,
        section: 'moderation',
      },
    },
    {
      path: '/users',
      name: 'users',
      component: () => import('../views/UsersListView.vue'),
      meta: { title: 'Usuários', requiresAuth: true, requiresGuia: true, section: 'users' },
    },
    {
      path: '/perfil',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { title: 'Meu perfil', requiresAuth: true, section: 'profile' },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { title: 'Entrar', requiresGuest: true, standalone: true },
    },
    {
      path: '/manutencao',
      name: 'maintenance',
      component: () => import('../views/MaintenanceView.vue'),
      meta: { title: 'Em breve', standalone: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/MaintenanceView.vue'),
      meta: { title: 'Página indisponível', standalone: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    await auth.refreshSession()
    if (!auth.isAuthenticated) return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.requiresGuia && !auth.isGuia) return { name: 'home' }
  if (to.meta.requiresGuest && auth.isAuthenticated) return { name: 'home' }
})

router.afterEach((to) => {
  document.title = `${typeof to.meta.title === 'string' ? to.meta.title : 'Roteiros do Seridó'} · SeridóTour`
})

export default router
