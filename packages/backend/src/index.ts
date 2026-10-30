import { createApp } from "./app";
import { runScheduledTopUpsJob } from "./jobs/scheduled-topups.job";

const app = createApp();

export default {
  fetch: app.fetch,
  async scheduled(controller, env) {
    await runScheduledTopUpsJob(env, new Date(controller.scheduledTime));
  }
} satisfies ExportedHandler<Env>;
