import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const db = getDb();
  const search = req.nextUrl.searchParams.get("search") || "";

  let query = "SELECT * FROM customers WHERE 1=1";
  const params: string[] = [];

  if (search) {
    query += " AND (name LIKE ? OR email LIKE ? OR company LIKE ?)";
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += " ORDER BY created_at DESC";
  const customers = db.prepare(query).all(...params);
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, company, address } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "名称和邮箱不能为空" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db
      .prepare("INSERT INTO customers (name, email, phone, company, address) VALUES (?, ?, ?, ?, ?)")
      .run(name, email, phone || "", company || "", address || "");
    const customer = db.prepare("SELECT * FROM customers WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(customer, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "邮箱已存在" }, { status: 409 });
    }
    throw e;
  }
}
