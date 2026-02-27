'use client';

/**
 * Legacy component kept as a no-op to avoid accidental client-side password checks.
 * Access control is now enforced server-side via middleware + auth cookie.
 */
export default function AccessGate() {
  return null;
}
