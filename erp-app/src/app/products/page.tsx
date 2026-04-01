"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTable";

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  created_at: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ name: "", sku: "", price: 0, stock: 0, category: "" });
  const [error, setError] = useState("");

  const fetchProducts = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", sku: "", price: 0, stock: 0, category: "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price,
      stock: product.stock,
      category: product.category,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const url = editing ? `/api/products/${editing.id}` : "/api/products";
    const method = editing ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "操作失败");
      return;
    }

    setShowForm(false);
    fetchProducts();
  }

  async function handleDelete(product: Product) {
    if (!confirm(`确定要删除产品"${product.name}"吗？`)) return;
    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "删除失败");
      return;
    }
    fetchProducts();
  }

  const columns = [
    { key: "name", label: "名称" },
    { key: "sku", label: "SKU" },
    { key: "category", label: "分类" },
    {
      key: "price",
      label: "价格",
      render: (p: Product) => `¥${p.price.toLocaleString()}`,
    },
    {
      key: "stock",
      label: "库存",
      render: (p: Product) => (
        <span className={p.stock < 20 ? "text-red-600 font-medium" : ""}>{p.stock}</span>
      ),
    },
  ];

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">产品管理</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          新增产品
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="搜索产品名称或 SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      <DataTable columns={columns} data={products} onEdit={openEdit} onDelete={handleDelete} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editing ? "编辑产品" : "新增产品"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                <input
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">价格</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存</label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分类</label>
                <input
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  {editing ? "保存" : "创建"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
