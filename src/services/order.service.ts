/**
 * Order placement adapter. The BE owns order creation; this mock simulates the
 * round-trip so the checkout flow is exercisable end-to-end. Swap the body for
 * `POST ${env.apiUrl}/orders` once the endpoint exists.
 */

export interface OrderItemInput {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PlaceOrderInput {
  branchId: string;
  fulfillment: "delivery" | "pickup";
  recipient: { name: string; phone: string; email?: string };
  address?: { province: string; district: string; ward: string; street: string };
  shippingMethodId: string;
  paymentMethodId: string;
  voucherCode?: string | null;
  items: OrderItemInput[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
}

export interface PlacedOrder {
  id: string;
  createdAt: string;
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrder> {
  // Simulate the network round-trip. The BE persists `input` and returns the order;
  // here we just acknowledge the payload and synthesize an id.
  await new Promise((r) => setTimeout(r, 700));
  void input.items.length;
  const id = "DH" + Date.now().toString(36).toUpperCase().slice(-8);
  return { id, createdAt: new Date().toISOString() };
}
