import React, { useEffect, useMemo, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import api from "../../utils/api";
import { Box, Button, Typography } from "@mui/material";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";

// Modular ag-grid imports (community & enterprise)
import { ModuleRegistry } from 'ag-grid-community';
import { ClientSideRowModelModule } from 'ag-grid-community';
import { CsvExportModule } from 'ag-grid-community';
import { ExcelExportModule } from 'ag-grid-enterprise';
import { SetFilterModule } from 'ag-grid-enterprise';
import { MasterDetailModule } from 'ag-grid-enterprise';

// Register only the modules needed globally (for features like export, filter, etc)
ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  CsvExportModule,
  ExcelExportModule,
  SetFilterModule,
  MasterDetailModule,
]);

export default function AgGridTransaksiGL() {
  const [rowData, setRows] = useState([]);
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
  
  const columnDefs = [
    { headerName: "No", field: "id", width: 60, filter: false },
    {
      headerName: "Tanggal",
      field: "tanggal",
      width: 140,
      
    },
    {
      field: "akunTransaksi",
      headerName: "Akun Transaksi",
      width: 170,
      cellRenderer: (params) => getAkunTransaksiDisplay(params.value),
      filter: 'agSetColumnFilter',
      filterParams: {
        valueFormatter: (params) => getAkunTransaksiDisplay(params.value),
        keyCreator: (params) => params.value,
      },
      valueFormatter: (params) => getAkunTransaksiDisplay(params.value),
    },
    {
      headerName: "Deskripsi",
      field: "deskripsi",
      width: 300
    },
    {
      headerName: "Debit",
      field: "debit",
      width: 120,
      valueFormatter: p => p.value ? Number(p.value).toLocaleString() : "-",
    },
    {
      headerName: "Kredit",
      field: "kredit",
      width: 120,
      valueFormatter: p => p.value ? Number(p.value).toLocaleString() : "-",
    },
    {
      headerName: "Nomor Transaksi",
      field: "nomorTransaksi",
      width: 180,
      
    },
    { headerName: "Project No", field: "projectNo", width: 120 },
    { headerName: "Project Name", field: "projectName", width: 160 },
  ];

  // Export to Excel
  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(rowData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "TransaksiGL");
    xlsx.writeFile(wb, "TransaksiGL.xlsx");
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
      <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
        <AgGridReact
          modules={[ClientSideRowModelModule, CsvExportModule, ExcelExportModule, SetFilterModule, MasterDetailModule]}
          rowData={rowData}
          columnDefs={columnDefs}
          domLayout="autoHeight"
          animateRows
          suppressRowClickSelection
          pagination={false}
          sideBar={{
            toolPanels: [
              {
                id: 'filters',
                labelDefault: 'Filter',
                labelKey: 'filter',
                iconKey: 'filter',
                toolPanel: 'agFiltersToolPanel',
                minWidth: 350,
                maxWidth: 500,
                width: 380
              }
            ],
            defaultToolPanel: 'filters',
            position: 'right',
          }}
          defaultColDef={{
            filter: true,
            floatingFilter: false,
            resizable: true,
          }}
        />
      </div>
    </Box>
  );
}
