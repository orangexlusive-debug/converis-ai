/** Dedupe uploads by stable file identity so users can attach in multiple batches safely. */
export function mergeUniqueFiles(existing: File[], added: File[]): File[] {
  const key = (f: File) => `${f.name}::${f.size}::${f.lastModified}`;
  const keys = new Set(existing.map(key));
  const out = [...existing];
  for (const f of added) {
    const k = key(f);
    if (keys.has(k)) continue;
    keys.add(k);
    out.push(f);
  }
  return out;
}
