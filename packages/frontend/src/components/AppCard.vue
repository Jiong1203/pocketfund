<template>
  <section class="card">
    <header v-if="title || $slots.actions" class="head">
      <h2>{{ title }}</h2>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>();
</script>

<style scoped>
.card {
  min-width: 0;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

h2 {
  margin: 0;
  font-size: 17px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .card {
    padding: 16px;
  }
}
</style>
