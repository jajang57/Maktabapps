import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <header className="bg-white p-4 shadow flex justify-between items-center">
      <h1 className="text-xl font-semibold">Maktabapps</h1>
      <div className="flex items-center space-x-4">
        <span className="text-gray-600">
          Selamat datang, <span className="font-semibold">{user?.fullName || user?.username}</span>
        </span>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-200"
        >
          Logout
        </button>
      </div>
    </header>
  );
}