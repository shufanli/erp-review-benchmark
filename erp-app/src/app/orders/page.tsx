"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

interface Order {
  id: number;
  order_no: string;
  customer_id: number;
  customer_name: string;
  status: string;
  total: number;
  notes: string;
  created_at: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface Customer {
  id: number;
  name: string;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "待处理",
  confirmed: "已确认",
  shipped: "已发货",
  delivered: "已送达",
  cancelled: "已取消",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

interface OrderItem {
  product_id: number;
  quantity: number;
  price: number;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [formItems, setFormItems] = useState<OrderItem[]>([{ product_id: 0, quantity: 1, price: 0 }]);
  const [formCustomerId, setFormCustomerId] = useState(0);
  const [formNotes, setFormNotes] = useState("");
  const [error, setError] = useState("");

  const fetchOrders = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await api(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  async function openCreate() {
    const [prodRes, custRes] = await Promise.all([api("/api/products"), api("/api/customers")]);
    setProducts(await prodRes.json());
    setCustomers(await custRes.json());
    setFormItems([{ product_id: 0, quantity: 1, price: 0 }]);
    setFormCustomerId(0);
    setFormNotes("");
    setError("");
    setShowForm(true);
  }

  function addItem() {
    setFormItems([...formItems, { product_id: 0, quantity: 1, price: 0 }]);
  }

  function removeItem(index: number) {
    if (formItems.length <= 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: number) {
    const updated = [...formItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === "product_id") {
      const product = products.find((p) => p.id === value);
      if (product) updated[index].price = product.price;
    }
    setFormItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!formCustomerId) {
      setError("请选择客户");
      return;
    }
    const validItems = formItems.filter((item) => item.product_id > 0);
    if (validItems.length === 0) {
      setError("请至少添加一个产品");
      return;
    }

    const res = await api("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: formCustomerId,
        items: validItems,
        notes: formNotes,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "创建失败");
      return;
    }

    setShowForm(false);
    fetchOrders();
  }

  async function updateStatus(orderId: number, newStatus: string) {
    const res = await api(`/api/orders/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "状态更新失败");
      return;
    }
    fetchOrders();
  }

  const total = formItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">订单管理</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          新建订单
        </button>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="搜索订单号或客户名..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">全部状态</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">订单号</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">客户</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">金额</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">状态</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">创建时间</th>
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                  暂无订单
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{order.order_no}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{order.customer_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">¥{order.total.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                      {STATUS_LABELS[order.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.created_at}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    {STATUS_TRANSITIONS[order.status]?.map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => updateStatus(order.id, nextStatus)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {STATUS_LABELS[nextStatus]}
                      </button>
                    ))}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">新建订单</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">客户</label>
                <select
                  value={formCustomerId}
                  onChange={(e) => setFormCustomerId(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value={0}>请选择客户</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">订单项</label>
                {formItems.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <select
                      value={item.product_id}
                      onChange={(e) => updateItem(index, "product_id", Number(e.target.value))}
                      className="flex-1 px-3 py-2 border rounded-lg outline-none text-sm"
                    >
                      <option value={0}>选择产品</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (¥{p.price}, 库存: {p.stock})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                      className="w-20 px-3 py-2 border rounded-lg outline-none text-sm"
                      placeholder="数量"
                    />
                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 px-2">
                      ×
                    </button>
                  </div>
                ))}
                <button type="button" onClick={addItem} className="text-blue-600 text-sm hover:text-blue-800">
                  + 添加产品
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div className="text-right text-lg font-bold text-gray-800">
                合计: ¥{total.toLocaleString()}
              </div>

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                  取消
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  创建订单
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
