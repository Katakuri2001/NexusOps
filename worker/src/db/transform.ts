function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

export function camelCaseKeys<T>(obj: T): T {
  if (Array.isArray(obj)) return obj.map(camelCaseKeys) as T;
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [toCamelCase(k), camelCaseKeys(v)])
    ) as T;
  }
  return obj;
}