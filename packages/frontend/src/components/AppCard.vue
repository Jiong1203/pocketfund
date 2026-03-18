<template>
  <section class="card">
    <header v-if="title" class="head">
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
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md, 12px);
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

h2 {
  margin: 0;
  font-size: 18px;
}
</style>
