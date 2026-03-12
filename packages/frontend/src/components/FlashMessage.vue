<script setup lang="ts">
defineProps<{
  type: "ok" | "err" | "hint";
  text: string;
}>();
</script>

<template>
  <p :class="['msg', type]">{{ text }}</p>
</template>

<style scoped>
.msg {
  margin: 8px 0;
}

.ok {
  color: var(--success-color);
}

.err {
  color: var(--error-color);
}

.hint {
  color: var(--text-muted-color);
}
</style>
