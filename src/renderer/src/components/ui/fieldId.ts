let counter = 0

/**
 * Erzeugt eine stabile, eindeutige ID fuer die <label for>/<input id>-Verknuepfung,
 * damit Formularfelder ohne manuell vergebene IDs auskommen.
 * @param prefix Praefix zur besseren Lesbarkeit im DOM
 */
export function useFieldId(prefix = 'field'): string {
  counter += 1
  return `${prefix}-${counter}`
}
