<script setup lang="ts">
import { BarChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { init, type ECharts, type EChartsCoreOption } from "echarts/core";
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { MonthlyFlowItem } from "../types/api";

use([BarChart, LineChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer]);

const props = defineProps<{
  items: MonthlyFlowItem[];
}>();

const chartRef = ref<HTMLDivElement | null>(null);
let chart: ECharts | null = null;

function renderChart(): void {
  if (!chartRef.value) return;
  if (!chart) {
    chart = init(chartRef.value);
  }

  const labels = props.items.map((item) => item.month);
  const topUpSeries = props.items.map((item) => item.topUp);
  const expenseSeries = props.items.map((item) => item.expense);

  const option: EChartsCoreOption = {
    tooltip: { trigger: "axis" },
    legend: { data: ["儲值", "支出"] },
    xAxis: {
      type: "category",
      data: labels
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "儲值",
        type: "bar",
        data: topUpSeries
      },
      {
        name: "支出",
        type: "line",
        smooth: true,
        data: expenseSeries
      }
    ]
  };

  chart.setOption(option);
}

onMounted(() => {
  renderChart();
  window.addEventListener("resize", renderChart);
});

watch(
  () => props.items,
  () => {
    renderChart();
  },
  { deep: true }
);

onBeforeUnmount(() => {
  window.removeEventListener("resize", renderChart);
  if (chart) {
    chart.dispose();
    chart = null;
  }
});
</script>

<template>
  <div class="chart-wrap">
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<style scoped>
.chart-wrap {
  width: 100%;
  min-height: 280px;
}

.chart {
  width: 100%;
  height: 320px;
}
</style>
