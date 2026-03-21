export function WhatsAppFloat() {
  const phone =
    process.env.WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5493410000000';
  const text = encodeURIComponent('Hola, quiero hacer un pedido');
  return (
    <a
      href={`https://wa.me/${phone}?text=${text}`}
      target="_blank"
      className="fixed bottom-5 right-5 z-50 rounded-full bg-green-500 px-5 py-4 font-bold text-white shadow-card"
    >
      WhatsApp
    </a>
  );
}
