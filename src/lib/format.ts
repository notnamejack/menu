export function formatPrice(value: number): string {
  const formatted = new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(value);
  return `${formatted.replace(/[\u00A0\u202F]/g, ' ')} ₽`;
}

export function formatPortion(weight: string, price: number): string {
  return `${weight} | ${formatPrice(price)}`;
}
