import "dotenv/config";
import { createServer } from "./server.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";

const app = createServer();

app.listen(config.PORT, () => {
  logger.info(`🛡️ SkillGuard API running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`x402 Network: ${config.X402_NETWORK}`);
});
