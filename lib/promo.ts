export function toPromoTime(value?: string | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? null : time;
}

export function getPromoState(product: {
  isPromo?: boolean | null;
  promoPrice?: number | string | null;
  promoStartsAt?: string | Date | null;
  promoEndsAt?: string | Date | null;
}) {
  if (!product.isPromo || product.promoPrice == null) {
    return {
      state: "none" as const,
      active: false,
      scheduled: false,
      ended: false,
    };
  }

  const now = Date.now();
  const start = toPromoTime(product.promoStartsAt);
  const end = toPromoTime(product.promoEndsAt);

  if (!start && !end) {
    return {
      state: "active" as const,
      active: true,
      scheduled: false,
      ended: false,
    };
  }

  if (start && now < start) {
    return {
      state: "scheduled" as const,
      active: false,
      scheduled: true,
      ended: false,
    };
  }

  if (end && now >= end) {
    return {
      state: "ended" as const,
      active: false,
      scheduled: false,
      ended: true,
    };
  }

  return {
    state: "active" as const,
    active: true,
    scheduled: false,
    ended: false,
  };
}

export function getEffectivePrice(product: {
  price: number | string;
  promoPrice?: number | string | null;
  isPromo?: boolean | null;
  promoStartsAt?: string | Date | null;
  promoEndsAt?: string | Date | null;
}) {
  const promo = getPromoState(product);

  return promo.active && product.promoPrice != null
    ? Number(product.promoPrice)
    : Number(product.price);
}