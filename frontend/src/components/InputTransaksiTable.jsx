import React, { useState, useEffect } from "react";

function formatDateDMY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function InputTransaksiTable({ selectedCOA, refresh }) {
  const [data, setData] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // Fetch data transaksi setiap selectedCOA atau refresh berubah
  useEffect(() => {
    fetch("http://localhost:8080/api/input-transaksi")
      .then(res => res.json())
      .then(data => setData(data))
      .catch(() => setData([]));
  }, [selectedCOA, refresh]);

  // Fetch master COA
  useEffect(() => {
    fetch("http://localhost:8080/api/coa-kas-bank")
      .then(res => res.json())
      .then(data => setCoaList(data))
      .catch(() => setCoaList([]));
  }, []);

  // Helper: id COA ke nama
  const getCoaName = (id) => {
    const found = coaList.find(coa => String(coa.id) === String(id));
    return found ? found.nama : id;
  };

  // Filter data
  const filtered = data.filter(
    item =>
      (!selectedCOA || item.coaAkunBank === selectedCOA) &&
      (
        getCoaName(item.coaAkunBank).toLowerCase().includes(search.toLowerCase()) ||
        item.akunTransaksi?.toLowerCase().includes(search.toLowerCase()) ||
        item.deskripsi?.toLowerCase().includes(search.toLowerCase()) ||
        item.projectNo?.toLowerCase().includes(search.toLowerCase()) ||
        item.projectName?.toLowerCase().includes(search.toLowerCase()) ||
        item.noTransaksi?.toLowerCase().includes(search.toLowerCase())
      )
  );

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const paged = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const handlePrint = () => {
    window.print();
  };

  // Ambil saldoAwal dari master COA sesuai selectedCOA
  const saldoAwal = React.useMemo(() => {
    const coa = coaList.find(coa => String(coa.id) === String(selectedCOA));
    return coa && coa.saldoAwal ? Number(coa.saldoAwal) : 0;
  }, [coaList, selectedCOA]);

  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <h2 className="text-lg font-bold mb-2">
        Data Transaksi {selectedCOA ? `- ${getCoaName(selectedCOA)}` : ""}
      </h2>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
        <input
          type="text"
          placeholder="Cari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-full md:w-64"
        />
        <button
          onClick={handlePrint}
          className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
        >
          Print
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-indigo-100">
            <tr>
              <th className="p-2 border">No</th>
              <th className="p-2 border">COA Akun Bank</th>
              <th className="p-2 border">Tanggal</th>
              <th className="p-2 border">Akun Transaksi</th>
              <th className="p-2 border">Project No</th>
              <th className="p-2 border">Project Name</th>
              <th className="p-2 border">Debit</th>
              <th className="p-2 border">Kredit</th>
              <th className="p-2 border">Balance</th> {/* Tambahkan ini */}
              <th className="p-2 border">Deskripsi</th>
              <th className="p-2 border">Nomor Transaksi</th>
            </tr>
          </thead>
          <tbody>
            {/* Row saldo awal */}
            <tr className="bg-yellow-50 font-semibold sticky top-0 z-10">
              <td className="p-2 border text-center" colSpan={7}>
                Saldo Awal
              </td>
              <td className="p-2 border text-right" colSpan={2}>
                {saldoAwal.toLocaleString()}
              </td>
              <td className="p-2 border" colSpan={2}></td>
            </tr>
            {/* Data transaksi */}
            {paged.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4 text-gray-400">
                  Tidak ada data
                </td>
              </tr>
            ) : (
              (() => {
                // Hitung running balance dari saldoAwal
                // Dapatkan semua transaksi yang sudah difilter dan urutkan berdasarkan tanggal dan id (jika perlu)
                const sorted = [...filtered].sort((a, b) => {
                  // Urutkan tanggal DESC, lalu id DESC jika tanggal sama
                  const tglA = new Date(a.tanggal);
                  const tglB = new Date(b.tanggal);
                  if (tglA > tglB) return -1;
                  if (tglA < tglB) return 1;
                  return b.id - a.id;
                });

                // Buat array balance untuk setiap transaksi
                let running = saldoAwal;
                const balanceMap = {};
                sorted.forEach((row) => {
                  running += (row.debit || 0) - (row.kredit || 0);
                  balanceMap[row.id] = running;
                });

                // Tampilkan hanya data yang ada di paged
                return paged.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-indigo-50">
                    <td className="p-2 border">{(page - 1) * rowsPerPage + idx + 1}</td>
                    <td className="p-2 border">{getCoaName(row.coaAkunBank)}</td>
                    <td className="p-2 border">{formatDateDMY(row.tanggal)}</td>
                    <td className="p-2 border">{row.akunTransaksi}</td>
                    <td className="p-2 border">{row.projectNo}</td>
                    <td className="p-2 border">{row.projectName}</td>
                    <td className="p-2 border text-right">{row.debit?.toLocaleString()}</td>
                    <td className="p-2 border text-right">{row.kredit?.toLocaleString()}</td>
                    <td className="p-2 border text-right">{balanceMap[row.id]?.toLocaleString()}</td> {/* Balance */}
                    <td className="p-2 border">{row.deskripsi}</td>
                    <td className="p-2 border">{row.noTransaksi}</td>
                  </tr>
                ));
              })()
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages || 1}
        </span>
        <div className="space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

