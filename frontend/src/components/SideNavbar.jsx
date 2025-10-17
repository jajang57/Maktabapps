import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function SideNavbar({ onClose }) {
  const { theme } = useTheme();
  const location = useLocation();
  const { user, logout } = useAuth();

  // State untuk dropdown dan subDropdown
  // Ubah ke array agar bisa buka banyak dropdown sekaligus
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);

  // Tambahkan icon SVG di setiap menu utama
  const navItems = [
    {
      name: "Dashboard",
      to: "/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M13 5v6h6" />
        </svg>
      ),
    },
    {
      name: "Transaksi",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 01-1.4 2.4H6a1.65 1.65 0 01-1.4-2.4l7-12a1.65 1.65 0 012.8 0l7 12z" />
        </svg>
      ),
      dropdown: [
       // { name: "Akun category", to: "/master-data/mastercatcoa" },
        { name: "Akun", to: "/master-data/coa" },
        { name: "Buku Kas", to: "/input-transaksi" },
        { name: "Pembelian", to: "/transaksi/pembelian" },
        { name: "Penjualan", to: "/transaksi/penjualan" },
        { name: "Aset Tetap" },
        { name: "Aset Tetap Berwujud" },
        { name: "Aset Tetap Tak Berwujud" },
      ],
    },
    {
      name: "Jurnal",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 2v4M16 2v4M3 10h18" />
        </svg>
      ),
      dropdown: [
        { name: "Jurnal Umum", to: "/transaksi/gl" },
        { name: "Jurnal Penyesuaian", to: "/transaksi/AJE" },
        { name: "Riwayat Jurnal" },
      ],
    },
    {
      name: "Buku Besar",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M16 3v4M8 3v4" />
        </svg>
      ),
      dropdown: [
        { name: "Neraca Saldo", to: "/laporan/trial-balance" },
        { name: "Buku Besar Utama" },
        { name: "Buku Besar Pembantu", to: "/laporan/buku-besar" },
        { name: "Pemasok", to: "/master-data/pemasok" },
        { name: "Pembeli", to: "/master-data/pembeli" },
        { name: "Pekerjaan", to: "/master-data/project" },
        { name: "Mata Uang", to: "/master-data/mata-uang" },
        { name: "Pajak", to: "/master-data/pajak" },
      ],
    },
    {
      name: "Persediaan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M16 3v4M8 3v4" />
        </svg>
      ),
      dropdown: [
  { name: "Barang Dan Jasa", to: "/master-data/barang-jasa" },
  { name: "Gudang", to: "/master-data/gudang" },
  { name: "Penyesuaian Persediaan", to: "/master-data/penyesuaian-persediaan" },
      ],
    },
    {
      name: "Pajak",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      dropdown: [
        { name: "Kalkulator Pajak" },
        { name: "Proyeksi Pajak" },
        {
          name: "Arsip Pajak",
          subDropdown: [
            { name: "Faktur Pajak" },
            { name: "Bukti Potong Pajak" },
          ],
        },
      ],
    },
    {
      name: "Laporan Keuangan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 17v-6a2 2 0 012-2h14a2 2 0 012 2v6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-4M8 21v-4" />
        </svg>
      ),
      dropdown: [
        { name: "Neraca" },
        { name: "Laba Rugi" },
        { name: "Arus Kas" },
        { name: "Perubahan Modal" },
      ],
    },
    {
      name: "Anggaran",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      dropdown: [
        { name: "Anggaran Tahunan / Bulanan" },
        { name: "Anggaran Dan Realisasi" },
        { name: "Simulasi Pajak Berdasarkan Anggaran" },
      ],
    },
    {
      name: "Pengaturan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 01-1.4 2.4H6a1.65 1.65 0 01-1.4-2.4l7-12a1.65 1.65 0 012.8 0l7 12z" />
        </svg>
      ),
      dropdown: [
        {
          name: "Profil Perusahaan",
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
      ],
    },
    {
      name: "Bantuan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 14v.01M16 10h.01M12 8v.01M12 12v.01" />
          <circle cx="12" cy="12" r="10" />
        </svg>
      ),
      dropdown: [
        { name: "Panduan Pengguna (FAQ)" },
        { name: "Chat Dukungan/ Tiket Masalah" },
        { name: "Kontak CS/ Konsultan Pajak" },
      ],
    },
    {
      name: "Pemberitahuan",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin logout?")) {
      logout();
    }
  };

  return (
    <aside
      className="w-64 min-h-screen shadow-lg flex flex-col bg-white relative"
      style={{
        background: theme.cardColor,
        color: theme.fontColor,
        overflowY: "auto", // tambahkan ini
        height: "100vh",   // tambahkan ini agar sidebar selalu penuh
      }}
    >
      {/* Tombol close */}
      {/* {onClose && (
        <button
          className="absolute top-2 right-2 bg-gray-100 rounded-full p-1"
          onClick={onClose}
          aria-label="Tutup Sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )} */}

      <nav className="flex-1 flex flex-col gap-1 px-2 mt-4">
        {navItems.map((item, idx) =>
          item.dropdown ? (
            <div key={item.name}>
              <button
                type="button"
                className={`w-full flex items-center gap-2 font-bold justify-between px-3 py-2 rounded hover:bg-indigo-100 transition ${
                  openDropdowns.includes(idx) ? "bg-indigo-500 text-white" : ""
                }`}
                onClick={() => {
                  setOpenDropdowns(openDropdowns.includes(idx)
                    ? openDropdowns.filter(i => i !== idx)
                    : [...openDropdowns, idx]);
                }}
              >
                <span className="flex items-center gap-2">
                  {item.icon}
                  {item.name}
                </span>
                <svg
                  className={`w-4 h-4 ml-1 transition-transform ${openDropdowns.includes(idx) ? "rotate-90" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {openDropdowns.includes(idx) && (
                <div className="ml-6 mt-1 flex flex-col gap-1">
                  {item.dropdown.map((drop, dropIdx) =>
                    drop.subDropdown ? (
                      <div key={drop.name}>
                        <button
                          type="button"
                          className={`w-full flex justify-between items-center px-3 py-2 rounded hover:bg-indigo-100 transition font-bold ${
                            openSubDropdown === dropIdx ? "bg-indigo-400 text-white" : ""
                          }`}
                          onClick={() => setOpenSubDropdown(openSubDropdown === dropIdx ? null : dropIdx)}
                        >
                          <span>{drop.name}</span>
                          <svg
                            className={`w-3 h-3 ml-1 transition-transform ${openSubDropdown === dropIdx ? "rotate-90" : ""}`}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {openSubDropdown === dropIdx && (
                          <div className="ml-4 mt-1 flex flex-col gap-1">
                            {drop.subDropdown.map((sub) =>
                              sub.to ? (
                                <Link
                                  key={sub.to}
                                  to={sub.to}
                                  className={`block px-3 py-2 rounded hover:bg-indigo-100 transition font-bold ${
                                    location.pathname === sub.to ? "bg-indigo-500 text-white" : ""
                                  }`}
                                  // Jangan tutup dropdown utama!
                                  onClick={() => setOpenSubDropdown(null)}
                                >
                                  {sub.name}
                                </Link>
                              ) : (
                                <span key={sub.name} className="block px-3 py-2 text-gray-700 font-bold">
                                  {sub.name}
                                </span>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    ) : drop.to ? (
                      <Link
                        key={drop.to}
                        to={drop.to}
                        className={`block px-3 py-2 rounded hover:bg-indigo-100 transition font-bold ${
                          location.pathname === drop.to ? "bg-indigo-500 text-white" : ""
                        }`}
                        // Jangan tutup dropdown utama!
                        onClick={() => setOpenSubDropdown(null)}
                      >
                        {drop.name}
                      </Link>
                    ) : (
                      <span key={drop.name} className="block px-3 py-2 text-gray-700 font-bold">
                        {drop.name}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>
          ) : item.to ? (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 px-3 py-2 rounded hover:bg-indigo-100 transition font-bold ${
                location.pathname === item.to ? "bg-indigo-500 text-white" : ""
              }`}
            >
              {item.icon}
              {item.name}
            </Link>
          ) : (
            <span key={item.name} className="flex items-center gap-2 px-3 py-2 text-gray-700 font-bold">
              {item.icon}
              {item.name}
            </span>
          )
        )}
      </nav>
      {/* User Menu */}
      <div className="p-4 border-t text-sm flex items-center gap-2" style={{ color: theme.fontColor }}>
        <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <div className="font-medium">{user?.fullName || user?.username || "User"}</div>
          <div className="text-xs text-gray-500">{user?.username}</div>
        </div>
        <button
          onClick={handleLogout}
          className="ml-auto px-2 py-1 text-xs text-red-600 hover:underline"
        >
          Logout
        </button>
      </div>
    </aside>
  );
}