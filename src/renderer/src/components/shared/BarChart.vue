<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import { useChartTheme } from './useChartTheme'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  labels: string[]
  values: number[]
  label: string
}>()

const chartTheme = useChartTheme()

const chartData = computed<ChartData<'bar'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.values,
      backgroundColor: chartTheme.value.accent,
      borderRadius: 4
    }
  ]
}))

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: chartTheme.value.tick },
      grid: { color: chartTheme.value.grid }
    },
    y: {
      beginAtZero: true,
      ticks: { color: chartTheme.value.tick },
      grid: { color: chartTheme.value.grid }
    }
  }
}))
</script>

<template>
  <div class="h-64">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
