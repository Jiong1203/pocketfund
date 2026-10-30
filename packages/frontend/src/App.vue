<template>
  <AppHeader v-if="!route.meta.public" />
  <main>
    <router-view />
  </main>
</template>

<script setup lang="ts">
import { useRoute } from "vue-router";
import AppHeader from "./components/AppHeader.vue";

const route = useRoute();
</script>
