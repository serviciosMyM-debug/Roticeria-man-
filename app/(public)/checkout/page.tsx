import { CheckoutClient } from '@/components/checkout-client';

export default function CheckoutPage() {
  return (
    <main className="container-app py-10">
      <h1 className="section-title mb-6">Checkout</h1>
      <CheckoutClient />
    </main>
  );
}
