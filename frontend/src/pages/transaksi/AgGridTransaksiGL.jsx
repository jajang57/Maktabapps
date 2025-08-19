import React, { useEffect, useState } from "react";
import { useTheme } from "../../context/ThemeContext"; // tambahkan ini
import api from "../../utils/api";
import { Box, Button, Typography } from "@mui/material";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import SimpleDropdownFilterButton from "./SimpleDropdownFilterButton";
import TanggalDropdownCustomButton from "./TanggalDropdownCustomButton";

export default function AgGridTransaksiGL() {
  const { theme } = useTheme(); // gunakan theme
  const [rowData, setRows] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [tanggalFilter, setTanggalFilter] = useState([]);
  const [akunFilter, setAkunFilter] = useState([]);
  const [deskripsiFilter, setDeskripsiFilter] = useState("");
  const [noTransaksiFilter, setNoTransaksiFilter] = useState("");
  const [projectNoFilter, setProjectNoFilter] = useState("");
  const [projectNameFilter, setProjectNameFilter] = useState("");

  // Ambil master COA
useEffect(() => {
  api.get('/master-coa').then(res => {
    setMasterCoaList(Array.isArray(res.data) ? res.data : []);
  });
}, []);

  // Ambil data GL
  useEffect(() => {
    api.get("/gl")
      .then((res) => {
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
  
  // Helper mapping kode ke nama COA
  const getAkunTransaksiDisplay = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `(${found.kode}) ${found.nama}` : kode;
  };

  // Format tanggal dd/mm/yyyy
  const formatTanggal = (tgl) => {
    if (!tgl) return "";
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const formattedTanggalFilter = tanggalFilter.map(tgl => {
    if (!tgl) return "";
    const d = new Date(tgl);
    if (isNaN(d.getTime())) return "";
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  });

  // Filter data
  const filteredRows = rowData.filter(row => {
    if (formattedTanggalFilter.length && !formattedTanggalFilter.includes(formatTanggal(row.tanggal))) return false;
    if (akunFilter.length && !akunFilter.includes(row.akunTransaksi)) return false;
    if (deskripsiFilter && !row.deskripsi?.toLowerCase().includes(deskripsiFilter.toLowerCase())) return false;
    if (noTransaksiFilter.length && !noTransaksiFilter.includes(row.nomorTransaksi)) return false;
    if (projectNoFilter && !row.projectNo?.toLowerCase().includes(projectNoFilter.toLowerCase())) return false;
    if (projectNameFilter && !row.projectName?.toLowerCase().includes(projectNameFilter.toLowerCase())) return false;
    return true;
  });

  // Export to Excel
  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    const ws = xlsx.utils.json_to_sheet(filteredRows.map(row => ({
      ...row,
      tanggal: formatTanggal(row.tanggal),
      akunTransaksi: getAkunTransaksiDisplay(row.akunTransaksi),
    })));
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "TransaksiGL");
    xlsx.writeFile(wb, "TransaksiGL.xlsx");
  };

  // Print Table
  const handlePrint = () => {
    window.print();
  };

  const handleResetFilter = () => {
    setTanggalFilter([]);
    setAkunFilter([]);
    setDeskripsiFilter("");
    setNoTransaksiFilter([]);
    setProjectNoFilter("");
    setProjectNameFilter("");
  };

  return (
    <Box
      sx={{
        p: 2,
        background: theme.cardColor,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
        borderRadius: 2,
        boxShadow: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: { md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          sx={{
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
          }}
        >
          General Ledger (GL)
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            onClick={handlePrint}
            variant="contained"
            startIcon={<FiPrinter />}
            sx={{
              background: theme.buttonSimpan,
              color: "#fff",
              fontFamily: theme.fontFamily,
              "&:hover": { background: theme.buttonEdit },
            }}
          >
            Print
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="contained"
            startIcon={<FaFileExcel />}
            sx={{
              background: theme.buttonEdit,
              color: "#fff",
              fontFamily: theme.fontFamily,
              "&:hover": { background: theme.buttonSimpan },
            }}
          >
            Excel
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
        <span style={{ fontSize: 14, color: theme.fontColor, fontFamily: theme.fontFamily }}>Filter Aktif:</span>
        {tanggalFilter.length > 0 && tanggalFilter.map(val => (
          <span key={val} className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {val} <span style={{ cursor: "pointer" }} onClick={() => setTanggalFilter(tanggalFilter.filter(t => t !== val))}>×</span>
          </span>
        ))}
        {akunFilter.length > 0 && akunFilter.map(val => {
          const label = masterCoaList.find(coa => String(coa.kode) === String(val));
          return (
            <span key={val} className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
              {label ? label.nama : val} <span style={{ cursor: "pointer" }} onClick={() => setAkunFilter(akunFilter.filter(a => a !== val))}>×</span>
            </span>
          );
        })}
        {deskripsiFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {deskripsiFilter} <span style={{ cursor: "pointer" }} onClick={() => setDeskripsiFilter("")}>×</span>
          </span>
        )}
        {noTransaksiFilter.length > 0 && noTransaksiFilter.map(val => (
          <span key={val} className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {val} <span style={{ cursor: "pointer" }} onClick={() => setNoTransaksiFilter(noTransaksiFilter.filter(no => no !== val))}>×</span>
          </span>
        ))}
        {projectNoFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {projectNoFilter} <span style={{ cursor: "pointer" }} onClick={() => setProjectNoFilter("")}>×</span>
          </span>
        )}
        {projectNameFilter && (
          <span className="bg-blue-100 text-blue-700 rounded px-2 py-1 mr-1" style={{ fontSize: 13 }}>
            {projectNameFilter} <span style={{ cursor: "pointer" }} onClick={() => setProjectNameFilter("")}>×</span>
          </span>
        )}
        <Button
          variant="outlined"
          size="small"
          sx={{
            ml: 1,
            fontSize: 13,
            minWidth: 0,
            px: 1,
            py: 0.5,
            color: theme.fontColor,
            borderColor: theme.buttonEdit,
            fontFamily: theme.fontFamily,
          }}
          onClick={handleResetFilter}
        >
          RESET FILTER
        </Button>
      </Box>
      <div style={{ overflowX: "auto" }}>
        <table
          className="min-w-full border text-sm"
          style={{
            fontFamily: theme.tableFontFamily,
            background: theme.cardColor,
            color: theme.tableFontColor,
          }}
        >
          <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
            <tr>
              <th className="border px-2 py-1" style={{ minWidth: 60 }}>No</th>
              <th className="border px-2 py-1" style={{ position: 'relative', minWidth: 120 }}>
                Tanggal
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <TanggalDropdownCustomButton
                    rows={rowData}
                    value={tanggalFilter}
                    onChange={setTanggalFilter}
                  />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ position: 'relative', minWidth: 220 }}>
                Akun Transaksi
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={
                      masterCoaList
                        .sort((a, b) => a.kode.localeCompare(b.kode))
                        .map(coa => ({
                          label: `(${coa.kode}) ${coa.nama}`,
                          value: coa.kode
                        }))
                    }
                    value={akunFilter}
                    onChange={setAkunFilter}
                    placeholder="Cari Akun"
                    iconTitle="Filter Nama Akun"
                    dropdownStyle={{ minWidth: 400 }}
                  />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ minWidth: 200 }}>
                Deskripsi
                <div>
                  <input
                    type="text"
                    value={deskripsiFilter}
                    onChange={e => setDeskripsiFilter(e.target.value)}
                    placeholder="Cari Deskripsi"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
              <th className="border px-2 py-1" style={{ minWidth: 120 }}>Debit</th>
              <th className="border px-2 py-1" style={{ minWidth: 120 }}>Kredit</th>
              <th className="border px-2 py-1" style={{ position: 'relative', minWidth: 160 }}>
                Nomor Transaksi
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={
                      Array.from(new Set(rowData.map(row => row.nomorTransaksi)))
                        .filter(Boolean)
                        .sort()
                        .map(no => ({ label: no, value: no }))
                    }
                    value={noTransaksiFilter}
                    onChange={setNoTransaksiFilter}
                    placeholder="Cari No. Transaksi"
                    iconTitle="Filter Nomor Transaksi"
                    dropdownStyle={{ minWidth: 220 }}
                  />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ minWidth: 120 }}>
                Project No
                <div>
                  <input
                    type="text"
                    value={projectNoFilter}
                    onChange={e => setProjectNoFilter(e.target.value)}
                    placeholder="Cari Project No"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
              <th className="border px-2 py-1" style={{ minWidth: 160 }}>
                Project Name
                <div>
                  <input
                    type="text"
                    value={projectNameFilter}
                    onChange={e => setProjectNameFilter(e.target.value)}
                    placeholder="Cari Project Name"
                    className="border rounded px-1 py-0.5 w-full mt-1"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={row.id} style={{ background: theme.tableBodyColor, color: theme.tableFontColor, fontFamily: theme.tableFontFamily }}>
                <td className="border px-2 py-1">{idx + 1}</td>
                <td className="border px-2 py-1">{formatTanggal(row.tanggal)}</td>
                <td className="border px-2 py-1">{getAkunTransaksiDisplay(row.akunTransaksi)}</td>
                <td className="border px-2 py-1">{row.deskripsi}</td>
                <td className="border px-2 py-1" style={{ textAlign: "right" }}>
                  {row.debit !== "" ? Number(row.debit).toLocaleString("id-ID", { minimumFractionDigits: 2 }) : ""}
                </td>
                <td className="border px-2 py-1" style={{ textAlign: "right" }}>
                  {row.kredit !== "" ? Number(row.kredit).toLocaleString("id-ID", { minimumFractionDigits: 2 }) : ""}
                </td>
                <td className="border px-2 py-1">{row.nomorTransaksi}</td>
                <td className="border px-2 py-1">{row.projectNo}</td>
                <td className="border px-2 py-1">{row.projectName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Box>
  );
}
