/**
 * Recursively removes all 'undefined' values from an object.
 * Firestore does not support 'undefined' as a field value.
 * @param obj The object to sanitize
 * @returns A new object with all 'undefined' fields removed
 */
export const sanitizePayload = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }

  const newObj: any = {};
  Object.keys(obj).forEach((key) => {
    const val = obj[key];
    if (val !== undefined) {
      // Don't recurse into Firestore sentinels (FieldValues) or Timestamps
      if (val && typeof val === 'object' && (val.constructor?.name === 'FieldValue' || val._methodName || val.nanoseconds !== undefined)) {
        newObj[key] = val;
      } else {
        newObj[key] = sanitizePayload(val);
      }
    }
  });

  return newObj;
};
