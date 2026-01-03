import { useState, useEffect } from "react";
import { FileText, Filter, ShieldOff, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  entity_type: string;
  entity_id: number;
  details: string;
  timestamp: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
};

const ENTITY_COLORS: Record<string, string> = {
  patient: "bg-purple-100 text-purple-700",
  drug: "bg-orange-100 text-orange-700",
  preparation: "bg-cyan-100 text-cyan-700",
  user: "bg-pink-100 text-pink-700",
};

export default function AuditLogsPage() {
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke("audit:list", {
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    loadLogs();
  };

  const clearFilters = () => {
    setFilters({ action: "", entityType: "", startDate: "", endDate: "" });
    loadLogs();
  };

  if (!hasPermission("view_audit_logs")) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-red-600">
            You don't have permission to view audit logs.
          </p>
        </div>
      </div>
    );
  }

  const formatDetails = (details: string) => {
    try {
      const parsed = JSON.parse(details);
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    } catch {
      return details;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
        <p className="text-gray-500">
          Track all actions performed in the system
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6 border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <select
            value={filters.action}
            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
          </select>
          <select
            value={filters.entityType}
            onChange={(e) =>
              setFilters({ ...filters, entityType: e.target.value })
            }
            className="border border-gray-300 rounded px-3 py-2 text-sm"
          >
            <option value="">All Entities</option>
            <option value="patient">Patient</option>
            <option value="drug">Drug</option>
            <option value="preparation">Preparation</option>
            <option value="user">User</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              setFilters({ ...filters, startDate: e.target.value })
            }
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) =>
              setFilters({ ...filters, endDate: e.target.value })
            }
            className="border border-gray-300 rounded px-3 py-2 text-sm"
            placeholder="End Date"
          />
          <div className="flex gap-2">
            <button
              onClick={handleFilter}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
            >
              Apply
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50"
              title="Clear filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">Timestamp</th>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Action</th>
              <th className="px-6 py-3">Entity</th>
              <th className="px-6 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No audit logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 text-gray-600 whitespace-nowrap">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-medium text-gray-900">
                      {log.username}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ACTION_COLORS[log.action] || "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        ENTITY_COLORS[log.entity_type] ||
                        "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {log.entity_type}
                    </span>
                    {log.entity_id && (
                      <span className="text-gray-500 text-xs ml-1">
                        #{log.entity_id}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-gray-600 text-xs max-w-md truncate">
                    {formatDetails(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record count */}
      <div className="mt-4 text-sm text-gray-500 text-right">
        Showing {logs.length} records (max 500)
      </div>
    </div>
  );
}
