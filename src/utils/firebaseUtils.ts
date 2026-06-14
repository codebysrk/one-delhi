export const sanitizePayload = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload);
  }
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    const val = obj[key];
    if (val !== undefined) {
      if (val && typeof val === 'object' && (val.constructor?.name === 'FieldValue' || val._methodName || val.nanoseconds !== undefined)) {
        newObj[key] = val;
      } else {
        newObj[key] = sanitizePayload(val);
      }
    }
  });
  return newObj;
};