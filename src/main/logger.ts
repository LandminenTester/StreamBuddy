/* eslint-disable no-console */

/** Zentrales, minimales Logging für den Main-Prozess. */
export const logger = {
  info: (message: string, ...meta: unknown[]): void => console.log(`[info] ${message}`, ...meta),
  warn: (message: string, ...meta: unknown[]): void => console.warn(`[warn] ${message}`, ...meta),
  error: (message: string, ...meta: unknown[]): void => console.error(`[error] ${message}`, ...meta)
}
