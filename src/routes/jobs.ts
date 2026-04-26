import express, { Router } from "express";
import { JobQueue } from "../queue/job-queue";
import { createSchedule, listSchedules, resetSchedules, startCronScheduler, updateSchedule, validateCronExpression, schedules } from "../scheduler/cron-scheduler";
import { JobsRepo } from "../repos/jobsRepo";

// Do not initialize DB during import. Provide lazy access to JobsRepo so tests
// and setup code can initialize DB first.
let jobsRepo: JobsRepo | null = null;
export function getJobsRepo(db?: any) {
  if (jobsRepo) return jobsRepo;
  jobsRepo = new JobsRepo(db);
  return jobsRepo;
}

export type QueueLike = Pick<JobQueue, "enqueuePostJob">;

export function createJobsRouter(queue: QueueLike) {
  const router = Router();

  router.post("/schedule", (req, res) => {
    const { cron, template_id, account_id, platform } = req.body || {};
    if (!cron || !template_id || !account_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!validateCronExpression(cron)) {
      return res.status(400).json({ error: "Invalid cron expression" });
    }
    const schedule = createSchedule({ cron, template_id, account_id, platform });
    res.status(201).json(schedule);
  });

  router.post("/trigger", async (req, res) => {
    const { template_id, account_id, platform, message } = req.body || {};
    if (!template_id || !account_id) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const repo = getJobsRepo();
    const job = repo.create({ account_id, platform: platform || "default", type: 'post', payload: { template_id, message } });
    const jobId = await queue.enqueuePostJob({
      platform: platform || "default",
      to: account_id,
      message: message || `Trigger template ${template_id}`,
    } as any);
    res.status(202).json({ job_id: jobId });
  });

  return router;
}

export function createSchedulesRouter() {
  const router = Router();
  router.get("/", (_req, res) => {
    res.json(listSchedules());
  });
  router.put("/:id", (req, res) => {
    const updated = updateSchedule(req.params.id, req.body || {});
    if (!updated) {
      return res.status(404).json({ error: "Schedule not found" });
    }
    res.json(updated);
  });
  return router;
}

export const defaultJobQueue = new JobQueue();
export const jobsRouter = createJobsRouter(defaultJobQueue);
export const schedulesRouter = createSchedulesRouter();
export { resetSchedules, startCronScheduler, schedules } from "../scheduler/cron-scheduler";
export default jobsRouter;
