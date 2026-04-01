"use client";

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
}

export default function DataTable<T extends { id: number }>({
  columns,
  data,
  onEdit,
  onDelete,
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 text-sm font-semibold text-gray-600">
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-sm font-semibold text-gray-600">操作</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                className="px-6 py-8 text-center text-gray-400"
              >
                暂无数据
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-700">
                    {col.render
                      ? col.render(item)
                      : String((item as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="px-6 py-4 text-sm space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        编辑
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="text-red-600 hover:text-red-800"
                      >
                        删除
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
