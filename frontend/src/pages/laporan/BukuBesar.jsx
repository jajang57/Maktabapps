import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
} from "@mui/material";
import api from "../../utils/api";
import { FiPrinter } from "react-icons/fi";
import { FaFileExcel } from "react-icons/fa";
import { AiFillFilePdf } from "react-icons/ai";

function formatNumber(num) {
  if (!num || isNaN(num)) return "-";
  const n = Number(num);
  if (n < 0) {
    return `(${Math.abs(n).toLocaleString()})`;
  }
  return n.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export default function BukuBesar() {
  const [coaList, setCoaList] = useState([]);
  const [selectedCoa, setSelectedCoa] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const printRef = useRef();

  // Export ke PDF dengan jsPDF + autoTable
  const handleExportPDF = async () => {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    const doc = new jsPDF('p', 'mm', 'a4');
    // Judul dan info filter (center)
    doc.setFontSize(16);
    doc.text("Laporan Buku Besar", 105, 18, { align: 'center' });
    doc.setFontSize(11);
    let y = 26;
    const periodeText = `Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`;
    doc.text(periodeText, 105, y, { align: 'center' });
    const coaLabel = selectedCoa
      ? (coaList.find(c => c.kode === selectedCoa)?.nama ? `${selectedCoa} - ${coaList.find(c => c.kode === selectedCoa)?.nama}` : selectedCoa)
      : 'Semua Akun';
    doc.text(`Akun: ${coaLabel}`, 105, y + 7, { align: 'center' });

    // Data untuk tabel
    const tableData = [
      [
        'Tanggal',
        'Nomor Transaksi',
        'Deskripsi',
        'Debit',
        'Kredit',
        'Saldo',
      ],
      ...data.map(row => [
        formatDate(row.tanggal),
        row.nomorTransaksi,
        row.deskripsi,
        formatNumber(row.debit),
        formatNumber(row.kredit),
        formatNumber(row.saldo),
      ])
    ];

    // Baris saldo awal
    if (data.length > 0) {
      tableData.splice(1, 0, [
        'Saldo Awal', '', '',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0),
        '-',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)
      ]);
    }

    autoTable(doc, {
      startY: y + 14,
      head: [tableData[0]],
      body: tableData.slice(1),
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 136, 229] },
      margin: { left: 8, right: 8 },
    });
    doc.save("BukuBesar.pdf");
  };

  // Ambil daftar COA
  useEffect(() => {
    api.get("/master-coa").then(res => setCoaList(res.data || []));
  }, []);

  // Ambil data buku besar
  const fetchData = () => {
    setLoading(true);
    setError("");
    api.get("/buku-besar", {
      params: {
        coa: selectedCoa,
        tanggal_awal: startDate,
        tanggal_akhir: endDate,
      },
    })
      .then(res => setData(res.data || []))
      .catch(() => setError("Gagal mengambil data Buku Besar"))
      .finally(() => setLoading(false));
  };

  // Export ke Excel
  const handleExportExcel = async () => {
    const xlsx = await import("xlsx");
    // Header dan data
    const wsData = [];
    // Judul (center merge)
    wsData.push(["Laporan Buku Besar", '', '', '', '', '']);
    wsData.push([`Periode: ${startDate ? formatDate(startDate) : '-'} s/d ${endDate ? formatDate(endDate) : '-'}`, '', '', '', '', '']);
    const coaLabel = selectedCoa
      ? (coaList.find(c => c.kode === selectedCoa)?.nama ? `${selectedCoa} - ${coaList.find(c => c.kode === selectedCoa)?.nama}` : selectedCoa)
      : 'Semua Akun';
    wsData.push([`Akun: ${coaLabel}`, '', '', '', '', '']);
    wsData.push([]);
    // Header tabel
    wsData.push(['Tanggal', 'Nomor Transaksi', 'Deskripsi', 'Debit', 'Kredit', 'Saldo']);
    // Baris saldo awal
    if (data.length > 0) {
      wsData.push([
        'Saldo Awal', '', '',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0),
        '-',
        formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)
      ]);
    }
    // Data transaksi
    data.forEach(row => {
      wsData.push([
        formatDate(row.tanggal),
        row.nomorTransaksi,
        row.deskripsi,
        formatNumber(row.debit),
        formatNumber(row.kredit),
        formatNumber(row.saldo),
      ]);
    });
    const ws = xlsx.utils.aoa_to_sheet(wsData);
    // Merge judul, periode, akun (A1:F1, A2:F2, A3:F3)
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 5 } },
    ];
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "BukuBesar");
    xlsx.writeFile(wb, "BukuBesar.xlsx");
  };

  // Print PDF (print area saja)
  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Responsive table scroll
  const tableContainerStyle = {
    maxHeight: 500,
    overflowY: "auto",
    overflowX: "auto",
    borderRadius: 8,
    boxShadow: 3,
    background: "#fff",
  };

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, width: "100%", background: "#f9fafb" }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 2 }}>
        <Button
          onClick={handlePrint}
          variant="contained"
          color="primary"
          startIcon={<FiPrinter />}
        >
          Print Preview
        </Button>
        <Button
          onClick={handleExportPDF}
          variant="contained"
          color="error"
          startIcon={<AiFillFilePdf />}
        >
          Export PDF
        </Button>
        <Button
          onClick={handleExportExcel}
          variant="contained"
          color="success"
          startIcon={<FaFileExcel />}
        >
          Export Excel
        </Button>
      </Box>
      <Typography variant="h5" fontWeight="bold" mb={3} color="#1976d2">
        Buku Besar
      </Typography>
      <Paper sx={{ p: 2, mb: 3, borderRadius: 3, boxShadow: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Pilih Akun COA</InputLabel>
              <Select
                value={selectedCoa}
                label="Pilih Akun COA"
                onChange={e => setSelectedCoa(e.target.value)}
              >
                <MenuItem value="">Semua Akun</MenuItem>
                {coaList.map(coa => (
                  <MenuItem key={coa.kode} value={coa.kode}>
                    {coa.kode} - {coa.nama}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Tanggal Awal"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={6} md={3}>
            <TextField
              label="Tanggal Akhir"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ height: 40 }}
              onClick={fetchData}
              disabled={loading}
            >
              Tampilkan
            </Button>
          </Grid>
        </Grid>
      </Paper>
      {error && <Box color="error.main" mb={2}>{error}</Box>}
      <div ref={printRef}>
      <TableContainer component={Paper} sx={tableContainerStyle}>
        <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold", background: "#e3f2fd", color: "#1976d2" }}>Tanggal</TableCell>
              <TableCell sx={{ fontWeight: "bold", background: "#e3f2fd", color: "#1976d2" }}>Nomor Transaksi</TableCell>
              <TableCell sx={{ fontWeight: "bold", background: "#e3f2fd", color: "#1976d2" }}>Deskripsi</TableCell>
              <TableCell sx={{ fontWeight: "bold", background: "#e3f2fd", color: "#1976d2" }} align="right">Debit</TableCell>
              <TableCell sx={{ fontWeight: "bold", background: "#e3f2fd", color: "#1976d2" }} align="right">Kredit</TableCell>
              <TableCell sx={{ fontWeight: "bold", background: "#e3f2fd", color: "#1976d2" }} align="right">Saldo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Baris Saldo Awal (freeze di atas) */}
            {data.length > 0 && (
              <TableRow sx={{ position: 'sticky', top: 0, background: '#fffbe7', zIndex: 2 }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', color: '#1976d2' }}>Saldo Awal</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                  {formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>-</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', color: '#1976d2' }}>{formatNumber(data[0]?.saldo_awal ?? data[0]?.saldoAwal ?? 0)}</TableCell>
              </TableRow>
            )}
            {data.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={6} align="center">Tidak ada data</TableCell>
              </TableRow>
            )}
            {data.map((row, idx) => (
              <TableRow key={idx} hover>
                <TableCell>{formatDate(row.tanggal)}</TableCell>
                <TableCell>{row.nomorTransaksi}</TableCell>
                <TableCell>{row.deskripsi}</TableCell>
                <TableCell align="right">{formatNumber(row.debit)}</TableCell>
                <TableCell align="right">{formatNumber(row.kredit)}</TableCell>
                <TableCell align="right">{formatNumber(row.saldo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      </div>
    </Box>
  );
}
