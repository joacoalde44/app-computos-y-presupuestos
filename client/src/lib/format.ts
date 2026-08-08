export function formatARS(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "$ 0";
  return `$ ${Math.round(value).toLocaleString("es-AR")}`;
}

export function formatDateAR(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatPct(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}
