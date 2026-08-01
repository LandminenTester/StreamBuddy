import { createRouter, createWebHashHistory } from 'vue-router'
import { useSetupStore } from '@renderer/stores/setup.store'

/**
 * Zentrale Routen-Definition. Bei jeder neuen View wird diese Datei erweitert.
 * createWebHashHistory wird genutzt, da die Renderer-Seite in Produktion via
 * loadFile() als lokale Datei geladen wird (kein Server, kein History-API-Fallback nötig).
 *
 * meta.standalone markiert Routen, die ohne die AppShell (Sidebar) gerendert werden.
 */
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/setup',
      name: 'setup',
      meta: { standalone: true },
      component: () => import('@renderer/views/setup/SetupView.vue')
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
      component: () => import('@renderer/views/automessages/AutomessagesView.vue'),
      children: [
        { path: '', redirect: { name: 'automessages-messages' } },
        {
          path: 'messages',
          name: 'automessages-messages',
          component: () => import('@renderer/views/automessages/messages/MessagesView.vue')
        },
        {
          path: 'ad-message',
          name: 'automessages-ad-message',
          component: () => import('@renderer/views/automessages/adMessage/AdMessageView.vue')
        }
      ]
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
      component: () => import('@renderer/views/loyalty/LoyaltyView.vue'),
      children: [
        { path: '', redirect: { name: 'loyalty-leaderboard' } },
        {
          path: 'leaderboard',
          name: 'loyalty-leaderboard',
          component: () => import('@renderer/views/loyalty/leaderboard/LeaderboardView.vue')
        },
        {
          path: 'blacklist',
          name: 'loyalty-blacklist',
          component: () => import('@renderer/views/loyalty/blacklist/BlacklistView.vue')
        },
        {
          path: 'earn-rules',
          name: 'loyalty-earn-rules',
          component: () => import('@renderer/views/loyalty/earnRules/EarnRulesView.vue')
        },
        {
          path: 'offline-messages',
          name: 'loyalty-offline-messages',
          component: () =>
            import('@renderer/views/loyalty/offlineMessages/OfflineMessagesView.vue')
        }
      ]
    },
    {
      path: '/games',
      name: 'games',
      component: () => import('@renderer/views/games/GamesView.vue')
    },
    {
      path: '/games/:gameId',
      name: 'game-detail',
      component: () => import('@renderer/views/games/GameDetailView.vue')
    },
    {
      path: '/audience',
      component: () => import('@renderer/views/audience/AudienceView.vue'),
      children: [
        { path: '', redirect: { name: 'audience-followers' } },
        {
          path: 'followers',
          name: 'audience-followers',
          component: () => import('@renderer/views/audience/followers/FollowersView.vue')
        },
        {
          path: 'archive',
          name: 'audience-archive',
          component: () => import('@renderer/views/audience/archive/ArchiveView.vue')
        }
      ]
    },
    {
      path: '/settings',
      component: () => import('@renderer/views/settings/SettingsView.vue'),
      children: [
        { path: '', redirect: { name: 'settings-general' } },
        {
          path: 'general',
          name: 'settings-general',
          component: () => import('@renderer/views/settings/general/GeneralSettingsView.vue')
        },
        {
          path: 'connection',
          name: 'settings-connection',
          component: () => import('@renderer/views/settings/connection/ConnectionSettingsView.vue')
        },
        {
          path: 'features',
          name: 'settings-features',
          component: () => import('@renderer/views/settings/features/FeaturesSettingsView.vue')
        }
      ]
    }
  ]
})

/**
 * Solange die Einrichtung nicht abgeschlossen ist, landet der erste Aufruf im
 * Wizard. Wer dort auf "Später einrichten" klickt, navigiert bewusst weiter --
 * deshalb greift die Umleitung nur beim allerersten Routing-Vorgang.
 */
let setupRedirectChecked = false

router.beforeEach(async (to) => {
  if (setupRedirectChecked || to.name === 'setup') return true
  setupRedirectChecked = true

  const setupStore = useSetupStore()
  const state = await setupStore.fetchState()
  return state.completed ? true : { name: 'setup' }
})
