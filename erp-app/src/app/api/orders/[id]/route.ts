import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const order = db
    .prepare(
      "SELECT o.*, c.name as customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?"
    )
    .get(Number(id));

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  const items = db
    .prepare(
      "SELECT oi.*, p.name as product_name, p.sku FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?"
    )
    .all(Number(id));

  return NextResponse.json({ ...order, items });
}

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { status, notes } = body;

  const db = getDb();
  const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(Number(id)) as
    | { id: number; status: string }
    | undefined;

  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  if (status) {
    const allowed = STATUS_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { error: `订单状态不能从"${order.status}"变更为"${status}"` },
        { status: 400 }
      );
    }

    const updateOrder = db.transaction(() => {
      db.prepare("UPDATE orders SET status=?, updated_at=datetime('now') WHERE id=?").run(status, Number(id));

      // Restore stock if cancelled
      if (status === "cancelled") {
        const items = db.prepare("SELECT product_id, quantity FROM order_items WHERE order_id = ?").all(
          Number(id)
        ) as { product_id: number; quantity: number }[];
        for (const item of items) {
          db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.product_id);
        }
      }
    });
    updateOrder();
  }

  if (notes !== undefined) {
    db.prepare("UPDATE orders SET notes=?, updated_at=datetime('now') WHERE id=?").run(notes, Number(id));
  }

  const updated = db
    .prepare(
      "SELECT o.*, c.name as customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?"
    )
    .get(Number(id));
  return NextResponse.json(updated);
}
