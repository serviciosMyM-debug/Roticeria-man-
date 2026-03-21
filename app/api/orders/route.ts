import { db } from '@/lib/db';
import { z } from 'zod';

const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(6),
    address: z.string().optional().nullable()
  }),
  deliveryType: z.string(),
  notes: z.string().optional().nullable(),
  paymentMethod: z.enum(['EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO']),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number(),
        quantity: z.number().int().positive(),
        stock: z.number().int().nonnegative()
      })
    )
    .min(1)
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = orderSchema.parse(body);

    const dbProducts = await db.product.findMany({
      where: { id: { in: parsed.items.map((item) => item.id) } }
    });

    for (const item of parsed.items) {
      const product = dbProducts.find((product) => product.id === item.id);
      if (!product || product.stock < item.quantity) {
        return Response.json({ error: `Stock insuficiente para ${item.name}` }, { status: 400 });
      }
    }

    const customer = await db.customer.create({
      data: {
        name: parsed.customer.name,
        phone: parsed.customer.phone,
        address: parsed.customer.address || ''
      }
    });

    const total = parsed.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const order = await db.order.create({
      data: {
        customerId: customer.id,
        deliveryType: parsed.deliveryType,
        notes: parsed.notes || '',
        paymentMethod: parsed.paymentMethod,
        total,
        items: {
          create: parsed.items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            unitPrice: item.price
          }))
        }
      },
      include: { items: true }
    });

    await Promise.all(
      parsed.items.map((item) =>
        db.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        })
      )
    );

    const whatsappText = [
      `Hola, quiero confirmar mi pedido #${order.id.slice(-6).toUpperCase()}`,
      '',
      ...parsed.items.map((item) => `• ${item.name} x${item.quantity}`),
      '',
      `Total: $${total.toLocaleString('es-AR')}`,
      `Pago: ${parsed.paymentMethod}`,
      `Entrega: ${parsed.deliveryType}`,
      parsed.customer.address ? `Dirección: ${parsed.customer.address}` : '',
      parsed.notes ? `Observaciones: ${parsed.notes}` : ''
    ]
      .filter(Boolean)
      .join('
');

    return Response.json({
      ok: true,
      orderId: order.id,
      phone: process.env.WHATSAPP_NUMBER || '5493410000000',
      whatsappText
    });
  } catch (error) {
    return Response.json({ error: 'No se pudo crear el pedido', details: String(error) }, { status: 500 });
  }
}
