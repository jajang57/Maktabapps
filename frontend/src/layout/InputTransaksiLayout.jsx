import React from "react";
import { useTheme } from "../context/ThemeContext";

export default function InputTransaksiLayout({ children }) {
  const { theme } = useTheme();

  return (
    <div
      className="p-6 min-h-screen"
      style={{
        background: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        color: theme.fontColor,
      }}
    >
      <h1
        className="text-2xl font-bold mb-4"
        style={{
          color: theme.fontColor,
          fontFamily: theme.fontFamily,
        }}
      >
        Input Transaksi
      </h1>
      <div
        className="rounded shadow p-4"
        style={{
          background: theme.cardColor,
          color: theme.fontColor,
          fontFamily: theme.fontFamily,
        }}
      >
        {children ? children : <p>Silakan input transaksi di sini.</p>}
      </div>
    </div>
  );
}
