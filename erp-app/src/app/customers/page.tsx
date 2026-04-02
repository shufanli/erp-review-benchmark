"use client";

import { useEffect, useState, useCallback } from "react";
import DataTable from "@/components/DataTable";
import { api } from "@/lib/api";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  created_at: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", address: "" });
  const [error, setError] = useState("");

  const fetchCustomers = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await api(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", email: "", phone: "", company: "", address: "" });
    setError("");
    setShowForm(true);
  }

  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company,
      address: customer.address,
    });
    setError("");
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const url = editing ? `/api/customers/${editing.id}` : "/api/customers";
    const method = editing ? "PUT" : "POST";

    const res = await api(url, {
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
    fetchCustomers();
  }

  async function handleDelete(customer: Customer) {
    if (!confirm(`确定要删除客户"${customer.name}"吗？`)) return;
    const res = await api(`/api/customers/${customer.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "删除失败");
      return;
    }
    fetchCustomers();
  }

  const columns = [
    { key: "name", label: "姓名" },
    { key: "email", label: "邮箱" },
    { key: "phone", label: "电话" },
    { key: "company", label: "公司" },
  ];

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">客户管理</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          新增客户
        </button>
      </div>

      <input
        type="text"
        placeholder="搜索客户姓名、邮箱或公司..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      <DataTable columns={columns} data={customers} onEdit={openEdit} onDelete={handleDelete} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">{editing ? "编辑客户" : "新增客户"}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">电话</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">公司</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">地址</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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
