export const logInfo = (message: string, meta?: unknown) => {
  // eslint-disable-next-line no-console
  console.log(`[notification] ${message}`, meta ?? '')
}

export const logError = (message: string, error?: unknown) => {
  // eslint-disable-next-line no-console
  console.error(`[notification] ${message}`, error ?? '')
}
