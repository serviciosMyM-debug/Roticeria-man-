export const CART_STORAGE_KEY = "mana_cart";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
};

export function normalizeCart(raw: any): CartItem[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item) => ({
      productId: String(item.productId ?? item.id ?? ""),
      name: String(item.name ?? ""),
      price: Number(item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      stock: Number(item.stock ?? 0),
      imageUrl: item.imageUrl ?? null,
    }))
    .filter((item) => item.productId && item.name && item.quantity > 0);
}

export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw =
      localStorage.getItem(CART_STORAGE_KEY) ||
      localStorage.getItem("cart") ||
      localStorage.getItem("cartItems");

    if (!raw) return [];

    const parsed = JSON.parse(raw);
    const normalized = normalizeCart(parsed);

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return [];
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  localStorage.removeItem("cart");
  localStorage.removeItem("cartItems");
  window.dispatchEvent(new Event("mana-cart-updated"));
}

export function addToCart(item: CartItem) {
  const cart = getCart();
  const existing = cart.find((x) => x.productId === item.productId);

  let updated: CartItem[];

  if (existing) {
    updated = cart.map((x) =>
      x.productId === item.productId
        ? {
            ...x,
            quantity: Math.min(x.quantity + item.quantity, x.stock || item.stock || 999),
          }
        : x
    );
  } else {
    updated = [...cart, item];
  }

  saveCart(updated);
}

export function removeFromCart(productId: string) {
  const cart = getCart().filter((x) => x.productId !== productId);
  saveCart(cart);
}

export function updateCartQuantity(productId: string, quantity: number) {
  const cart = getCart().map((x) =>
    x.productId === productId
      ? {
          ...x,
          quantity: Math.max(1, Math.min(quantity, x.stock || 999)),
        }
      : x
  );

  saveCart(cart);
}

export function clearCart() {
  saveCart([]);
}

export function getCartCount(items?: CartItem[]) {
  const cart = items ?? getCart();
  return cart.reduce((acc, item) => acc + item.quantity, 0);
}

export function getCartTotal(items?: CartItem[]) {
  const cart = items ?? getCart();
  return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
}