<script setup lang="ts">
import { UserX } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'

const store = useLoyaltyStore()
</script>

<template>
  <PageSection
    :title="`${$t('loyalty.blacklist.title')} (${store.blacklist.length})`"
    :description="$t('loyalty.blacklist.description')"
    :divided="false"
  >
    <EmptyState v-if="store.blacklist.length === 0" :title="$t('loyalty.blacklist.empty')">
      <template #icon><UserX class="h-8 w-8" /></template>
    </EmptyState>

    <ul v-else class="divide-y divide-line border-t border-line">
      <li
        v-for="account in store.blacklist"
        :key="account.userLogin"
        class="flex items-center justify-between gap-4 py-2.5 text-sm"
      >
        <span class="text-fg">{{ account.userLogin }}</span>
        <AppButton size="sm" variant="ghost" @click="store.setBlacklisted(account.userLogin, false)">
          {{ $t('loyalty.blacklist.remove') }}
        </AppButton>
      </li>
    </ul>
  </PageSection>
</template>
