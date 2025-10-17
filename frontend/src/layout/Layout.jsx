import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import TopNavbar from "../components/TopNavbar";
import SideNavbar from "../components/SideNavbar";

export default function Layout({ children }) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Header component
  const Header = () => (
    <header
      className="flex items-center justify-between px-4 py-2 shadow"
      style={{
        background: theme.appHeaderColor,
        color: theme.fontColor,
      }}
    >
      <div className="flex items-center gap-2">
        {/* Sidebar toggle button */}
        <button
          className="rounded-full p-2 transition"
          style={{ background: theme.headerIconBgColor }}
          onClick={() => setSidebarOpen((v) => !v)}
          aria-label="Toggle Sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <span className="font-bold text-xl tracking-tight">Temui</span>
      </div>
      <div className="flex items-center gap-2">
        {/* Ikon-ikon header */}
        <button
          className="rounded-full p-2 transition"
          style={{ background: theme.headerIconBgColor }}
          aria-label="Calendar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </button>
        <button
          className="rounded-full p-2 transition"
          style={{ background: theme.headerIconBgColor }}
          aria-label="Note"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h7l5 5v11a2 2 0 01-2 2z" />
            <path d="M17 21v-8H7v8" />
          </svg>
        </button>
        <button
          className="rounded-full p-2 transition"
          style={{ background: theme.headerIconBgColor }}
          aria-label="Notification"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden"
          style={{ background: theme.headerIconBgColor }}
        >
          <img src="https://ui-avatars.com/api/?name=T&background=0D8ABC&color=fff" alt="User" className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );

  return (
    <div style={{ background: theme.backgroundColor, minHeight: "100vh" }}>
      {theme.menuPosition === "top" ? (
        <>
          <TopNavbar />
          <main className="p-6 min-h-screen transition-all duration-300" style={{ background: theme.backgroundColor }}>
            {children}
          </main>
        </>
      ) : (
        <div className="flex flex-col min-h-screen" >
          <Header />
          <div className="flex flex-1 ">
            <div
              className={`transition-all duration-300 overflow-hidden`}
              style={{ width: sidebarOpen ? 256 : 0, minWidth: sidebarOpen ? 256 : 0 }}
            >
              <SideNavbar onClose={() => setSidebarOpen(false)} />
            </div>
            <main
              className="flex-1 p-6 h-full transition-all duration-300"
              style={{
                background: theme.backgroundColor,
                overflowY: "auto", // agar body bisa scroll
                height: "100vh",   // pastikan tinggi penuh
              }}
            >
              {children}
            </main>
          </div>
        </div>
      )}
    </div>
  );
}