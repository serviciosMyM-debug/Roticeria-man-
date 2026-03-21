import clsx from 'clsx';

export function cn(...inputs: Array<string | false | null | undefined>) {
  return clsx(inputs);
}

export function formatCurrency(value: number | string) {
  const num = Number(value);
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(num);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
