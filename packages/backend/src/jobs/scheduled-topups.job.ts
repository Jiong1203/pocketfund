import { openServiceScope } from "../container";

// Cron entry point: no business rules here, it only opens a service scope and delegates.
export async function runScheduledTopUpsJob(env: Env, scheduledTime: Date): Promise<void> {
  const startedAt = Date.now();
  const scope = openServiceScope(env);
  try {
    const summary = await scope.services.schedules.executeScheduledTopUps(scheduledTime);
    console.log(
      JSON.stringify({
        level: summary.failed > 0 ? "warn" : "info",
        event: "job_run",
        job: "scheduled_topups",
        status: summary.failed > 0 ? "partial_failure" : "success",
        ...summary,
        duration_ms: Date.now() - startedAt
      })
    );
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "job_run",
        job: "scheduled_topups",
        status: "failure",
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startedAt
      })
    );
    throw error;
  } finally {
    await scope.close();
  }
}
