import express from "express";
import pinoHttp from "pino-http";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import healthRouter from "./routes/health.js";
import pricingRouter from "./routes/pricing.js";
import auditRouter from "./routes/audit.js";

export function createServer() {
  const app = express();
  
  // Middleware
  app.use(express.json({ limit: "2mb" }));
  app.use(pinoHttp({ logger }));
  
  // CORS
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Payment-Signature, Payment-Required");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Routes (free)
  app.use(healthRouter);
  app.use(pricingRouter);
  
  // Routes (paid - x402)
  app.use(auditRouter);
  
  // Error handler
  app.use(errorHandler);
  
  return app;
}
