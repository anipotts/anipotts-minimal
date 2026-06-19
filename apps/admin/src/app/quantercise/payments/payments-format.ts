const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 0,
});

export function fmtCents(cents: number): string {
  return usdFormatter.format(cents / 100);
}

export function fmtDollars(amount: number): string {
  return usdFormatter.format(amount);
}
