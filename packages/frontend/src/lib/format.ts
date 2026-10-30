const pad = (n: number): string => String(n).padStart(2, "0");

const moneyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

const dateFormatter = new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "2-digit", day: "2-digit" });

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

// Explicit "+" for income so the sign is readable without relying on color alone.
export function formatSignedMoney(value: number): string {
  return value > 0 ? `+${moneyFormatter.format(value)}` : moneyFormatter.format(value);
}

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

// `<input type="date">` value (YYYY-MM-DD) for a Date in the browser's local time zone.
export function toLocalDateInput(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayLocalDate(): string {
  return toLocalDateInput(new Date());
}
