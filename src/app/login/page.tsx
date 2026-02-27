'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const nextPath = searchParams.get('next');
  const redirectPath = nextPath && nextPath.startsWith('/') ? nextPath : '/';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setErrorMessage(payload.error ?? 'Unable to sign in.');
        setIsLoading(false);
        return;
      }

      setPassword('');
      router.replace(redirectPath);
      router.refresh();
    } catch {
      setErrorMessage('Unable to sign in. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-zinc-50 to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-900 px-4">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center">
        <div className="w-full rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Restricted Access</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Enter the access password to continue.
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errorMessage) {
                  setErrorMessage('');
                }
              }}
              className="brand-focus w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              placeholder="Password"
              autoComplete="current-password"
              required
              autoFocus
              disabled={isLoading}
            />

            {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}

            <button
              type="submit"
              className="brand-button w-full rounded-lg px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading}
            >
              {isLoading ? 'Checking…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
