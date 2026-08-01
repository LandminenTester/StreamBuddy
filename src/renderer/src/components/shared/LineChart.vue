<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type ChartData,
  type ChartOptions
} from 'chart.js'
import { useChartTheme } from './useChartTheme'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

const props = defineProps<{
  labels: string[]
  values: number[]
  label: string
}>()

const chartTheme = useChartTheme()

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.labels,
  datasets: [
    {
      label: props.label,
      data: props.values,
      borderColor: chartTheme.value.accent,
      backgroundColor: chartTheme.value.accentFill,
      tension: 0.3,
      fill: true,
      pointRadius: 0
    }
  ]
}))

const chartOptions = computed<ChartOptions<'line'>>(() => ({
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
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>
