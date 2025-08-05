import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function TopNavbar({ onToggleSidebar }) {
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
    // {
    //   name: "Master Data",
    //   dropdown: [
    //     {
    //       name: "AKUN",
    //       subDropdown: [
    //         { name: "Kategori Akun", to: "/master-data/mastercatcoa" },
    //         { name: "Akun", to: "/master-data/coa" },
    //       ],
    //     },
    //     
    //   ],
    // },
    {
      name: "Transaksi",
      dropdown: [
        { name: "Akun category", to: "/master-data/mastercatcoa"},
        { name: "Akun", to: "/master-data/coa"},
        { name: "Buku Kas", to: "/input-transaksi" },
        { name: "Pembelian", to: "/transaksi/pembelian" },
        { name: "Penjualan", to: "/transaksi/penjualan" },
        { name: "Aset" },
        
      ],
    },
    {
      name: "Jurnal",
      dropdown: [
        {
          name: "Jurnal Umum",
          to: "/transaksi/gl"
        },
        { name: "Jurnal Penyesuaian", to: "/transaksi/AJE" },
        {name: "Riwayat Jurnal"},
      ],
    },
    {
      name: "Buku Besar",
      dropdown: [
        { name: "Neraca Saldo", to: "/laporan/trial-balance" },
        { name: "Buku Besar Utama" },
        { name: "Buku Besar Pembantu", to: "/laporan/buku-besar" },
        { name: "Pemasok", to: "/master-data/pemasok" },
        { name: "Pembeli", to: "/master-data/pembeli" },
        { name: "Pekerjaan", to: "/master-data/project" },

      ],
    },
    {
      name: "Pajak",
      dropdown: [
        { name: "Kalkulator Pajak" },
        { name: "Proyeksi Pajak" },
        {
          name: "Arsip Pajak",
          subDropdown: [
            { name: "Faktur Pajak" },
            { name: "Bukti Potong Pajak"},
          ],
        },
      ],
    },
    {
      name: "Laporan Keuangan",
      dropdown: [
        { name: "Neraca" },
        { name: "Laba Rugi" },
        { name: "Arus Kas" },
        { name: "Perubahan Modal" },
      ],
    },
     {
      name: "Anggaran",
      dropdown: [
        { name: "Anggaran Tahunan / Bulanan" },
        { name: "Anggaran Dan Realisasi" },
        { name: "Simulasi Pajak Berdasarkan Anggaran" },
      ],
    },
    { 
       name: "Pengaturan",
      dropdown: [
        { name: "Profil Perusahaan",
          subDropdown: [
            { name: "Informasi umum" },
            { name: "Karyawan" },
            { name: "Pemasok" },
            { name: "Pembeli" },
           
          ],
        },
        { name: "Pajak Perusahaan" },
        { name: "Sinkronisasi" },
        { name: "Tampilan", to: "/setting" },

      ]
    },
    { name: "Bantuan",
      dropdown: [
        { name: "Panduan Pengguna (FAQ)"},
        { name: "Chat Dukungan/ Tiket Masalah"},
        { name: "Kontak CS/ Konsultan Pajak"},
      ]
    },
    { name: "Pemberitahuan",}
  ];

  const handleLogout = () => {
    if (confirm("Apakah Anda yakin ingin logout?")) {
      logout();
    }
  };

  // Header bar
  const Header = () => (
    <header className="flex items-center justify-between px-4 py-2 shadow bg-white">
      <div className="flex items-center gap-2">
        {/* Sidebar toggle button (optional, pass onToggleSidebar prop if needed) */}
        {onToggleSidebar && (
          <button
            className="mr-2 bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition"
            onClick={onToggleSidebar}
            aria-label="Toggle Sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <span className="font-bold text-xl tracking-tight">Temui</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Example icons */}
        <button className="bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition" aria-label="Calendar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
        <button className="bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition" aria-label="Note">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8" />
          </svg>
        </button>
        <button className="bg-gray-100 rounded-full p-2 hover:bg-gray-200 transition" aria-label="Notification">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        {/* Avatar */}
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=T&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );

  return (
    <div>
      <Header />
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
    </div>
  );
}