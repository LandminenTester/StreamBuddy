<script setup lang="ts">
const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/commands', label: 'Commands' },
  { to: '/automessages', label: 'Automessages' },
  { to: '/polls', label: 'Umfragen' },
  { to: '/channel-points', label: 'Kanalpunkte' },
  { to: '/loyalty', label: 'Loyalty' },
  { to: '/settings', label: 'Einstellungen' }
]
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden">
    <aside class="flex w-56 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
      <div class="px-4 py-5 text-lg font-semibold text-twitch-purple">Streaming Bot</div>
      <nav class="flex flex-col gap-1 px-2">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          active-class="bg-twitch-purple/10 text-twitch-purple dark:bg-twitch-purple/20"
        >
          {{ item.label }}
        </RouterLink>
      </nav>
    </aside>
    <main class="flex-1 overflow-y-auto p-6">
      <slot />
    </main>
  </div>
</template>
