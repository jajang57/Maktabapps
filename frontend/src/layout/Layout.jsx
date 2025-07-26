import { useEffect, useState } from "react";
import TopNavbar from "../components/TopNavbar";

export default function Layout({ children }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", isDark ? "dark" : "light");
    // Debug: cek apakah userId tersimpan di localStorage
   const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    console.log("[Layout] userId from localStorage:", userId);
  }, [isDark]);

  return (
    <div className={isDark ? "dark" : ""}>
      <TopNavbar />
      <main className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}