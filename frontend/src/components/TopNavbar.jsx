import { Link, useLocation } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export default function TopNavbar() {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubDropdown, setOpenSubDropdown] = useState(null);
  const dropdownRefs = useRef([]);
  const subDropdownRefs = useRef([]);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown, openSubDropdown]);

  const navItems = [
    { name: "Dashboard", to: "/dashboard" },
    {
      name: "Master Data",
      dropdown: [
        { name: "Master Item", to: "/master-data/item" },
        {
          name: "COA",
          subDropdown: [
            { name: "Kategori COA", to: "/master-data/mastercatcoa" },
            { name: "COA", to: "/master-data/coa" },
          ],
        },
      ],
    },
    {
      name: "Transaksi",
      dropdown: [
        { name: "Input Transaksi", to: "/input-transaksi" },
        { name: "Jurnal Umum", to: "/transaksi/jurnal-umum" },
        { name: "Cash Bank", to: "/transaksi/jurnal-umum" },
        { name: "Pembelian", to: "/transaksi/pembelian" },
        { name: "Penjualan", to: "/transaksi/penjualan" },
      ],
    },
    { name: "Laporan", to: "/laporan" },
    { name: "Setting", to: "/setting" },
  ];

  return (
    <nav className="bg-white shadow px-4 py-2 flex items-center">
      <span className="font-bold text-lg mr-6">AkuntansiApp</span>
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
    </nav>
  );
}