import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function TopNavbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const dropdownRefs = useRef([]);
  const subDropdownRefs = useRef([]);
  const userMenuRef = useRef(null);

  // Tutup dropdown jika klik di luar
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        openDropdown !== null &&
        dropdownRefs.current[openDropdown] &&
        !dropdownRefs.current[openDropdown].contains(event.target)
      ) {
        setOpenDropdown(null);
      }
      if (
        openSubDropdown !== null &&
        subDropdownRefs.current[openSubDropdown] &&
        !subDropdownRefs.current[openSubDropdown].contains(event.target)
      ) {
        setOpenSubDropdown(null);
      }
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, openSubDropdown, showUserMenu]);

  const navItems = [
    { name: "Dashboard", to: "/dashboard" },
    {
      name: "Master Data",
      dropdown: [
        {
          name: "AKUN",
          subDropdown: [
            { name: "Kategori Akun", to: "/master-data/mastercatcoa" },
            { name: "Akun", to: "/master-data/coa" },
          ],
        },
        { name: "Pemasok", to: "/master-data/pemasok" },
        { name: "Pembeli", to: "/master-data/pembeli" },
        { name: "Karyawan", to: "/master-data/karyawan" },
        { name: "Project", to: "/master-data/project" },
      ],
    },
    {
      name: "Transaksi",
      dropdown: [
        { name: "Input Transaksi", to: "/input-transaksi" },
        { name: "Jurnal Umum", to: "/transaksi/jurnal-umum" },
        { name: "Cash Bank", to: "/transaksi/cash-bank" },
        { name: "Pembelian", to: "/transaksi/pembelian" },
        { name: "Penjualan", to: "/transaksi/penjualan" },
        {
          name: "GL",
          to: "/transaksi/gl"
        },
      ],
    },
    {
      name: "Laporan",
      dropdown: [
        { name: "Trial Balance", to: "/laporan/trial-balance" },
        { name: "Buku Besar", to: "/laporan/buku-besar" },

      ],
    },
    { name: "Setting", to: "/setting" },
  ];

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      logout();
    }
  };

  return (
    <nav className="bg-white shadow px-4 py-2 flex items-center justify-between">
      <div className="flex items-center space-x-1">
        <span className="font-bold text-lg mr-6 text-indigo-600">AkuntansiApp</span>
        {navItems.map((item, idx) =>
        item.dropdown ? (
          <div
            key={item.name}
            className="relative"
            ref={(el) => (dropdownRefs.current[idx] = el)}
          >
            <button
              type="button"
              className={`px-3 py-2 rounded flex items-center gap-1 hover:bg-indigo-100 transition ${
                item.dropdown.some((d) =>
                  d.to
                    ? location.pathname === d.to
                    : d.subDropdown?.some((s) => location.pathname === s.to)
                )
                  ? "bg-indigo-500 text-white"
                  : "text-gray-700"
              }`}
              onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
            >
              {item.name}
              <svg
                className="w-4 h-4 ml-1"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openDropdown === idx && (
              <div className="absolute left-0 mt-2 w-48 bg-white rounded shadow z-10">
                {item.dropdown.map((drop, dropIdx) =>
                  drop.subDropdown ? (
                    <div
                      key={drop.name}
                      className="relative"
                      onMouseEnter={() => setOpenSubDropdown(dropIdx)}
                      onMouseLeave={() => setOpenSubDropdown(null)}
                      ref={(el) => (subDropdownRefs.current[dropIdx] = el)}
                    >
                      <button
                        type="button"
                        className={`w-full text-left px-4 py-2 flex items-center justify-between hover:bg-indigo-100 transition ${
                          drop.subDropdown.some((s) => location.pathname === s.to)
                            ? "bg-indigo-500 text-white"
                            : "text-gray-700"
                        }`}
                      >
                        {drop.name}
                        <svg
                          className="w-3 h-3 ml-2"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                      {openSubDropdown === dropIdx && (
                        <div className="absolute left-full top-0 mt-0 ml-1 w-48 bg-white rounded shadow z-20">
                          {drop.subDropdown.map((sub) => (
                            <Link
                              key={sub.to}
                              to={sub.to}
                              className={`block px-4 py-2 hover:bg-indigo-100 transition ${
                                location.pathname === sub.to
                                  ? "bg-indigo-500 text-white"
                                  : "text-gray-700"
                              }`}
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubDropdown(null);
                              }}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={drop.to}
                      to={drop.to}
                      className={`block px-4 py-2 hover:bg-indigo-100 transition ${
                        location.pathname === drop.to
                          ? "bg-indigo-500 text-white"
                          : "text-gray-700"
                      }`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      {drop.name}
                    </Link>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          <Link
            key={item.to}
            to={item.to}
            className={`px-3 py-2 rounded hover:bg-indigo-100 transition ${
              location.pathname === item.to
                ? "bg-indigo-500 text-white"
                : "text-gray-700"
            }`}
          >
            {item.name}
          </Link>
        )
      )}
      </div>
      
      {/* User Menu */}
      <div className="relative" ref={userMenuRef}>
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-700">
              {user?.fullName || user?.username || 'User'}
            </p>
            <p className="text-xs text-gray-500">
              {user?.username}
            </p>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showUserMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">
                {user?.fullName || user?.username}
              </p>
              <p className="text-xs text-gray-500">
                {user?.username}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}