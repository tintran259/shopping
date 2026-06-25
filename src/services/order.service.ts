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
  address?: { province: string; ward: string; street: string };
  shippingMethodId: string;
  paymentMethodId: string;
  invoice?: { companyName: string; taxCode: string; address: string; email: string };
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

/** Order code generator — exposed so the bank-transfer QR can use the final code as memo. */
export function newOrderId(): string {
  return "DH" + Date.now().toString(36).toUpperCase().slice(-8);
}

export async function placeOrder(input: PlaceOrderInput, id: string = newOrderId()): Promise<PlacedOrder> {
  // Simulate the network round-trip. The BE persists `input` and returns the order;
  // here we just acknowledge the payload and use the (possibly preset) code.
  await new Promise((r) => setTimeout(r, 700));
  void input.items.length;
  return { id, createdAt: new Date().toISOString() };
}
