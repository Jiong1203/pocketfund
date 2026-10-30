<template>
  <div ref="wrapRef" class="chart-wrap">
    <p v-if="items.length === 0" class="chart-empty">這個基金還沒有交易，記帳後就會在這裡看到每月的儲值與支出。</p>
    <template v-else>
      <div class="legend" aria-hidden="true">
        <span class="legend-item"><i class="swatch income"></i>儲值</span>
        <span class="legend-item"><i class="swatch expense"></i>支出</span>
      </div>
      <div class="scroll">
        <svg
          class="chart"
          :width="chartWidth"
          :height="HEIGHT"
          role="img"
          :aria-label="ariaLabel"
          @mouseleave="activeIndex = null"
        >
          <g v-for="tick in ticks" :key="tick">
            <line class="grid-line" :x1="PAD.left" :x2="chartWidth - PAD.right" :y1="yFor(tick)" :y2="yFor(tick)" />
            <text class="axis-label" :x="PAD.left - 8" :y="yFor(tick)" text-anchor="end" dominant-baseline="middle">
              {{ formatCompact(tick) }}
            </text>
          </g>

          <g v-for="(item, index) in items" :key="item.month">
            <rect
              class="hit-area"
              :class="{ active: activeIndex === index }"
              :x="PAD.left + groupWidth * index"
              :y="PAD.top"
              :width="groupWidth"
              :height="plotHeight"
              @mouseenter="activeIndex = index"
              @click="activeIndex = index"
            />
            <rect
              class="bar income"
              :x="barX(index, 0)"
              :y="yFor(item.topUp)"
              :width="barWidth"
              :height="barHeight(item.topUp)"
              rx="3"
            />
            <rect
              class="bar expense"
              :x="barX(index, 1)"
              :y="yFor(item.expense)"
              :width="barWidth"
              :height="barHeight(item.expense)"
              rx="3"
            />
            <text
              class="axis-label"
              :x="PAD.left + groupWidth * (index + 0.5)"
              :y="HEIGHT - PAD.bottom + 18"
              text-anchor="middle"
            >
              {{ formatMonth(item.month) }}
            </text>
          </g>
        </svg>
      </div>

      <div class="detail" aria-live="polite">
        <template v-if="activeItem">
          <strong>{{ activeItem.month.replace("-", " 年 ") }} 月</strong>
          <span>儲值 <b class="money income">{{ formatMoney(activeItem.topUp) }}</b></span>
          <span>支出 <b class="money expense">{{ formatMoney(activeItem.expense) }}</b></span>
          <span>淨額 <b class="money" :class="net(activeItem) < 0 ? 'expense' : 'income'">{{ formatSignedMoney(net(activeItem)) }}</b></span>
        </template>
        <span v-else class="detail-hint">將滑鼠移到（或點一下）月份上查看明細</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { formatMoney, formatSignedMoney } from "../lib/format";
import type { MonthlyFlowItem } from "../types/api";

const props = defineProps<{
  items: MonthlyFlowItem[];
}>();

const HEIGHT = 280;
const PAD = { top: 16, right: 12, bottom: 32, left: 56 };
const MIN_GROUP_WIDTH = 56; // below this the chart scrolls horizontally instead of squeezing bars
const TICK_COUNT = 4;

const wrapRef = ref<HTMLDivElement | null>(null);
const containerWidth = ref(600);
const activeIndex = ref<number | null>(null);
let resizeObserver: ResizeObserver | undefined;

const chartWidth = computed(() =>
  Math.max(containerWidth.value, PAD.left + PAD.right + props.items.length * MIN_GROUP_WIDTH)
);
const plotWidth = computed(() => chartWidth.value - PAD.left - PAD.right);
const plotHeight = HEIGHT - PAD.top - PAD.bottom;
const groupWidth = computed(() => plotWidth.value / Math.max(props.items.length, 1));
const barWidth = computed(() => Math.min(22, groupWidth.value * 0.3));

// Round the axis maximum up to a "nice" number (1, 2, 2.5, 5 × 10^n).
const axisMax = computed(() => {
  const max = Math.max(0, ...props.items.flatMap((item) => [item.topUp, item.expense]));
  if (max === 0) return TICK_COUNT;
  const raw = max / TICK_COUNT;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= raw) ?? raw;
  return step * TICK_COUNT;
});

const ticks = computed(() => Array.from({ length: TICK_COUNT + 1 }, (_, i) => (axisMax.value / TICK_COUNT) * i));

const activeItem = computed(() => (activeIndex.value === null ? undefined : props.items[activeIndex.value]));

const ariaLabel = computed(
  () =>
    `每月儲值與支出長條圖，共 ${props.items.length} 個月：` +
    props.items.map((item) => `${item.month} 儲值 ${item.topUp} 元、支出 ${item.expense} 元`).join("；")
);

function yFor(value: number): number {
  return PAD.top + plotHeight - (value / axisMax.value) * plotHeight;
}

function barHeight(value: number): number {
  return (value / axisMax.value) * plotHeight;
}

function barX(index: number, slot: 0 | 1): number {
  const center = PAD.left + groupWidth.value * (index + 0.5);
  const gap = 3;
  return slot === 0 ? center - barWidth.value - gap / 2 : center + gap / 2;
}

function net(item: MonthlyFlowItem): number {
  return item.topUp - item.expense;
}

function formatMonth(month: string): string {
  const [year, mm] = month.split("-");
  return mm === "01" || props.items.length <= 1 ? `${year}/${Number(mm)}月` : `${Number(mm)}月`;
}

function formatCompact(value: number): string {
  if (value >= 10000) return `${Number((value / 10000).toFixed(1))}萬`;
  return value.toLocaleString("zh-TW");
}

onMounted(() => {
  resizeObserver = new ResizeObserver(([entry]) => {
    if (entry) containerWidth.value = Math.floor(entry.contentRect.width);
  });
  if (wrapRef.value) resizeObserver.observe(wrapRef.value);
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});
</script>

<style scoped>
.chart-wrap {
  width: 100%;
  min-width: 0;
}

.chart-empty {
  margin: 0;
  padding: 48px 16px;
  text-align: center;
  color: var(--text-muted-color);
}

.legend {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-muted-color);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.swatch.income,
.bar.income {
  background: var(--income-color);
  fill: var(--income-color);
}

.swatch.expense,
.bar.expense {
  background: var(--expense-color);
  fill: var(--expense-color);
}

.scroll {
  overflow-x: auto;
}

.chart {
  display: block;
}

.grid-line {
  stroke: var(--border-color);
  stroke-width: 1;
}

.axis-label {
  fill: var(--text-muted-color);
  font-size: 12px;
}

.bar {
  pointer-events: none;
}

.hit-area {
  fill: transparent;
  cursor: pointer;
}

.hit-area.active {
  fill: var(--surface-muted-color);
}

.detail {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 20px;
  min-height: 48px;
  margin-top: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-md);
  background: var(--surface-muted-color);
  font-size: 14px;
}

.detail-hint {
  color: var(--text-muted-color);
}
</style>
