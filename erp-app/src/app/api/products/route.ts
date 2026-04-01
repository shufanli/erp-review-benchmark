import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const db = getDb();
  const search = req.nextUrl.searchParams.get("search") || "";
  const category = req.nextUrl.searchParams.get("category") || "";

  let query = "SELECT * FROM products WHERE 1=1";
  const params: string[] = [];

  if (search) {
    query += " AND (name LIKE ? OR sku LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  if (category) {
    query += " AND category = ?";
    params.push(category);
  }

  query += " ORDER BY created_at DESC";
  const products = db.prepare(query).all(...params);
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json();
  const { name, sku, price, stock, category } = body;

  if (!name || !sku) {
    return NextResponse.json({ error: "名称和 SKU 不能为空" }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "价格必须为非负数" }, { status: 400 });
  }
  if (typeof stock !== "number" || stock < 0 || !Number.isInteger(stock)) {
    return NextResponse.json({ error: "库存必须为非负整数" }, { status: 400 });
  }

  const db = getDb();
  try {
    const result = db
      .prepare("INSERT INTO products (name, sku, price, stock, category) VALUES (?, ?, ?, ?, ?)")
      .run(name, sku, price, stock, category || "");
    const product = db.prepare("SELECT * FROM products WHERE id = ?").get(result.lastInsertRowid);
    return NextResponse.json(product, { status: 201 });
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("UNIQUE")) {
      return NextResponse.json({ error: "SKU 已存在" }, { status: 409 });
    }
    throw e;
  }
}
