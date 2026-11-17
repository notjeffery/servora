export type Rel<T> = T | T[] | null;

// PostgREST returns one-to-one embeds as an object or a one-item array
export function one<T>(value: Rel<T> | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}