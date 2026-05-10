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
      newObj[key] = sanitizePayload(val);
    }
  });

  return newObj;
};
