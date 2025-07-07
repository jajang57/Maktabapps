
import { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";

// Format tanggal ke dd-mm-yyyy
function formatDateDMY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Format angka ribuan
function formatNumber(num) {
  if (!num || isNaN(num)) return "-";
  return Number(num).toLocaleString();
}


export default function TransaksiGL() {
  const [data, setData] = useState([]);
  const [filterText, setFilterText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const tableRef = useRef();

  // Ambil master COA
  useEffect(() => {
    api.get("/master-coa").then(res => {
      setMasterCoaList(res.data || []);
    });
  }, []);

  // Helper mapping kode ke nama COA

  // Format COA Akun Bank: kode - nama
  const getCoaBankDisplay = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `${found.kode} - ${found.nama}` : kode;
  };
  // Format Akun Transaksi: (kode) nama
  const getAkunTransaksiDisplay = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `(${found.kode}) ${found.nama}` : kode;
  };

  // Kolom DataTable
  const columns = [
    { name: "No", selector: (row, i) => i + 1, width: "60px", sortable: false },
    { name: "Tanggal", selector: (row) => formatDateDMY(row.tanggal), sortable: true },
    { name: "COA Akun Bank", selector: (row) => getCoaBankDisplay(row.coaAkunBank), sortable: true },
    { name: "Akun Transaksi", selector: (row) => getAkunTransaksiDisplay(row.akunTransaksi), sortable: true },
    { name: "Deskripsi", selector: (row) => row.deskripsi, sortable: true },
    { name: "Debit", selector: (row) => formatNumber(row.debit), sortable: true, right: true },
    { name: "Kredit", selector: (row) => formatNumber(row.kredit), sortable: true, right: true },
    { name: "Balance", selector: (row) => formatNumber(row.balance), sortable: true, right: true },
    { name: "Nomor Transaksi", selector: (row) => row.nomorTransaksi, sortable: true },
    { name: "Project No", selector: (row) => row.projectNo, sortable: true },
    { name: "Project Name", selector: (row) => row.projectName, sortable: true },
  ];


  useEffect(() => {
    api.get("/gl")
      .then((res) => {
        setData(res.data);
        setFilteredData(res.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setFilteredData(
      data.filter(
        (row) =>
          (row.tanggal || "").toLowerCase().includes(filterText) ||
          getCoaNamaOnly(row.coaAkunBank).toLowerCase().includes(filterText) ||
          getCoaNamaOnly(row.akunTransaksi).toLowerCase().includes(filterText) ||
          (row.deskripsi || "").toLowerCase().includes(filterText) ||
          (row.nomorTransaksi || "").toLowerCase().includes(filterText) ||
          (row.projectNo || "").toLowerCase().includes(filterText) ||
          (row.projectName || "").toLowerCase().includes(filterText)
      )
    );
  }, [filterText, data, masterCoaList]);

  // Export to Excel
  const handleExportExcel = () => {
    import("xlsx").then((xlsx) => {
      const ws = xlsx.utils.json_to_sheet(filteredData);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "TransaksiGL");
      xlsx.writeFile(wb, "TransaksiGL.xlsx");
    });
  };

  // Print Table
  const handlePrint = () => {
    const printContent = tableRef.current.innerHTML;
    const win = window.open("", "", "width=900,height=700");
    win.document.write(`
      <html><head><title>Print GL</title>
      <style>
        body { font-family: Arial; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 6px; }
        th { background: #e0e7ff; }
      </style>
      </head><body>${printContent}</body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h1 className="text-xl font-bold tracking-tight">General Ledger (GL)</h1>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
          >
            <FiPrinter /> Print
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <FaFileExcel /> Excel
          </button>
        </div>
      </div>
      <div className="mb-2">
        <input
          type="text"
          placeholder="Cari transaksi..."
          className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value.toLowerCase())}
        />
      </div>
      <div ref={tableRef} className="bg-white rounded-xl shadow overflow-x-auto">
        <DataTable
          columns={columns}
          data={filteredData}
          pagination
          highlightOnHover
          responsive
          striped
          persistTableHead
          customStyles={{
            headRow: { style: { background: "#e0e7ff" } },
          }}
        />
      </div>
    </div>
  );
}
