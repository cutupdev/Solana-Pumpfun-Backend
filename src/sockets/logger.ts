import winston from "winston";
const { createLogger, format, transports } = winston;
const { combine, printf } = format;

const LOG_LEVEL = "info";

const logFormat = printf(({ level, message, timestamp }) => {
  return `[${level}][${timestamp}][API] ${message}`;
});

export const logger = createLogger({
  level: LOG_LEVEL,
  format: combine(
    format.prettyPrint(),
    format.splat(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [new transports.Console({})],
});

export function showErrorLogOnly() {
  logger.level = "error";
}