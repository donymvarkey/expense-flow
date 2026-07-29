export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string' &&
    (error as { message: string }).message
  ) {
    return (error as { message: string }).message;
  }
  return fallback;
}

export function logError(context: string, error: unknown): void {
  console.error(`[${context}]`, error);
}

// Attach to promises that are intentionally not awaited so a rejection is
// logged instead of surfacing as an unhandled rejection.
export function logRejection(context: string): (error: unknown) => void {
  return (error: unknown) => logError(context, error);
}
