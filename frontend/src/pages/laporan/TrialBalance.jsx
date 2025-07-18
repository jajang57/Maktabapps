import React, { useRef, useState, useEffect } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, Select, MenuItem, Grid } from "@mui/material";
import api from "../../utils/api"; // Pastikan path sesuai project kamu

// Nama bulan dan key untuk looping
const months = [
  { name: "Januari", key: "jan" },
  { name: "Februari", key: "feb" },
  { name: "Maret", key: "mar" },
  { name: "April", key: "apr" },
  { name: "Mei", key: "mei" },
  { name: "Juni", key: "jun" },
  { name: "Juli", key: "jul" },
  { name: "Agustus", key: "ags" },
  { name: "September", key: "sep" },
  { name: "Oktober", key: "okt" },
  { name: "November", key: "nov" },
  { name: "Desember", key: "des" },
];

// Dummy tahun, bisa diganti sesuai kebutuhan
const years = [2023, 2024, 2025];

// Format angka ribuan
function formatNumber(num) {
  if (!num || isNaN(num)) return "-";
  const n = Number(num);
  if (n < 0) {
    return `(${Math.abs(n).toLocaleString()})`;
  }
  return n.toLocaleString();
}

export default function TrialBalance() {
  // State untuk filter bulan dan tahun
  const [startMonth, setStartMonth] = useState(months[0].key);
  const [endMonth, setEndMonth] = useState(months[0].key);
  const [year, setYear] = useState(years[years.length - 1]);

  // State untuk data COA dari API
  const [coaData, setCoaData] = useState([]);
  const [error, setError] = useState("");

  // Ambil data master COA dari API saat mount
  useEffect(() => {
    setError("");
    api.get("/trial-balance", {
      params: {
        tahun: year,
        bulan_awal: months.findIndex(m => m.key === startMonth) + 1,
        bulan_akhir: months.findIndex(m => m.key === endMonth) + 1
      }
    })
      .then(res => setCoaData(res.data))
      .catch(() => setError("Gagal mengambil data Trial Balance"));
  }, [year, startMonth, endMonth]);

  // Filter bulan yang dipilih
  const startIdx = months.findIndex(m => m.key === startMonth);
  const endIdx = months.findIndex(m => m.key === endMonth);
  const filteredMonths = startIdx <= endIdx ? months.slice(startIdx, endIdx + 1) : [];

  // State untuk lebar kolom (default: 180px untuk kolom pertama, 120px untuk lainnya)
  const [colWidths, setColWidths] = useState({
    akun: 180,
    saldo: 120,
    ...Object.fromEntries(months.flatMap(m => [
      [`${m.key}_debit`, 120],
      [`${m.key}_kredit`, 120],
      [`${m.key}_mutasi`, 120],
      [`${m.key}_balance`, 120],
    ]))
  });

  // Fungsi untuk drag resize kolom
  const resizingRef = useRef({ col: null, startX: 0, startWidth: 0 });

  const handleResizeMouseDown = (colKey, e) => {
    e.preventDefault();
    resizingRef.current = {
      col: colKey,
      startX: e.clientX,
      startWidth: colWidths[colKey]
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", handleResizeMouseMove);
    window.addEventListener("mouseup", handleResizeMouseUp);
  };

  const handleResizeMouseMove = (e) => {
    const { col, startX, startWidth } = resizingRef.current;
    if (!col) return;
    const delta = e.clientX - startX;
    setColWidths(prev => ({
      ...prev,
      [col]: Math.max(60, startWidth + delta)
    }));
  };

  const handleResizeMouseUp = () => {
    resizingRef.current = { col: null, startX: 0, startWidth: 0 };
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", handleResizeMouseMove);
    window.removeEventListener("mouseup", handleResizeMouseUp);
  };

  // Ref dan fungsi drag scroll
  const tableRef = useRef(null);
  let isDown = false;
  let startX;
  let scrollLeft;

  const handleMouseDown = (e) => {
    isDown = true;
    startX = e.pageX - tableRef.current.offsetLeft;
    scrollLeft = tableRef.current.scrollLeft;
    tableRef.current.classList.add("dragging");
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    const x = e.pageX - tableRef.current.offsetLeft;
    const walk = (x - startX);
    tableRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    isDown = false;
    tableRef.current.classList.remove("dragging");
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  // Sticky style untuk kolom 1 saja
  const stickyCell1 = {
    position: "sticky",
    left: 0,
    background: "#fff",
    zIndex: 10,
    borderRight: "2px solid #1976d2",
    minWidth: colWidths.akun,
    width: colWidths.akun,
    maxWidth: colWidths.akun,
    boxShadow: "2px 0 8px -4px #1976d2"
  };
  const stickyCell1Body = {
    ...stickyCell1,
    zIndex: 9,
    background: "#fff"
  };

  // Sort data  > kode
  const sortedCoa = [...coaData].sort((a, b) => {
    return a.kode.localeCompare(b.kode);
  });

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, width: "100%", overflowX: "auto", background: "#f9fafb" }}>
      <Typography variant="h5" fontWeight="bold" mb={3} color="#1976d2">Trial Balance</Typography>
      {error && <Box color="error.main" mb={2}>{error}</Box>}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Tahun</InputLabel>
            <Select
              value={year}
              label="Tahun"
              onChange={e => setYear(e.target.value)}
            >
              {years.map(y => (
                <MenuItem key={y} value={y}>{y}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Bulan Awal</InputLabel>
            <Select
              value={startMonth}
              label="Bulan Awal"
              onChange={e => setStartMonth(e.target.value)}
            >
              {months.map(month => (
                <MenuItem key={month.key} value={month.key}>{month.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Bulan Akhir</InputLabel>
            <Select
              value={endMonth}
              label="Bulan Akhir"
              onChange={e => setEndMonth(e.target.value)}
            >
              {months.map((month, idx) => (
                <MenuItem
                  key={month.key}
                  value={month.key}
                  disabled={months.findIndex(m => m.key === month.key) < startIdx}
                >
                  {month.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
      <TableContainer
        component={Paper}
        sx={{
          maxWidth: "100vw",
           maxHeight: 800, // tambahkan ini
    overflowY: "auto", // dan ini
          overflowX: "auto",
          cursor: "grab",
          boxShadow: 3,
          borderRadius: 3,
        }}
        ref={tableRef}
        onMouseDown={handleMouseDown}
      >
        <Table stickyHeader sx={{ minWidth: 900, fontSize: 15 }}>
          <TableHead>
            <TableRow>
              <TableCell
                rowSpan={2}
                sx={{
                  ...stickyCell1,
                  fontWeight: "bold",
                  fontSize: 16,
                  background: "#e3f2fd",
                  color: "#1976d2",
                  borderRight: "2px solid #1976d2",
                  position: "sticky",
                  left: 0,
                  top: 0,
                  zIndex: 12
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                  Akun
                  <span
                    style={{
                      cursor: "col-resize",
                      padding: "0 4px",
                      marginLeft: "auto",
                      userSelect: "none"
                    }}
                    onMouseDown={e => handleResizeMouseDown("akun", e)}
                  >
                    &#8942;
                  </span>
                </Box>
              </TableCell>
              <TableCell
                rowSpan={2}
                align="right"
                sx={{
                  fontWeight: "bold",
                  fontSize: 16,
                  background: "#e3f2fd",
                  color: "#1976d2",
                  minWidth: colWidths.saldo,
                  width: colWidths.saldo,
                  maxWidth: colWidths.saldo,
                  position: "sticky",
                  top: 0,
                  zIndex: 11,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", width: "100%" }}>
                  Saldo Awal
                  <span
                    style={{
                      cursor: "col-resize",
                      padding: "0 4px",
                      marginLeft: "4px",
                      userSelect: "none"
                    }}
                    onMouseDown={e => handleResizeMouseDown("saldo", e)}
                  >
                    &#8942;
                  </span>
                </Box>
              </TableCell>
              {/* Judul bulan */}
              {filteredMonths.map((month, idx) => (
                <TableCell
                  key={month.key}
                  colSpan={4}
                  align="center"
                  sx={{
                    borderRight: idx < filteredMonths.length - 1 ? "3px solid #1976d2" : undefined,
                    fontWeight: "bold",
                    fontSize: 16,
                    background: "#e3f2fd",
                    color: "#1976d2",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  {month.name}
                </TableCell>
              ))}
            </TableRow>
            <TableRow>
              {filteredMonths.map((month, idx) => (
                ["debit", "kredit", "mutasi", "balance"].map((type, i) => (
                  <TableCell
                    key={month.key + "_" + type}
                    align={type === "debit" ? "right" : "center"}
                    sx={{
                      borderRight: (type === "balance" && idx < filteredMonths.length - 1) ? "3px solid #1976d2" : undefined,
                      fontWeight: "bold",
                      fontSize: 16,
                      background: "#e3f2fd",
                      color: "#1976d2",
                      minWidth: colWidths[`${month.key}_${type}`],
                      width: colWidths[`${month.key}_${type}`],
                      maxWidth: colWidths[`${month.key}_${type}`],
                      position: "sticky",
                      top: 56, // tinggi header baris pertama (bisa disesuaikan jika font/table berubah)
                      zIndex: 11,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                      <span
                        style={{
                          cursor: "col-resize",
                          padding: "0 4px",
                          marginLeft: "4px",
                          userSelect: "none"
                        }}
                        onMouseDown={e => handleResizeMouseDown(`${month.key}_${type}`, e)}
                      >
                        &#8942;
                      </span>
                    </Box>
                  </TableCell>
                ))
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedCoa.map(coa => {
              // Tentukan apakah kategori akun 2, 3, atau 4
              const isCreditType = ["2", "3", "4"].includes(String(coa.tipeAkun));
              console.log(coa.TipeAkun, isCreditType);
              return (
                <TableRow key={coa.kode}>
                  <TableCell sx={{ ...stickyCell1Body, pl: 2 }}>
                    {coa.kode} - {coa.nama}
                  </TableCell>
                  <TableCell align="right">{formatNumber(coa.saldoAwal)}</TableCell>
                  {filteredMonths.map((month, idx) => {
                    const debit = coa[`${month.key}_debit`] || 0;
                    const kredit = coa[`${month.key}_kredit`] || 0;

                    // Mutasi: rumus sesuai tipe akun
                    const mutasi = isCreditType ? (kredit - debit) : (debit - kredit);

                    // Hitung balance: saldo awal + akumulasi mutasi sampai bulan ini
                    let totalMutasi = 0;
                    for (let i = startIdx; i <= startIdx + idx; i++) {
                      const mKey = months[i].key;
                      const mDebit = coa[`${mKey}_debit`] || 0;
                      const mKredit = coa[`${mKey}_kredit`] || 0;
                      totalMutasi += isCreditType ? (mKredit - mDebit) : (mDebit - mKredit);
                    }
                    const balance = (coa.saldoAwal || 0) + totalMutasi;

                    return (
                      <React.Fragment key={`${coa.kode}_${month.key}`}>
                        <TableCell align="right">{formatNumber(debit)}</TableCell>
                        <TableCell align="right">{formatNumber(kredit)}</TableCell>
                        <TableCell align="right">{formatNumber(mutasi)}</TableCell>
                        <TableCell align="right">{formatNumber(balance)}</TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <style>
        {`
          .MuiTableContainer-root.dragging {
            cursor: grabbing !important;
            user-select: none;
          }
          .MuiTableCell-root {
            transition: background 0.2s;
          }
        `}
      </style>
    </Box>
  );
}