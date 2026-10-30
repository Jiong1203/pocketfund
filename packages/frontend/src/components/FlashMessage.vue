<template>
  <p :class="['msg', type]" :role="type === 'err' ? 'alert' : 'status'">{{ text }}</p>
</template>

<script setup lang="ts">
defineProps<{
  type: "ok" | "err" | "hint";
  text: string;
}>();
</script>

<style scoped>
.msg {
  margin: 0 0 16px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-size: 14px;
}

.ok {
  color: var(--success-color);
  background: color-mix(in srgb, var(--success-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--success-color) 25%, transparent);
}

.err {
  color: var(--error-color);
  background: color-mix(in srgb, var(--error-color) 10%, transparent);
  border-color: color-mix(in srgb, var(--error-color) 25%, transparent);
}

.hint {
  color: var(--text-muted-color);
  background: var(--surface-muted-color);
}
</style>
