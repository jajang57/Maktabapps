import React, { useState, useEffect } from "react";
import api from "../../utils/api";

function formatDateDMY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function InputTransaksiTable({ selectedCOA, refresh, onRowDoubleClick }) {
  const [data, setData] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const rowsPerPage = 5;

  // Fetch data transaksi hanya ketika selectedCOA sudah dipilih
  useEffect(() => {
    if (selectedCOA) {
      api.get("/input-transaksi")
        .then(res => setData(res.data))
        .catch(() => setData([]));
    } else {
      // Reset data ketika COA belum dipilih
      setData([]);
    }
  }, [selectedCOA, refresh]);

  // Fetch master COA
  useEffect(() => {
    api.get("/coa-kas-bank")
      .then(res => setCoaList(res.data))
      .catch(() => setCoaList([]));
  }, []);

  // Fetch master COA untuk akun transaksi
  useEffect(() => {
    api.get("/master-coa")
      .then(res => setMasterCoaList(res.data))
      .catch(() => setMasterCoaList([]));
  }, []);

  // Helper: id/kode COA ke nama
  const getCoaName = (idOrKode) => {
    // Coba cari berdasarkan ID dulu
    let found = coaList.find(coa => String(coa.id) === String(idOrKode));
    // Jika tidak ketemu, coba cari berdasarkan kode
    if (!found) {
      found = coaList.find(coa => String(coa.kode) === String(idOrKode));
    }
    return found ? found.nama : idOrKode;
  };

  // Helper: kode akun transaksi ke nama
  const getAkunTransaksiName = (kode) => {
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `${found.nama} (${found.kode})` : kode;
  };

  // Filter data
  const filtered = data.filter(item => {
    // Konversi selectedCOA (ID) ke kode untuk matching
    let selectedCOAKode = selectedCOA;
    if (selectedCOA) {
      const selectedCOAObj = coaList.find(coa => String(coa.id) === String(selectedCOA));
      selectedCOAKode = selectedCOAObj ? selectedCOAObj.kode : selectedCOA;
    }
    
    const matchesCOA = !selectedCOA || item.coaAkunBank === selectedCOAKode;
    const matchesSearch = !search || (
      getCoaName(item.coaAkunBank).toLowerCase().includes(search.toLowerCase()) ||
      getAkunTransaksiName(item.akunTransaksi).toLowerCase().includes(search.toLowerCase()) ||
      (item.deskripsi && item.deskripsi.toLowerCase().includes(search.toLowerCase())) ||
      (item.projectNo && item.projectNo.toLowerCase().includes(search.toLowerCase())) ||
      (item.projectName && item.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (item.noTransaksi && item.noTransaksi.toLowerCase().includes(search.toLowerCase()))
    );
    return matchesCOA && matchesSearch;
  });

  // Urutkan data berdasarkan tanggal descending (terbaru dulu) untuk pagination
  const sortedFiltered = React.useMemo(() => {
    return [...filtered].sort((a, b) => {
      const tglA = new Date(a.tanggal);
      const tglB = new Date(b.tanggal);
      // Tanggal descending (terbaru dulu)
      if (tglA > tglB) return -1;
      if (tglA < tglB) return 1;
      // Jika tanggal sama, urutkan berdasarkan ID descending
      return b.id - a.id;
    });
  }, [filtered]);

  const totalPages = Math.ceil(sortedFiltered.length / rowsPerPage);
  const pagedRaw = sortedFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  
  // Urutkan data dalam page secara ascending (nomor transaksi kecil ke besar)
  const paged = React.useMemo(() => {
    return [...pagedRaw].sort((a, b) => {
      const tglA = new Date(a.tanggal);
      const tglB = new Date(b.tanggal);
      // Tanggal ascending (lama dulu)
      if (tglA < tglB) return -1;
      if (tglA > tglB) return 1;
      // Jika tanggal sama, urutkan berdasarkan ID ascending
      return a.id - b.id;
    });
  }, [pagedRaw]);

  const handlePrint = () => {
    window.print();
  };

  // Ambil saldoAwal dari master COA sesuai selectedCOA
  const masterSaldoAwal = React.useMemo(() => {
    const coa = coaList.find(coa => String(coa.id) === String(selectedCOA));
    return coa && coa.saldoAwal ? Number(coa.saldoAwal) : 0;
  }, [coaList, selectedCOA]);

  // Hitung saldo awal untuk page yang sedang ditampilkan
  const saldoAwalPage = React.useMemo(() => {
    if (!filtered.length) return masterSaldoAwal;

    // Urutkan semua data secara chronological (lama ke baru)
    const chronologicalAll = [...filtered].sort((a, b) => {
      const tglA = new Date(a.tanggal);
      const tglB = new Date(b.tanggal);
      if (tglA < tglB) return -1;
      if (tglA > tglB) return 1;
      return a.id - b.id;
    });

    // Untuk page 1: hitung saldo sampai transaksi yang tidak ditampilkan di page 1
    // Page 1 menampilkan transaksi terbaru, jadi transaksi yang tidak ditampilkan adalah transaksi lama
    const totalTransaksi = sortedFiltered.length;
    const transaksiBelumDitampilkan = totalTransaksi - (page * rowsPerPage);
    
    if (transaksiBelumDitampilkan <= 0) {
      // Jika semua transaksi sudah ditampilkan, gunakan saldo awal master
      return masterSaldoAwal;
    }

    // Hitung saldo sampai transaksi yang belum ditampilkan
    let saldo = masterSaldoAwal;
    for (let i = 0; i < transaksiBelumDitampilkan; i++) {
      const row = chronologicalAll[i];
      saldo += (row.debit || 0) - (row.kredit || 0);
    }

    return saldo;
  }, [filtered, masterSaldoAwal, page, rowsPerPage, sortedFiltered]);

  // Hitung running balance untuk transaksi yang ditampilkan di page ini
  const calculateBalances = React.useMemo(() => {
    let running = saldoAwalPage;
    const balanceMap = {};
    
    // Urutkan paged data secara chronological untuk perhitungan balance
    const chronologicalPaged = [...paged].sort((a, b) => {
      const tglA = new Date(a.tanggal);
      const tglB = new Date(b.tanggal);
      if (tglA < tglB) return -1;
      if (tglA > tglB) return 1;
      return a.id - b.id;
    });

    chronologicalPaged.forEach((row) => {
      running += (row.debit || 0) - (row.kredit || 0);
      balanceMap[row.id] = running;
    });
    
    return balanceMap;
  }, [paged, saldoAwalPage]);

  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">
          Data Transaksi{selectedCOA ? ` - ${getCoaName(selectedCOA)}` : ""}
        </h2>
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
          💡 Double-click row untuk edit transaksi
        </div>
      </div>
      {selectedCOA ? (
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
      ) : (
        <div className="text-center text-gray-500 mb-4 p-4 bg-gray-50 rounded">
          Pilih COA Akun Bank dari form di atas untuk melihat data transaksi
        </div>
      )}
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
              <th className="p-2 border">Balance</th>
              <th className="p-2 border">Deskripsi</th>
              <th className="p-2 border">Nomor Transaksi</th>
            </tr>
          </thead>
          <tbody>
            {/* Row saldo awal - hanya tampil jika COA sudah dipilih */}
            {selectedCOA && (
              <tr className="bg-yellow-50 font-semibold sticky top-0 z-10">
                <td className="p-2 border text-center" colSpan={8}>
                  Saldo Awal
                </td>
                <td className="p-2 border text-right">
                  {saldoAwalPage.toLocaleString()}
                </td>
                <td className="p-2 border" colSpan={2}></td>
              </tr>
            )}
            {/* Data transaksi */}
            {!selectedCOA ? (
              <tr>
                <td colSpan={11} className="text-center p-8 text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-4xl">📋</div>
                    <div className="font-medium">Pilih COA Akun Bank</div>
                    <div className="text-sm">Silakan pilih COA Akun Bank terlebih dahulu untuk melihat data transaksi</div>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4 text-gray-400">
                  Tidak ada data transaksi untuk COA yang dipilih
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                // Hitung nomor urut berdasarkan urutan chronological global
                const chronologicalFiltered = [...filtered].sort((a, b) => {
                  const tglA = new Date(a.tanggal);
                  const tglB = new Date(b.tanggal);
                  if (tglA < tglB) return -1;
                  if (tglA > tglB) return 1;
                  return a.id - b.id;
                });
                
                const globalIndex = chronologicalFiltered.findIndex(item => item.id === row.id);
                const globalNo = globalIndex + 1;
                
                return (
                <tr 
                  key={row.id} 
                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                  onDoubleClick={() => {
                    console.log("Row double clicked:", row);
                    console.log("onRowDoubleClick handler:", onRowDoubleClick);
                    if (onRowDoubleClick) {
                      onRowDoubleClick(row);
                    } else {
                      console.log("No onRowDoubleClick handler provided");
                    }
                  }}
                  title="Double-click untuk edit transaksi"
                >
                  <td className="p-2 border">{globalNo}</td>
                  <td className="p-2 border">{getCoaName(row.coaAkunBank)}</td>
                  <td className="p-2 border">{formatDateDMY(row.tanggal)}</td>
                  <td className="p-2 border">{getAkunTransaksiName(row.akunTransaksi)}</td>
                  <td className="p-2 border">{row.projectNo}</td>
                  <td className="p-2 border">{row.projectName}</td>
                  <td className="p-2 border text-right">{row.debit?.toLocaleString()}</td>
                  <td className="p-2 border text-right">{row.kredit?.toLocaleString()}</td>
                  <td className="p-2 border text-right">{calculateBalances[row.id]?.toLocaleString()}</td>
                  <td className="p-2 border">{row.deskripsi}</td>
                  <td className="p-2 border">{row.noTransaksi}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {selectedCOA && paged.length > 0 && (
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
      )}
    </div>
  );
}

