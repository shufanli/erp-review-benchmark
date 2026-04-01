import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const db = getDb();
  const status = req.nextUrl.searchParams.get("status") || "";
  const search = req.nextUrl.searchParams.get("search") || "";

  let query = `
    SELECT o.*, c.name as customer_name
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    WHERE 1=1
  `;
  const params: string[] = [];

  if (status) {
    query += " AND o.status = ?";
    params.push(status);
  }
  if (search) {
    query += " AND (o.order_no LIKE ? OR c.name LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY o.created_at DESC";
  const orders = db.prepare(query).all(...params);
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json();
  const { customer_id, items, notes } = body as {
    customer_id: number;
    items: OrderItem[];
    notes?: string;
  };

  if (!customer_id || !items || items.length === 0) {
    return NextResponse.json({ error: "客户和订单项不能为空" }, { status: 400 });
  }

  const db = getDb();

  // Verify customer exists
  const customer = db.prepare("SELECT id FROM customers WHERE id = ?").get(customer_id);
  if (!customer) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  // Verify all products exist and have enough stock
  for (const item of items) {
    const product = db.prepare("SELECT id, stock, name FROM products WHERE id = ?").get(item.product_id) as
      | { id: number; stock: number; name: string }
      | undefined;
    if (!product) {
      return NextResponse.json({ error: `产品 ID ${item.product_id} 不存在` }, { status: 404 });
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { error: `产品"${product.name}"库存不足（剩余 ${product.stock}）` },
        { status: 400 }
      );
    }
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const orderNo = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(Date.now()).slice(-4)}`;

  const createOrder = db.transaction(() => {
    const result = db
      .prepare("INSERT INTO orders (order_no, customer_id, status, total, notes) VALUES (?, ?, 'pending', ?, ?)")
      .run(orderNo, customer_id, total, notes || "");

    const orderId = result.lastInsertRowid;
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
    );
    const updateStock = db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?");

    for (const item of items) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    return orderId;
  });

  const orderId = createOrder();
  const order = db
    .prepare(
      "SELECT o.*, c.name as customer_name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.id = ?"
    )
    .get(orderId);
  return NextResponse.json(order, { status: 201 });
}
