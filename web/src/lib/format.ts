export function pluralize(
  count: number,
  singular: string,
  plural = `${singular}s`,
) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function joinList(items: string[], conjunction = "and") {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  const last = items[items.length - 1];
  return `${items.slice(0, -1).join(", ")}, ${conjunction} ${last}`;
}