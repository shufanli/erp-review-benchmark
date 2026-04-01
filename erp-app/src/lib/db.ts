import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "erp.db");

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    initDb(db);
  }
  return db;
}

function initDb(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      stock INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      address TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','shipped','delivered','cancelled')),
      total REAL NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1,
      price REAL NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin','user')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed admin user if not exists
  const admin = db.prepare("SELECT id FROM users WHERE username = ?").get("admin");
  if (!admin) {
    db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(
      "admin",
      "admin123",
      "admin"
    );
  }

  // Seed sample data if empty
  const productCount = db.prepare("SELECT COUNT(*) as cnt FROM products").get() as { cnt: number };
  if (productCount.cnt === 0) {
    const insertProduct = db.prepare(
      "INSERT INTO products (name, sku, price, stock, category) VALUES (?, ?, ?, ?, ?)"
    );
    const insertCustomer = db.prepare(
      "INSERT INTO customers (name, email, phone, company) VALUES (?, ?, ?, ?)"
    );

    const products = [
      ["笔记本电脑 Pro", "SKU-001", 8999, 50, "电子产品"],
      ["无线鼠标", "SKU-002", 129, 200, "配件"],
      ["机械键盘", "SKU-003", 599, 80, "配件"],
      ["27寸显示器", "SKU-004", 2499, 30, "电子产品"],
      ["USB-C 扩展坞", "SKU-005", 399, 120, "配件"],
      ["办公桌椅套装", "SKU-006", 3299, 15, "办公家具"],
      ["打印机", "SKU-007", 1599, 25, "电子产品"],
      ["文件柜", "SKU-008", 899, 40, "办公家具"],
    ];

    const customers = [
      ["张三", "zhangsan@example.com", "13800138001", "北京科技有限公司"],
      ["李四", "lisi@example.com", "13800138002", "上海贸易有限公司"],
      ["王五", "wangwu@example.com", "13800138003", "广州制造有限公司"],
      ["赵六", "zhaoliu@example.com", "13800138004", "深圳电子有限公司"],
      ["陈七", "chenqi@example.com", "13800138005", "杭州网络有限公司"],
    ];

    const seedTx = db.transaction(() => {
      for (const p of products) {
        insertProduct.run(...p);
      }
      for (const c of customers) {
        insertCustomer.run(...c);
      }

      // Create sample orders
      const insertOrder = db.prepare(
        "INSERT INTO orders (order_no, customer_id, status, total) VALUES (?, ?, ?, ?)"
      );
      const insertItem = db.prepare(
        "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)"
      );

      insertOrder.run("ORD-20260401-001", 1, "delivered", 9128);
      insertItem.run(1, 1, 1, 8999);
      insertItem.run(1, 2, 1, 129);

      insertOrder.run("ORD-20260401-002", 2, "shipped", 3098);
      insertItem.run(2, 3, 1, 599);
      insertItem.run(2, 4, 1, 2499);

      insertOrder.run("ORD-20260401-003", 3, "pending", 798);
      insertItem.run(3, 5, 2, 399);

      insertOrder.run("ORD-20260401-004", 4, "confirmed", 3299);
      insertItem.run(4, 6, 1, 3299);

      insertOrder.run("ORD-20260401-005", 1, "cancelled", 1599);
      insertItem.run(5, 7, 1, 1599);
    });
    seedTx();
  }
}
