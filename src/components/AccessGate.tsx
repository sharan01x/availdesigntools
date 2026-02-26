'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

interface AccessGateProps {
  password: string;
}

const SESSION_KEY = 'avail_access_granted';

export default function AccessGate({ password }: AccessGateProps) {
  const expectedPassword = useMemo(() => password.trim(), [password]);
  const [isOpen, setIsOpen] = useState(true);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!expectedPassword) {
      setIsOpen(false);
      return;
    }

    const hasAccess = window.sessionStorage.getItem(SESSION_KEY) === 'true';
    setIsOpen(!hasAccess);
  }, [expectedPassword]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (enteredPassword === expectedPassword) {
      window.sessionStorage.setItem(SESSION_KEY, 'true');
      setErrorMessage('');
      setEnteredPassword('');
      setIsOpen(false);
      return;
    }

    setErrorMessage('Incorrect password. Please try again.');
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/65 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Restricted Access</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Enter the access password to continue.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="password"
            value={enteredPassword}
            onChange={(event) => {
              setEnteredPassword(event.target.value);
              if (errorMessage) {
                setErrorMessage('');
              }
            }}
            className="brand-focus w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
            placeholder="Password"
            autoComplete="current-password"
            required
            autoFocus
          />

          {errorMessage ? <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p> : null}

          <button type="submit" className="brand-button w-full rounded-lg px-4 py-2 font-medium">
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
