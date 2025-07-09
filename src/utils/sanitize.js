
export function sanitizeValue(v) {
  return (v === undefined || v === null || v === '' || v === 'undefined')
    ? ''
    : v;
}

/**
 * Remove keys whose value is empty-ish so they never get written to Firebase
 * or localStorage as the string "undefined".
 */
export function stripUndefined(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj)
          .filter(([, v]) => v !== undefined
                         && v !== null
                         && v !== ''
                         && v !== 'undefined')
  );
}
