<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { UserX } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'

withDefaults(
  defineProps<{
    divided?: boolean
  }>(),
  { divided: false }
)

const store = useLoyaltyStore()
const manualUserLogin = ref('')

onMounted(() => {
  void Promise.all([store.fetchBlacklist(), store.fetchKnownBots()])
})

async function addManualBlacklist(): Promise<void> {
  const login = manualUserLogin.value.trim().replace(/^@/, '').toLowerCase()
  if (!login) return
  await store.setBlacklisted(login, true)
  manualUserLogin.value = ''
}

async function addKnownBots(): Promise<void> {
  await store.blacklistKnownBots()
}
</script>

<template>
  <PageSection
    :title="`${$t('loyalty.blacklist.title')} (${store.blacklist.length})`"
    :description="$t('loyalty.blacklist.description')"
    :divided="divided"
  >
    <form class="mb-4 flex flex-wrap items-end gap-2" @submit.prevent="addManualBlacklist">
      <div class="min-w-56 flex-1">
        <AppInput
          v-model="manualUserLogin"
          :label="$t('loyalty.blacklist.manualLabel')"
          :placeholder="$t('loyalty.blacklist.manualPlaceholder')"
        />
      </div>
      <AppButton type="submit" variant="primary" :disabled="manualUserLogin.trim().length === 0">
        {{ $t('loyalty.blacklist.addManual') }}
      </AppButton>
      <AppButton type="button" variant="ghost" @click="addKnownBots">
        {{ $t('loyalty.blacklist.addKnownBots') }}
      </AppButton>
    </form>

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
        <AppButton
          size="sm"
          variant="ghost"
          @click="store.setBlacklisted(account.userLogin, false)"
        >
          {{ $t('loyalty.blacklist.remove') }}
        </AppButton>
      </li>
    </ul>
  </PageSection>
</template>
