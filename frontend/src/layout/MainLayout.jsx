// import { Outlet } from "react-router-dom";
// import Sidebar from "../components/Sidebar";
// import Header from "../components/Header";
import { NavLink, Outlet } from "react-router-dom";
import { useState } from "react";

export default function Layout() {
  const [darkMode, setDarkMode] = useState(false);
  const [navPosition, setNavPosition] = useState("left");

  const toggleMode = () => setDarkMode(!darkMode);
  const toggleNav = () => setNavPosition(navPosition === "left" ? "top" : "left");

  const navItems = [
    { name: "Dashboard", to: "/dashboard" },
    { name: "Master Data", to: "/master" },
    { name: "Transaksi", to: "/transaksi" },
    { name: "Laporan", to: "/laporan" },
    { name: "Setting", to: "/setting" },
  ];

  const navClass =
    "text-sm px-4 py-2 rounded hover:bg-indigo-500 hover:text-white transition";

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-800"} min-h-screen font-sans flex flex-col`}>      
      {navPosition === "top" && (
        <nav className="bg-gray-800 text-white p-4 flex gap-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${navClass} ${isActive ? "bg-indigo-600 text-white" : "text-gray-200"}`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      )}

      <div className="flex flex-1">
        {navPosition === "left" && (
          <aside className="w-64 bg-gray-800 text-white p-6 space-y-4">
            <h1 className="text-xl font-bold mb-6">AkuntanWeb</h1>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `${navClass} block ${isActive ? "bg-indigo-600" : "text-gray-200"}`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </aside>
        )}

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      <footer className="text-center py-4 text-xs text-gray-500">
        <button
          onClick={toggleMode}
          className="px-3 py-1 border rounded mr-3 hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"} Mode
        </button>
        <button
          onClick={toggleNav}
          className="px-3 py-1 border rounded hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          Nav: {navPosition === "left" ? "⬅ Left" : "⬆ Top"}
        </button>
      </footer>
    </div>
  );
}
