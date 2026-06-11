<template>
  <v-row>
    <v-col cols="12" md="6">
      <v-card elevation="1" rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-medium">按类型统计行数</v-card-title>
        <v-card-text>
          <div class="chart-wrapper">
            <canvas ref="barCanvas"></canvas>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
    <v-col cols="12" md="6">
      <v-card elevation="1" rounded="lg">
        <v-card-title class="text-subtitle-1 font-weight-medium">文件数量分布</v-card-title>
        <v-card-text>
          <div class="chart-wrapper">
            <canvas ref="doughnutCanvas"></canvas>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  byExt: { type: Object, default: () => ({}) },
  totalLines: { type: Number, default: 0 },
  isDark: { type: Boolean, default: false },
})

const barCanvas = ref(null)
const doughnutCanvas = ref(null)
let barChart = null
let doughnutChart = null

const COLORS = [
    '#009688', '#00897B', '#00796B', '#00695C', '#004D40',
    '#26A69A', '#4DB6AC', '#80CBC4', '#B2DFDB',
    '#00ACC1', '#0097A7', '#00838F', '#006064',
]

function getData() {
    const entries = Object.entries(props.byExt).sort((a, b) => b[1].lines - a[1].lines)
    const top = entries.slice(0, 12)
    const otherLines = entries.slice(12).reduce((s, [, v]) => s + v.lines, 0)
    const otherCount = entries.slice(12).reduce((s, [, v]) => s + v.count, 0)

    const labels = top.map(([k]) => k)
    const linesData = top.map(([, v]) => v.lines)
    const countsData = top.map(([, v]) => v.count)

    if (otherLines > 0) {
        labels.push('其他')
        linesData.push(otherLines)
        countsData.push(otherCount)
    }
    return { labels, linesData, countsData }
}

function renderCharts() {
    if (!barCanvas.value || !doughnutCanvas.value) return
    if (Object.keys(props.byExt).length === 0) return

    const { labels, linesData, countsData } = getData()
    const textColor = props.isDark ? '#ccc' : '#666'
    const gridColor = props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
    const borderColor = props.isDark ? '#1e1e1e' : '#fff'

    if (barChart) barChart.destroy()
    if (doughnutChart) doughnutChart.destroy()

    barChart = new Chart(barCanvas.value, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: '行数',
                data: linesData,
                backgroundColor: COLORS.slice(0, labels.length),
                borderRadius: 6,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => {
                            const pct = props.totalLines > 0 ? (ctx.raw / props.totalLines * 100).toFixed(1) : 0
                            return `${ctx.raw.toLocaleString('zh-CN')} 行 (${pct}%)`
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: textColor, font: { size: 12 } }, grid: { display: false } },
                y: {
                    ticks: {
                        color: textColor,
                        font: { size: 11 },
                        callback: (v) => v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v
                    },
                    grid: { color: gridColor }
                }
            }
        }
    })

    doughnutChart = new Chart(doughnutCanvas.value, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data: countsData,
                backgroundColor: COLORS.slice(0, labels.length),
                borderWidth: 2,
                borderColor,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: textColor, font: { size: 12 }, padding: 8, usePointStyle: true, pointStyleWidth: 10 }
                },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.label}: ${ctx.raw} 个文件`
                    }
                }
            }
        }
    })
}

watch(() => [props.byExt, props.isDark], () => {
    nextTick(renderCharts)
}, { deep: true })

onMounted(() => {
    nextTick(renderCharts)
})

onBeforeUnmount(() => {
    if (barChart) barChart.destroy()
    if (doughnutChart) doughnutChart.destroy()
})
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 300px;
}
</style>
