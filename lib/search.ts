export function searchTerm(value: string) {
  return value
    .slice(0, 100)
    .replace(/[,%()_*\\"]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
