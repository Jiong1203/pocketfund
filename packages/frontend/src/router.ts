import { createRouter, createWebHistory } from "vue-router";
import { isAuthenticated } from "./lib/session";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    {
      path: "/login",
      name: "login",
      component: () => import("./views/LoginView.vue"),
      meta: { public: true }
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("./views/DashboardView.vue")
    },
    // Page paths must not overlap the API prefixes routed to the Worker (see API_PATHS in cloudflare.config.ts).
    {
      path: "/auto-topups",
      name: "schedules",
      component: () => import("./views/SchedulesView.vue")
    },
    {
      path: "/charts",
      name: "charts",
      component: () => import("./views/FundChartView.vue")
    }
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
