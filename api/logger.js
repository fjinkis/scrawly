const winston = require("winston");

const ONE_MB = 1000000;
const MAX_NUM_FILES = 50;
const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: "./logs/debug.log",
      maxsize: ONE_MB,
      maxFiles: MAX_NUM_FILES,
    }),
  ],
});
logger.add(new winston.transports.Console());

module.exports = { logger };
