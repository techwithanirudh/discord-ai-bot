export const safe = (val: any): any => {
  if (val === null || val === undefined) return val;
  if (["string", "number", "boolean"].includes(typeof val)) return val;
  if (typeof val === "bigint") return val.toString();
  if (Array.isArray(val)) return val.map(safe);

  const out: Record<string, any> = {};
  for (const k of [
    "id",
    "name",
    "username",
    "content",
    "topic",
    "size",
    "type",
    "createdTimestamp",
  ]) {
    if (k in val) out[k] = (val as any)[k];
  }
  return out;
};

export const toSnowflake = (id: string | bigint) =>
  typeof id === "bigint" ? id.toString() : id;
