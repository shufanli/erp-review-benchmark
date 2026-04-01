import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const db = getDb();

  const totalProducts = (db.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number }).cnt;
  const totalCustomers = (db.prepare("SELECT COUNT(*) as cnt FROM customers").get() as { cnt: number }).cnt;
  const totalOrders = (db.prepare("SELECT COUNT(*) as cnt FROM orders").get() as { cnt: number }).cnt;
  const totalRevenue = (
    db.prepare("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status != 'cancelled'").get() as {
      total: number;
    }
  ).total;

  const ordersByStatus = db
    .prepare("SELECT status, COUNT(*) as count FROM orders GROUP BY status")
    .all() as { status: string; count: number }[];

  const recentOrders = db
    .prepare(
      "SELECT o.id, o.order_no, o.total, o.status, o.created_at, c.name as customer_name FROM orders o JOIN customers c ON o.customer_id = c.id ORDER BY o.created_at DESC LIMIT 5"
    )
    .all();

  const lowStockProducts = db
    .prepare("SELECT id, name, sku, stock FROM products WHERE stock < 20 ORDER BY stock ASC")
    .all();

  return NextResponse.json({
    stats: { totalProducts, totalCustomers, totalOrders, totalRevenue },
    ordersByStatus,
    recentOrders,
    lowStockProducts,
  });
}
