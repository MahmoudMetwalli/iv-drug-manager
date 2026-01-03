import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Pencil,
  Shield,
  ShieldOff,
  X,
  Loader2,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface User {
  id: number;
  username: string;
  display_name: string;
  role: "admin" | "pharmacist";
  permissions: string[];
  is_active: number;
  created_at: string;
}

const ALL_PERMISSIONS = [
  {
    key: "manage_patients",
    label: "Manage Patients",
    description: "Add, edit, delete patients",
  },
  {
    key: "manage_drugs",
    label: "Manage Drugs",
    description: "Add, edit, delete drugs",
  },
  {
    key: "manage_preparations",
    label: "Manage Preparations",
    description: "Create and update preparations",
  },
  {
    key: "manage_users",
    label: "Manage Users",
    description: "Create and manage users (admin only)",
  },
  {
    key: "view_audit_logs",
    label: "View Audit Logs",
    description: "Access audit logs (admin only)",
  },
];

export default function UsersPage() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await window.ipcRenderer.invoke("user:list");
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      await window.ipcRenderer.invoke("user:update", {
        id: user.id,
        display_name: user.display_name,
        role: user.role,
        permissions: user.permissions,
        is_active: user.is_active ? 0 : 1,
      });
      loadUsers();
    } catch (err) {
      console.error("Failed to update user", err);
    }
  };

  if (!hasPermission("manage_users")) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ShieldOff className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-red-700">Access Denied</h2>
          <p className="text-red-600">
            You don't have permission to manage users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500">Manage users and their permissions</p>
        </div>
        <button
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
            <tr>
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Permissions</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto text-gray-400" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.display_name || user.username}
                        </div>
                        <div className="text-gray-500 text-xs">
                          @{user.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {user.role === "admin" ? (
                        <span className="text-xs text-gray-500 italic">
                          All permissions
                        </span>
                      ) : user.permissions.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : (
                        user.permissions.slice(0, 2).map((p) => (
                          <span
                            key={p}
                            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs"
                          >
                            {p.replace("manage_", "").replace("view_", "")}
                          </span>
                        ))
                      )}
                      {user.permissions.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{user.permissions.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit User"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {user.username !== "admin" && (
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-1.5 rounded ${
                            user.is_active
                              ? "text-gray-500 hover:text-red-600 hover:bg-red-100"
                              : "text-gray-500 hover:text-green-600 hover:bg-green-100"
                          }`}
                          title={user.is_active ? "Deactivate" : "Activate"}
                        >
                          {user.is_active ? (
                            <ShieldOff className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

// User Form Modal Component
function UserFormModal({
  user,
  onClose,
  onSuccess,
}: {
  user: User | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEdit = !!user;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    password: "",
    display_name: user?.display_name || "",
    role: user?.role || "pharmacist",
    permissions: user?.permissions || [],
  });

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await window.ipcRenderer.invoke("user:update", {
          id: user.id,
          display_name: formData.display_name,
          role: formData.role,
          permissions: formData.permissions,
          is_active: user.is_active,
          password: formData.password || undefined,
        });
      } else {
        await window.ipcRenderer.invoke("user:create", {
          username: formData.username,
          password: formData.password,
          display_name: formData.display_name,
          role: formData.role,
          permissions: formData.permissions,
        });
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      alert(`Failed to ${isEdit ? "update" : "create"} user`);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit User" : "Add New User"}
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                required
                disabled={isEdit}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {isEdit ? "New Password (optional)" : "Password"}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
                required={!isEdit}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  role: e.target.value as "admin" | "pharmacist",
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 border p-2"
            >
              <option value="pharmacist">Pharmacist</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {formData.role !== "admin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-2 border rounded-lg p-3 bg-gray-50">
                {ALL_PERMISSIONS.filter(
                  (p) => !["manage_users", "view_audit_logs"].includes(p.key)
                ).map((permission) => (
                  <label
                    key={permission.key}
                    className="flex items-start gap-3 p-2 hover:bg-white rounded cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                        formData.permissions.includes(permission.key)
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-300"
                      }`}
                      onClick={() => togglePermission(permission.key)}
                    >
                      {formData.permissions.includes(permission.key) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">
                        {permission.label}
                      </div>
                      <div className="text-xs text-gray-500">
                        {permission.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              {loading && <Loader2 className="animate-spin h-4 w-4" />}
              {isEdit ? "Update User" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
