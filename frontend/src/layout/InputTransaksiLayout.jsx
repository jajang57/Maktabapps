import React from "react";

export default function InputTransaksiLayout({ children }) {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Input Transaksi</h1>
      <div className="bg-white rounded shadow p-4">
        {children ? children : <p>Silakan input transaksi di sini.</p>}
      </div>
    </div>
  );
}
