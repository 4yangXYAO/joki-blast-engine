import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createLogger, transports, format } from "winston";
import { loadConfig, getConfig } from "../config/secrets";
import { initDatabase, runMigrations } from "../db/sqlite";
import { accountsRouter } from "../routes/accounts";
import { templatesRouter } from "../routes/templates";
import { postsRouter } from "../routes/posts";
import { jobsRouter, schedulesRouter, defaultJobQueue, startCronScheduler } from "../routes/jobs";
import { adaptersRouter } from "../routes/adapters";
import { webhooksRouter } from "../routes/webhooks";
import { settingsRouter } from "../routes/settings";
import { createCampaignsRouter } from "../routes/campaigns";
import { trackRouter } from "../routes/track";
import initializeJobWorker from "../workers/job-worker";
import type { Request, Response, NextFunction } from "express";

const logger = createLogger({
  level: (process.env.LOG_LEVEL ?? "info") as string,
  format: format.json(),
  transports: [new transports.Console({ format: format.simple() })],
});

export function createServer() {
  const app = express();
  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.originalUrl} - ${req.ip}`);
    next();
  });
  app.get("/v1/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });
  return app;
}

export function startServer() {
  loadConfig();
  const cfg = getConfig();
  // Initialize DB and run migrations
  const dbPath = cfg.DATABASE_PATH || "data/app.db";
  initDatabase(dbPath);
  runMigrations("./migrations");
  const port = Number(cfg.API_PORT) || 3000;
  const app = createServer();
  app.use("/v1/accounts", accountsRouter);
  app.use("/v1/templates", templatesRouter);
  app.use("/v1/posts", postsRouter);
  app.use("/v1/jobs", jobsRouter);
  app.use("/v1/schedules", schedulesRouter);
  app.use("/v1/adapters", adaptersRouter);
  app.use("/v1/webhooks", webhooksRouter);
  app.use("/v1/settings", settingsRouter);
  app.use("/v1/campaigns", createCampaignsRouter(defaultJobQueue));
  app.use("/v1/track", trackRouter);
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err?.message ?? "Unhandled error");
    res.status(500).json({ error: err?.message ?? "Internal Server Error" });
  });
  const cronHandle = startCronScheduler(defaultJobQueue);
  // Initialize worker to process queued jobs
  void initializeJobWorker(defaultJobQueue).catch((err) => {
    logger.error("Job worker failed to initialize:", err);
  });
  const server = app.listen(port, () => {
    logger.info(`API server listening on port ${port}`);
  });
  server.once("close", () => {
    if (cronHandle) {
      clearInterval(cronHandle);
    }
  });
  return server;
}
