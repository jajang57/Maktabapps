import { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import api from "../../utils/api";

export default function MasterCategoryCOA() {
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
    { name: "Tipe Akun", selector: (row) => row.tipeAkun, sortable: true },
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
          <button
            onClick={() => handleEdit(row)}
            className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-700"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      ),
      ignoreRowClick: true,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Master Category COA</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border"
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
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
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Nama Kategori
              </label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Contoh: Kas & Bank"
                required
              />
            </div>
            {/* Checkbox di bawah Nama Kategori */}
            <div>
              <label className="inline-flex items-center mt-2">
                <input
                  type="checkbox"
                  name="isKasBank"
                  checked={form.isKasBank}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <span className="ml-2 text-gray-700">Akun Kas & Bank</span>
              </label>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Tipe Akun
              </label>
              <select
                name="tipeAkun"
                value={form.tipeAkun}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
              >
                <option value="">Pilih Tipe Akun</option>
                <option value="Asset">Asset</option> {/* 1 */}
                <option value="Kewajiban">Kewajiban</option> {/* 2 */}
                <option value="Modal">Modal</option> {/* 3 */}
                <option value="Pendapatan">Pendapatan</option> {/* 4 */}
                <option value="Harga Pokok Penjualan">Harga Pokok Penjualan</option> {/* 5 */}
                <option value="Beban">Beban</option> {/* 6 */}
                <option value="Pendapatan Lainnya">Pendapatan Lainnya</option> {/* 7 */}
                <option value="Beban Lainnya">Beban Lainnya</option> {/* 8 */}
              </select>
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
            >
              Simpan
            </button>
            {editId && (
              <button
                type="button"
                className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 transition mt-2"
                onClick={() => {
                  setForm({ kode: "", nama: "", tipeAkun: "", isKasBank: false });
                  setEditId(null);
                  setError("");
                }}
              >
                Batal Edit
              </button>
            )}
          </div>
        </form>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Cari kode/kategori/tipe akun..."
              className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              value={filterText}
              onChange={handleFilter}
            />
          </div>
          <div ref={tableRef}>
            <DataTable
              columns={columns}
              data={filteredData}
              pagination
              highlightOnHover
              responsive
              striped
              persistTableHead
            />
          </div>
        </div>
      </div>
    </div>
  );
}