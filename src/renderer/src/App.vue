<script setup lang="ts">
import { useRoute } from 'vue-router'
import AppShell from '@renderer/components/shared/AppShell.vue'

const route = useRoute()
</script>

<template>
  <!-- Der Setup-Wizard laeuft vollflaechig ohne Sidebar. -->
  <RouterView v-if="route.meta.standalone" />
  <AppShell v-else>
    <RouterView />
  </AppShell>
</template>
