import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context/ThemeContext"; // tambahkan ini
// Mapping tipe akun value ke nama
const tipeAkunMap = {
  "1": "Asset",
  "2": "Kewajiban",
  "3": "Modal",
  "4": "Pendapatan",
  "5": "Harga Pokok Penjualan",
  "6": "Beban",
  "7": "Pendapatan Lainnya",
  "8": "Beban Lainnya",
};
import DataTable from "react-data-table-component";
import api from "../../utils/api";
import MasterCard from "../../master_fn/MasterCard";
import MasterButton from "../../master_fn/MasterButton";

export default function MasterCategoryCOA() {
  const { theme } = useTheme();
  const [form, setForm] = useState({ kode: "", nama: "", tipeAkun: "", isKasBank: false });
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editId, setEditId] = useState(null);
  const tableRef = useRef();

  useEffect(() => {
    api.get("/master-category-coa")
      .then((res) => {
        setData(res.data);
        setFilteredData(res.data);
      })
      .catch(() => setError("Gagal mengambil data Master Category COA"));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.kode || !form.nama || !form.tipeAkun) {
      setError("Semua field wajib diisi!");
      return;
    }
    // Cek duplikat (kecuali jika sedang edit data yang sama)
    const isDuplicate = data.some(
      (cat) =>
        (cat.kode === form.kode || (cat.nama === form.nama && cat.tipeAkun === form.tipeAkun)) &&
        cat.id !== editId
    );
    if (isDuplicate) {
      window.alert(`Kategori "${form.nama}" dengan kode "${form.kode}" atau kombinasi nama dan tipe sudah ada!`);
      return;
    }

    if (editId) {
      // Edit mode
      api.put(`/master-category-coa/${editId}`, form)
        .then((res) => {
          const newData = data.map((d) => (d.id === editId ? res.data : d));
          setData(newData);
          setFilteredData(newData);
          setForm({ kode: "", nama: "", tipeAkun: "", isKasBank: false });
          setEditId(null);
          setError("");
          window.alert("Data berhasil diupdate!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal update ke server";
          setError(errorMsg);
        });
    } else {
      // Insert mode
      api.post("/master-category-coa", form)
        .then((res) => {
          const newData = [...data, res.data];
          setData(newData);
          setFilteredData(newData);
          setForm({ kode: "", nama: "", tipeAkun: "", isKasBank: false });
          setError("");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal simpan ke server";
          setError(errorMsg);
        });
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Apakah yakin ingin menghapus kategori "${row.nama}"?`)) {
      api.delete(`/master-category-coa/${row.id}`)
        .then(() => {
          const newData = data.filter((d) => d.id !== row.id);
          setData(newData);
          setFilteredData(newData);
          window.alert("Data berhasil dihapus!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal menghapus data!";
          window.alert(errorMsg);
        });
    }
  };

  const handleFilter = (e) => {
    const val = e.target.value.toLowerCase();
    setFilterText(val);
    setFilteredData(
      data.filter(
        (row) =>
          row.kode.toLowerCase().includes(val) ||
          row.nama.toLowerCase().includes(val) ||
          row.tipeAkun.toLowerCase().includes(val)
      )
      .sort((a, b) => a.kode.localeCompare(b.kode))
    );
  };

  const handleEdit = (row) => {
    setForm({
      kode: row.kode,
      nama: row.nama,
      tipeAkun: row.tipeAkun,
      isKasBank: !!row.isKasBank,
    });
    setEditId(row.id);
  };

  const columns = [
    { name: "Kode", selector: (row) => row.kode, sortable: true, width: "100px" },
    { name: "Kategori COA", selector: (row) => row.nama, sortable: true },
    { name: "Tipe Akun", selector: (row) => tipeAkunMap[row.tipeAkun] || row.tipeAkun, sortable: true },
    {
      name: "Kas & Bank",
      selector: (row) => (row.isKasBank ? "✅" : ""),
      sortable: true,
      width: "120px",
    },
    {
      name: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          <MasterButton
            type="update"
            size="sm"
            shape={theme.buttonShape} // tambahkan ini
            onClick={() => handleEdit(row)}
          >
            Edit
          </MasterButton>
          <MasterButton
            type="hapus"
            size="sm"
            shape={theme.buttonShape} // tambahkan ini
            onClick={() => handleDelete(row)}
          >
            Hapus
          </MasterButton>
        </div>
      ),
      ignoreRowClick: true,
      
    },
  ];

  // Custom style untuk DataTable agar mengikuti theme
  const customStyles = {
    headRow: {
      style: {
        backgroundColor: theme.tableHeaderColor,
        color: theme.tableFontColor,
        fontFamily: theme.tableFontFamily,
        fontWeight: 600,
      },
    },
    rows: {
      style: {
        backgroundColor: theme.tableBodyColor,
        color: theme.tableFontColor,
        fontFamily: theme.tableFontFamily,
      },
    },
    pagination: {
      style: {
        backgroundColor: theme.tableBodyColor,
        color: theme.tableFontColor,
        fontFamily: theme.tableFontFamily,
      },
    },
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4"  style={{ color: theme.fontColor }}>Master Category COA</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <MasterCard className="w-full max-w-md border p-6" >
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border" 
            style={{ background: theme.formColor }}
          >
            <div className="space-y-3">
              <div>
                <label className="block mb-1 font-semibold text-gray-700" style={{ color: theme.fontColor }}>
                  Kode Kategori
                </label>
                <input
                  type="text"
                  name="kode"
                  value={form.kode}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Contoh: KB001"
                  required
                    style={{
                    background: theme.fieldColor, // ini untuk background field
                    color: theme.fontColor,        // ini untuk warna teks
                    fontFamily: theme.fontFamily,  // opsional, agar konsisten
                  }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-700" style={{ color: theme.fontColor }}>
                  Nama Kategori
                </label>
                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" 
                  placeholder="Contoh: Kas & Bank"
                  style={{
                    background: theme.fieldColor, // ini untuk background field
                    color: theme.fontColor,        // ini untuk warna teks
                    fontFamily: theme.fontFamily,  // opsional, agar konsisten
                  }}
                  required
                />
              </div>
              {/* Checkbox di bawah Nama Kategori */}
              <div>
                <label className="inline-flex items-center mt-2" style={{ color: theme.fontColor }}>
                  <input
                    type="checkbox"
                    name="isKasBank"
                    checked={form.isKasBank}
                    onChange={handleChange}
                    className="form-checkbox h-5 w-5 text-indigo-600"
                  />
                  <span className="ml-2 text-gray-700" style={{ color: theme.fontColor }}>Akun Kas & Bank</span>
                </label>
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-700" style={{ color: theme.fontColor }}>
                  Tipe Akun
                </label>
                <select
                  name="tipeAkun"
                  value={form.tipeAkun}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition" 
                  required
                    style={{
                    background: theme.fieldColor, // ini untuk background field
                    color: theme.fontColor,        // ini untuk warna teks
                    fontFamily: theme.fontFamily,  // opsional, agar konsisten
                  }}
                >
                  <option value="">Pilih Tipe Akun</option>
                  <option value="1">Asset</option> {/* 1 */}
                  <option value="2">Kewajiban</option> {/* 2 */}
                  <option value="3">Modal</option> {/* 3 */}
                  <option value="4">Pendapatan</option> {/* 4 */}
                  <option value="5">Harga Pokok Penjualan</option> {/* 5 */}
                  <option value="6">Beban</option> {/* 6 */}
                  <option value="7">Pendapatan Lainnya</option> {/* 7 */}
                  <option value="8">Beban Lainnya</option> {/* 8 */}
                </select>
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
              <MasterButton type="simpan" shape={theme.buttonShape} className="w-full">
                Simpan
              </MasterButton>
              {editId && (
                <MasterButton type="refresh" shape={theme.buttonShape} className="w-full mt-2" onClick={() => {
                    setForm({ kode: "", nama: "", tipeAkun: "", isKasBank: false });
                    setEditId(null);
                    setError("");
                  }}>
                  Batal Edit
                </MasterButton>
              )}
            </div>
          </form>
        </MasterCard>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Cari kode/kategori/tipe akun..."
              className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              value={filterText}
              onChange={handleFilter}
              style={{
                  background: theme.fieldColor, // ini untuk background field
                  color: theme.fontColor,        // ini untuk warna teks
                  fontFamily: theme.fontFamily,  // opsional, agar konsisten
                }}
            />
          </div>
          <div ref={tableRef}>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              <DataTable
                columns={columns}
                data={[...filteredData].sort((a, b) => a.kode.localeCompare(b.kode))}
                highlightOnHover
                responsive
                striped
                persistTableHead
                pagination={false}
                customStyles={customStyles} // tambahkan ini
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}