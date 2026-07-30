import { createRouter, createWebHashHistory } from 'vue-router'

/**
 * Zentrale Routen-Definition. Bei jeder neuen View wird diese Datei erweitert.
 * createWebHashHistory wird genutzt, da die Renderer-Seite in Produktion via
 * loadFile() als lokale Datei geladen wird (kein Server, kein History-API-Fallback nötig).
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@renderer/views/dashboard/DashboardView.vue')
    },
    {
      path: '/commands',
      name: 'commands',
      component: () => import('@renderer/views/commands/CommandsView.vue')
    },
    {
      path: '/automessages',
      name: 'automessages',
      component: () => import('@renderer/views/automessages/AutomessagesView.vue')
    },
    {
      path: '/polls',
      name: 'polls',
      component: () => import('@renderer/views/polls/PollsView.vue')
    },
    {
      path: '/channel-points',
      name: 'channel-points',
      component: () => import('@renderer/views/channelPoints/ChannelPointsView.vue')
    },
    {
      path: '/loyalty',
      name: 'loyalty',
      component: () => import('@renderer/views/loyalty/LoyaltyView.vue')
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@renderer/views/settings/SettingsView.vue')
    }
  ]
})
