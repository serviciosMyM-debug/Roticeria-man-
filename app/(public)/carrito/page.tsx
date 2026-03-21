import { CartClient } from '@/components/cart-client';

export default function CartPage() {
  return (
    <main className="container-app py-10">
      <h1 className="section-title mb-6">Tu carrito</h1>
      <CartClient />
    </main>
  );
}
