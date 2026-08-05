<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { UserX } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import AppInput from '@renderer/components/ui/AppInput.vue'
import EmptyState from '@renderer/components/ui/EmptyState.vue'
import PageSection from '@renderer/components/ui/PageSection.vue'
import Pagination from '@renderer/components/ui/Pagination.vue'
import { useLoyaltyStore } from '@renderer/stores/loyalty.store'
import { useGreetingsStore } from '@renderer/stores/greetings.store'

const props = withDefaults(
  defineProps<{
    divided?: boolean
    /** Welche Blacklist bearbeitet wird -- Loyalty-Punkte oder Begrüßungen (eigenständige Listen). */
    namespace?: 'loyalty' | 'greetings'
  }>(),
  { divided: false, namespace: 'loyalty' }
)

const loyaltyStore = useLoyaltyStore()
const greetingsStore = useGreetingsStore()
const store = computed(() => (props.namespace === 'greetings' ? greetingsStore : loyaltyStore))
const titleKey = computed(() =>
  props.namespace === 'greetings' ? 'greetings.blacklist.title' : 'loyalty.blacklist.title'
)
const descriptionKey = computed(() =>
  props.namespace === 'greetings'
    ? 'greetings.blacklist.description'
    : 'loyalty.blacklist.description'
)
const manualUserLogin = ref('')

const PAGE_SIZE = 10
const page = ref(1)
const pageCount = computed(() => Math.max(1, Math.ceil(store.value.blacklist.length / PAGE_SIZE)))
const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return store.value.blacklist.slice(start, start + PAGE_SIZE)
})

watch(pageCount, (count) => {
  if (page.value > count) page.value = count
})

onMounted(() => {
  void Promise.all([store.value.fetchBlacklist(), store.value.fetchKnownBots()])
})

async function addManualBlacklist(): Promise<void> {
  const login = manualUserLogin.value.trim().replace(/^@/, '').toLowerCase()
  if (!login) return
  await store.value.setBlacklisted(login, true)
  manualUserLogin.value = ''
}

async function addKnownBots(): Promise<void> {
  await store.value.blacklistKnownBots()
}
</script>

<template>
  <PageSection
    :title="`${$t(titleKey)} (${store.blacklist.length})`"
    :description="$t(descriptionKey)"
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
        v-for="account in paginated"
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

    <Pagination v-if="store.blacklist.length > 0" v-model:page="page" :page-count="pageCount" />
  </PageSection>
</template>
