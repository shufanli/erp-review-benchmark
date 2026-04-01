"use client";

import { useEffect, useState } from "react";

interface DashboardData {
  stats: {
    totalProducts: number;
    totalCustomers: number;
    totalOrders: number;
    totalRevenue: number;
  };
  ordersByStatus: { status: string; count: number }[];
  recentOrders: {
    id: number;
    order_no: string;
    total: number;
    status: string;
    created_at: string;
    customer_name: string;
  }[];
  lowStockProducts: { id: number; name: string; sku: string; stock: number }[];
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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (!data) return <div className="text-center py-20 text-red-500">加载失败</div>;

  const statCards = [
    { label: "产品总数", value: data.stats.totalProducts, color: "bg-blue-500" },
    { label: "客户总数", value: data.stats.totalCustomers, color: "bg-green-500" },
    { label: "订单总数", value: data.stats.totalOrders, color: "bg-purple-500" },
    {
      label: "总收入",
      value: `¥${data.stats.totalRevenue.toLocaleString()}`,
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">仪表盘</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl shadow p-6">
            <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center text-white text-xl mb-4`}>
              {card.label === "产品总数" && "📦"}
              {card.label === "客户总数" && "👥"}
              {card.label === "订单总数" && "📋"}
              {card.label === "总收入" && "💰"}
            </div>
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">最近订单</h3>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                <div>
                  <p className="font-medium text-gray-700">{order.order_no}</p>
                  <p className="text-sm text-gray-400">{order.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-700">¥{order.total.toLocaleString()}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">库存预警</h3>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">所有产品库存充足</p>
          ) : (
            <div className="space-y-3">
              {data.lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-50">
                  <div>
                    <p className="font-medium text-gray-700">{product.name}</p>
                    <p className="text-sm text-gray-400">{product.sku}</p>
                  </div>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                    product.stock < 10 ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    剩余 {product.stock}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">订单状态分布</h3>
        <div className="flex gap-6 flex-wrap">
          {data.ordersByStatus.map((item) => (
            <div key={item.status} className="text-center">
              <p className="text-2xl font-bold text-gray-700">{item.count}</p>
              <span className={`text-sm px-3 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
