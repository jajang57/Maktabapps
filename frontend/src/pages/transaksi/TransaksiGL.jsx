import { useState, useEffect } from "react";
import { DataGrid } from "@mui/x-data-grid";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { Box, Button, Typography } from "@mui/material";

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
  const [rows, setRows] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [filterModel, setFilterModel] = useState({ items: [] });

  // Ambil master COA
  useEffect(() => {
    api.get("/master-coa").then(res => {
      setMasterCoaList(res.data || []);
    });
  }, []);

  // Helper mapping kode ke nama COA
  const getCoaBankDisplay = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `${found.kode} - ${found.nama}` : kode;
  };
  const getAkunTransaksiDisplay = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `(${found.kode}) ${found.nama}` : kode;
  };

  // Ambil data GL
  useEffect(() => {
    api.get("/gl")
      .then((res) => {
        const mapped = (res.data || [])
          .filter(row => row && typeof row === "object")
          .map((row, idx) => ({
            id: idx + 1,
            tanggal: row.tanggal || row.Tanggal || "",
            coaAkunBank: row.coaAkunBank || row.coa_akun_bank || "",
            akunTransaksi: row.akunTransaksi || row.akun_transaksi || "",
            deskripsi: row.deskripsi || "",
            debit: row.debit ?? "",
            kredit: row.kredit ?? "",
            balance: row.balance ?? "",
            nomorTransaksi: row.nomorTransaksi || row.no_transaksi || "",
            projectNo: row.projectNo || row.project_no || "",
            projectName: row.projectName || row.project_name || "",
          }));
        console.log("GL mapped rows", mapped);
        setRows(mapped);
      })
      .catch(() => {});
  }, []);

  // Kolom DataGrid
  const columns = [
    { field: "id", headerName: "No", width: 60 },
    { 
      field: "tanggal", 
      headerName: "Tanggal", 
      width: 110, 
      renderCell: (params) => formatDateDMY(params.value)
    },
    { 
      field: "coaAkunBank", 
      headerName: "COA Akun Bank", 
      width: 170, 
      renderCell: (params) => getCoaBankDisplay(params.value),
      hide: true // sembunyikan kolom ini
    },
    { 
      field: "akunTransaksi", 
      headerName: "Akun Transaksi", 
      width: 170, 
      renderCell: (params) => getAkunTransaksiDisplay(params.value)
    },
    { 
      field: "deskripsi", 
      headerName: "Deskripsi", 
      width: 600, // Lebar bisa diubah sesuai kebutuhan
      getCellClassName: () => "wrap-text-cell"
    },
    { 
      field: "debit", 
      headerName: "Debit", 
      width: 110, 
      type: "number", 
      renderCell: (params) => formatNumber(params.value)
    },
    { 
      field: "kredit", 
      headerName: "Kredit", 
      width: 110, 
      type: "number", 
      renderCell: (params) => formatNumber(params.value)
    },
    { 
      field: "balance", 
      headerName: "Balance", 
      width: 110, 
      type: "number", 
      renderCell: (params) => formatNumber(params.value),
      hide: true // sembunyikan kolom ini
    },
    { field: "nomorTransaksi", headerName: "Nomor Transaksi", width: 180 },
    { field: "projectNo", headerName: "Project No", width: 120 },
    { field: "projectName", headerName: "Project Name", width: 160 },
  ];

  const [columnVisibilityModel, setColumnVisibilityModel] = useState({
  coaAkunBank: false,
  balance: false,
});

  // Export to Excel
  const handleExportExcel = () => {
    import("xlsx").then((xlsx) => {
      const ws = xlsx.utils.json_to_sheet(rows);
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, "TransaksiGL");
      xlsx.writeFile(wb, "TransaksiGL.xlsx");
    });
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };
  

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, alignItems: { md: "center" }, justifyContent: "space-between", gap: 2, mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">General Ledger (GL)</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={handlePrint}
            variant="contained"
            color="primary"
            startIcon={<FiPrinter />}
          >
            Print
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="contained"
            color="success"
            startIcon={<FaFileExcel />}
          >
            Excel
          </Button>
        </Box>
      </Box>
      <div style={{ height: "100%", width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={setColumnVisibilityModel}
          disableRowSelectionOnClick
          sx={{
            background: "#fff",
            borderRadius: 2,
            boxShadow: 2,
            "& .MuiDataGrid-columnHeaders": { background: "#e0e7ff" },
            "& .wrap-text-cell": {
              whiteSpace: "normal",
              wordBreak: "break-word",
              lineHeight: 1.4,
              display: "block",
              overflowWrap: "break-word",
            },
          }}
          pagination={false} // hilangkan paging
          hideFooterPagination // hilangkan footer paging
        />
      </div>
    </Box>
  );
}
