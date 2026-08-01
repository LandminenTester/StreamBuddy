<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, Check } from 'lucide-vue-next'
import AppButton from '@renderer/components/ui/AppButton.vue'
import { useLocaleStore } from '@renderer/stores/locale.store'
import { useSetupStore } from '@renderer/stores/setup.store'
import { SETUP_STEPS, type SetupStep } from './types'
import WelcomeStep from './steps/WelcomeStep.vue'
import AppearanceStep from './steps/AppearanceStep.vue'
import ConnectionStep from './steps/ConnectionStep.vue'
import ModAccountStep from './steps/ModAccountStep.vue'
import ChannelStep from './steps/ChannelStep.vue'
import FeaturesStep from './steps/FeaturesStep.vue'
import SummaryStep from './steps/SummaryStep.vue'

const STEP_COMPONENTS: Record<SetupStep, unknown> = {
  welcome: WelcomeStep,
  appearance: AppearanceStep,
  connection: ConnectionStep,
  mod_account: ModAccountStep,
  channel: ChannelStep,
  features: FeaturesStep,
  summary: SummaryStep
}

const router = useRouter()
const localeStore = useLocaleStore()
const setupStore = useSetupStore()

const stepIndex = ref(0)
const isFinishing = ref(false)

const currentStep = computed(() => SETUP_STEPS[stepIndex.value])
const isLastStep = computed(() => stepIndex.value === SETUP_STEPS.length - 1)

function goBack(): void {
  if (stepIndex.value > 0) stepIndex.value -= 1
}

function goNext(): void {
  if (!isLastStep.value) stepIndex.value += 1
}

async function finish(): Promise<void> {
  isFinishing.value = true
  try {
    await setupStore.complete(localeStore.locale)
    await router.replace('/dashboard')
  } finally {
    isFinishing.value = false
  }
}

/** Ueberspringen fuehrt direkt in die App; die Einrichtung bleibt als offen markiert. */
async function skip(): Promise<void> {
  await router.replace('/dashboard')
}
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-surface text-fg">
    <!-- Fortschrittsleiste: bewusst nur Marker und Typografie, kein Kasten. -->
    <aside class="hidden w-64 shrink-0 flex-col justify-between p-8 lg:flex">
      <div>
        <p class="text-sm font-semibold text-accent">{{ $t('app.name') }}</p>

        <ol class="mt-10 space-y-4">
          <li
            v-for="(step, index) in SETUP_STEPS"
            :key="step"
            class="flex items-center gap-3 text-sm"
          >
            <span
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors"
              :class="
                index < stepIndex
                  ? 'bg-accent text-accent-fg'
                  : index === stepIndex
                    ? 'border border-accent text-accent'
                    : 'border border-line-strong text-fg-subtle'
              "
            >
              <Check v-if="index < stepIndex" class="h-3.5 w-3.5" />
              <template v-else>{{ index + 1 }}</template>
            </span>
            <span :class="index === stepIndex ? 'font-medium text-fg' : 'text-fg-muted'">
              {{ $t(`setup.steps.${step}`) }}
            </span>
          </li>
        </ol>
      </div>

      <button
        type="button"
        class="text-left text-xs text-fg-subtle transition-colors hover:text-fg-muted"
        @click="skip"
      >
        {{ $t('setup.skip') }}
      </button>
    </aside>

    <main class="custom-scrollbar flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div class="mx-auto flex w-full max-w-3xl flex-1 flex-col px-8 py-12">
        <p class="text-xs font-medium uppercase tracking-wide text-fg-subtle lg:hidden">
          {{ $t('setup.progress', { current: stepIndex + 1, total: SETUP_STEPS.length }) }}
        </p>

        <div class="flex-1 py-4">
          <component :is="STEP_COMPONENTS[currentStep]" />
        </div>

        <div class="flex items-center justify-between gap-4 border-t border-line pt-6">
          <AppButton variant="ghost" :disabled="stepIndex === 0" @click="goBack">
            <template #icon><ArrowLeft class="h-4 w-4" /></template>
            {{ $t('common.back') }}
          </AppButton>

          <AppButton v-if="!isLastStep" variant="primary" @click="goNext">
            {{ $t('common.next') }}
            <template #icon><ArrowRight class="h-4 w-4" /></template>
          </AppButton>
          <AppButton v-else variant="primary" :loading="isFinishing" @click="finish">
            {{ isFinishing ? $t('setup.summary.finishing') : $t('setup.summary.finish') }}
          </AppButton>
        </div>
      </div>
    </main>
  </div>
</template>
