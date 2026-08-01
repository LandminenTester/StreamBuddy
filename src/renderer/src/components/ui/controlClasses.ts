/**
 * Gemeinsame Basisklassen aller Eingabefelder, damit Input, Textarea und Select
 * garantiert identisch aussehen.
 */
export const CONTROL_BASE =
  'w-full rounded-md border bg-surface px-3 py-2 text-sm text-fg transition-colors placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50'

export function controlClasses(hasError?: boolean): string {
  return `${CONTROL_BASE} ${hasError ? 'border-danger' : 'border-line-strong focus:border-accent'}`
}
