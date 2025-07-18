import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useState, useEffect, useMemo } from "react";
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
        console.log("GL API DATA", res.data);
        const mapped = (res.data || [])
          .filter(row => row && typeof row === "object")
          .map((row, idx) => {
            // Ambil tanggal dari field dan konversi ke Date
            const rawTanggal = row.tanggal || row.Tanggal || "";
            let tanggalDate = null;
            if (rawTanggal) {
              // Cek format dd-mm-yyyy manual
              const match = rawTanggal.match(/^([0-9]{2})-([0-9]{2})-([0-9]{4})$/);
              if (match) {
                // Format dd-mm-yyyy
                tanggalDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
              } else {
                tanggalDate = new Date(rawTanggal);
              }
            }
            return {
              id: String(idx + 1),
              tanggal: tanggalDate && !isNaN(tanggalDate.getTime()) ? tanggalDate : null,
              coaAkunBank: row.coaAkunBank || row.coa_akun_bank || "",
              akunTransaksi: row.akunTransaksi || row.akun_transaksi || "",
              deskripsi: row.deskripsi || "",
              debit: row.debit ?? "",
              kredit: row.kredit ?? "",
              balance: row.balance ?? "",
              nomorTransaksi: row.nomorTransaksi || row.no_transaksi || "",
              projectNo: row.projectNo || row.project_no || "",
              projectName: row.projectName || row.project_name || "",
            };
          })
          // hanya ambil row dengan tanggal valid (bukan null)
           .sort((a, b) => {
        return a.nomorTransaksi.localeCompare(b.nomorTransaksi);
      })
          .filter(row => row.tanggal);
          
            setRows(mapped);

      })
     
      .catch(() => {});
  }, []);

  // Value options untuk filter dropdown
  const tanggalOptions = useMemo(() => [...new Set(rows.map(row => row.tanggal || ""))].filter(Boolean), [rows]);
  const akunTransaksiOptions = useMemo(() => [...new Set(rows.map(row => row.akunTransaksi || ""))].filter(Boolean), [rows]);
  const deskripsiOptions = useMemo(() => [...new Set(rows.map(row => row.deskripsi || ""))].filter(Boolean), [rows]);
  const nomorTransaksiOptions = useMemo(() => [...new Set(rows.map(row => row.nomorTransaksi || ""))].filter(Boolean), [rows]);

  // Kolom DataGrid
  const columns = [
    { field: "id", headerName: "No", width: 80 },
    {
      field: "tanggal",
      headerName: "Tanggal",
      width: 120,
      type: "date",
     
      renderCell: (params) => {
        if (!params || !params.value) return "-";
        let d = new Date(params.value);
        if (isNaN(d.getTime()) && typeof params.value === 'string') {
          const match = params.value.match(/(\d{4}-\d{2}-\d{2})/);
          if (match) d = new Date(match[1]);
        }
        if (isNaN(d.getTime())) return String(params.value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear(); // 4 digit
        return `${day}-${month}-${year}`;
      },
      valueFormatter: (params) => {
        if (!params || !params.value) return "-";
        let d = new Date(params.value);
        if (isNaN(d.getTime()) && typeof params.value === 'string') {
          const match = params.value.match(/(\d{4}-\d{2}-\d{2})/);
          if (match) d = new Date(match[1]);
        }
        if (isNaN(d.getTime())) return String(params.value);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear(); // 4 digit
        return `${day}-${month}-${year}`;
      },
      filterOperators: [
        {
          label: 'Between',
          value: 'isBetween',
          getApplyFilterFn: (filterItem) => {
            if (!filterItem.value || (!filterItem.value[0] && !filterItem.value[1])) return null;
            const [start, end] = filterItem.value;
            // Only compare date part (YYYY-MM-DD)
            
            const startStr = start ?  new Date(start).toLocaleDateString('en-CA') : null;
            console.log("Filter dates:", startStr, start);
           
            const endStr = end ? new Date(end).toLocaleDateString('en-CA') : null;
            // console.log("Filter dates:", startStr, endStr);
            return (params) => {
              //console.log("Checking row date:", params);
              
              let d = params;
              //console.log("Row date value:", d);
              if (!(d instanceof Date)) d = new Date(d);
              if (!(d instanceof Date) || isNaN(d.getTime())) return false;
              const rowDateStr = d.toISOString().slice(0,10);
              //console.log("Row date:", rowDateStr);
              if (startStr && endStr) {
                return rowDateStr >= startStr && rowDateStr <= endStr;
              } else if (startStr) {
                return rowDateStr >= startStr;
              } else if (endStr) {
                return rowDateStr <= endStr;
              }
              return true;
            };
          },
          InputComponent: (props) => {
            // Gunakan react-datepicker agar bisa placeholder custom
            const { item, applyValue } = props;
            return (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <DatePicker
                  selected={item.value && item.value[0] ? item.value[0] : null}
                  onChange={date => {
                    const newValue = [date, item.value ? item.value[1] : null];
                    applyValue({ ...item, value: newValue });
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  isClearable
                  customInput={<input style={{ width: 120 }} />}
                />
                <span style={{ margin: '0 4px' }}>s/d</span>
                <DatePicker
                  selected={item.value && item.value[1] ? item.value[1] : null}
                  onChange={date => {
                    const newValue = [item.value ? item.value[0] : null, date];
                    applyValue({ ...item, value: newValue });
                  }}
                  dateFormat="dd/MM/yyyy"
                  placeholderText="dd/mm/yyyy"
                  isClearable
                  customInput={<input style={{ width: 120 }} />}
                />
              </div>
            );
          },
        },
      ],
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
      renderCell: (params) => getAkunTransaksiDisplay(params.value),
      type: "singleSelect",
      valueOptions: akunTransaksiOptions
    },
    {
      field: "deskripsi",
      headerName: "Deskripsi",
      width: 600,
      getCellClassName: () => "wrap-text-cell",
      type: "singleSelect",
      valueOptions: deskripsiOptions
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
    {
      field: "nomorTransaksi",
      headerName: "Nomor Transaksi",
      width: 180,
      type: "singleSelect",
      valueOptions: nomorTransaksiOptions
    },
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
  

  // Debug: log rows and columns before rendering DataGrid
  //console.log('[RENDER] rows:', rows);
  //console.log('[RENDER] columns:', columns);
  // Handler baru untuk log perubahan filterModel
  const handleFilterModelChange = (model) => {
    console.log("[DEBUG] filterModel changed:", model);
    setFilterModel(model);
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
          onFilterModelChange={handleFilterModelChange}
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
