import { useCallback, useState } from 'react';

/**
 * Wraps a form submission with the loading/error bookkeeping every auth form
 * repeats: clear the previous error, run the action, surface its message.
 */
export function useAsyncSubmit() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(
    async (action: () => Promise<void>, fallbackMessage: string) => {
      try {
        setLoading(true);
        setError('');
        await action();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : fallbackMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { error, loading, submit };
}
