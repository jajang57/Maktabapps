import { useState, useEffect, useRef } from "react";
import DataTable from "react-data-table-component";
import api from "../../utils/api";

export default function MasterCategoryCOA() {
  const [form, setForm] = useState({ nama: "", tipeAkun: "", isKasBank: false });
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
    if (!form.nama || !form.tipeAkun) {
      setError("Semua field wajib diisi!");
      return;
    }
    // Cek duplikat (kecuali jika sedang edit data yang sama)
    const isDuplicate = data.some(
      (cat) =>
        cat.nama === form.nama &&
        cat.tipeAkun === form.tipeAkun &&
        cat.id !== editId
    );
    if (isDuplicate) {
      window.alert(`Kategori "${form.nama}" dengan tipe "${form.tipeAkun}" sudah ada!`);
      return;
    }

    if (editId) {
      // Edit mode
      api.put(`/master-category-coa/${editId}`, form)
        .then((res) => {
          const newData = data.map((d) => (d.id === editId ? res.data : d));
          setData(newData);
          setFilteredData(newData);
          setForm({ nama: "", tipeAkun: "", isKasBank: false });
          setEditId(null);
          setError("");
          window.alert("Data berhasil diupdate!");
        })
        .catch(() => setError("Gagal update ke server"));
    } else {
      // Insert mode
      api.post("/master-category-coa", form)
        .then((res) => {
          const newData = [...data, res.data];
          setData(newData);
          setFilteredData(newData);
          setForm({ nama: "", tipeAkun: "", isKasBank: false });
          setError("");
        })
        .catch(() => setError("Gagal simpan ke server"));
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
        .catch(() => window.alert("Gagal menghapus data!"));
    }
  };

  const handleFilter = (e) => {
    const val = e.target.value.toLowerCase();
    setFilterText(val);
    setFilteredData(
      data.filter(
        (row) =>
          row.nama.toLowerCase().includes(val) ||
          row.tipeAkun.toLowerCase().includes(val)
      )
    );
  };

  const handleEdit = (row) => {
    setForm({
      nama: row.nama,
      tipeAkun: row.tipeAkun,
      isKasBank: !!row.isKasBank,
    });
    setEditId(row.id);
  };

  const columns = [
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
      allowOverflow: true,
      button: true,
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
                <option value="Asset">Asset</option>
                <option value="Kewajiban">Kewajiban</option>
                <option value="Modal">Modal</option>
                <option value="Pendapatan">Pendapatan</option>
                <option value="Beban">Beban</option>
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
                  setForm({ nama: "", tipeAkun: "", isKasBank: false });
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
              placeholder="Cari kategori/tipe akun..."
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