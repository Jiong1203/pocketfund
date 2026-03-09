import { createRouter, createWebHistory } from "vue-router";
import DashboardView from "./views/DashboardView.vue";
import LoginView from "./views/LoginView.vue";
import { isAuthenticated } from "./lib/session";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/login", name: "login", component: LoginView, meta: { public: true } },
    { path: "/dashboard", name: "dashboard", component: DashboardView }
  ]
});

router.beforeEach((to) => {
  const authed = isAuthenticated();
  const isPublic = Boolean(to.meta.public);

  if (!isPublic && !authed) {
    return { name: "login" };
  }
  if (isPublic && authed) {
    return { name: "dashboard" };
  }
  return true;
});

export default router;
