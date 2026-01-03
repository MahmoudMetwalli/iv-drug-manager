import { useAuth } from "../context/AuthContext";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { LogOut, User as UserIcon, Pill, Users } from "lucide-react";

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveLink = (path: string) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-blue-600">IV Drug Manager</h1>
            <nav className="hidden md:flex gap-1 ml-8">
              <Link
                to="/"
                className={`px-3 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${
                  isActiveLink("/") && !location.pathname.startsWith("/drugs")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                }`}
              >
                <Users className="w-4 h-4" />
                Patients
              </Link>
              <Link
                to="/drugs"
                className={`px-3 py-2 rounded-md font-medium flex items-center gap-2 transition-colors ${
                  isActiveLink("/drugs")
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
                }`}
              >
                <Pill className="w-4 h-4" />
                Drugs
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <UserIcon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 font-medium">
                {user?.username}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-bold ${
                  user?.role === "admin"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {user?.role}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-md transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
