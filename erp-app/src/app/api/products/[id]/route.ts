import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, sku, price, stock, category } = body;

  if (!name || !sku) {
    return NextResponse.json({ error: "名称和 SKU 不能为空" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  try {
    db.prepare(
      "UPDATE products SET name=?, sku=?, price=?, stock=?, category=?, updated_at=datetime('now') WHERE id=?"
    ).run(name, sku, price, stock, category || "", Number(id));
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(Number(id));
    return NextResponse.json(product);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "SKU 已存在" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT id FROM products WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "产品不存在" }, { status: 404 });
  }

  // Check if product is used in orders
  const inOrder = db
    .prepare("SELECT COUNT(*) as cnt FROM order_items WHERE product_id = ?")
    .get(Number(id)) as { cnt: number };
  if (inOrder.cnt > 0) {
    return NextResponse.json({ error: "该产品有关联订单，无法删除" }, { status: 409 });
  }

  db.prepare("DELETE FROM products WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
