const pad = (n: number): string => String(n).padStart(2, "0");

const moneyFormatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

// `<input type="date">` value (YYYY-MM-DD) for a Date in the browser's local time zone.
export function toLocalDateInput(value: string | Date): string {
  const date = new Date(value);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayLocalDate(): string {
  return toLocalDateInput(new Date());
}
