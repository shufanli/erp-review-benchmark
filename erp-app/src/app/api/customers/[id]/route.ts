import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, company, address } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "名称和邮箱不能为空" }, { status: 400 });
  }

  const db = getDb();
  const existing = db.prepare("SELECT id FROM customers WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  try {
    db.prepare(
      "UPDATE customers SET name=?, email=?, phone=?, company=?, address=?, updated_at=datetime('now') WHERE id=?"
    ).run(name, email, phone || "", company || "", address || "", Number(id));
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(Number(id));
    return NextResponse.json(customer);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "邮箱已存在" }, { status: 409 });
    }
    throw e;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const { id } = await params;
  const db = getDb();

  const existing = db.prepare("SELECT id FROM customers WHERE id = ?").get(Number(id));
  if (!existing) {
    return NextResponse.json({ error: "客户不存在" }, { status: 404 });
  }

  const hasOrders = db
    .prepare("SELECT COUNT(*) as cnt FROM orders WHERE customer_id = ?")
    .get(Number(id)) as { cnt: number };
  if (hasOrders.cnt > 0) {
    return NextResponse.json({ error: "该客户有关联订单，无法删除" }, { status: 409 });
  }

  db.prepare("DELETE FROM customers WHERE id = ?").run(Number(id));
  return NextResponse.json({ success: true });
}
