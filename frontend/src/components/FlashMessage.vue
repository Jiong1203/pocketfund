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
  color: #027a48;
}

.err {
  color: #b42318;
}

.hint {
  color: #4b5563;
}
</style>
