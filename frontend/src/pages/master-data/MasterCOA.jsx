import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";

export default function MasterCOA() {
  const [form, setForm] = useState({ kode: "", nama: "", masterCategoryCOAId: "", saldoAwal: "" });
  const [data, setData] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const tableRef = useRef();

  const [filterKode, setFilterKode] = useState("");
  const [filterNama, setFilterNama] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  // Ambil data master COA
  useEffect(() => {
    api.get("/master-coa")
      .then((res) => {
        setData(res.data);
        setFilteredData(res.data);
      })
      .catch(() => setError("Gagal mengambil data Master COA dari server"));
  }, []);

  // Ambil data kategori dari master category coa
  useEffect(() => {
    api.get("/master-category-coa")
      .then((res) => setKategoriList(res.data))
      .catch(() => setError("Gagal mengambil data kategori COA"));
  }, []);

  // Submit data baru ke backend
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.kode || !form.nama || !form.masterCategoryCOAId) {
      setError("Semua field wajib diisi!");
      return;
    }
    // Pastikan masterCategoryCOAId dikirim sebagai number
    const payload = {
      ...form,
      masterCategoryCOAId: Number(form.masterCategoryCOAId),
      saldoAwal: form.saldoAwal ? parseFloat(form.saldoAwal) : 0,
    };

    console.log("Payload yang dikirim:", payload); // Debug log

    // Cek duplikat kode (kecuali saat edit)
    const isDuplicate = data.some(
      (coa) => coa.kode === form.kode && coa.id !== editId
    );
    if (isDuplicate) {
      window.alert(`Kode akun "${form.kode}" sudah terdaftar!`);
      return;
    }

    if (editId) {
      // Edit mode
      api.put(`/master-coa/${editId}`, payload)
        .then(() => {
          api.get("/master-coa")
            .then((res) => {
              setData(res.data);
              setFilteredData(res.data);
              setForm({ kode: "", nama: "", masterCategoryCOAId: "", saldoAwal: "" });
              setEditId(null);
              setError("");
            });
        })
        .catch(() => setError("Gagal update ke server"));
    } else {
      // Insert mode
      api.post("/master-coa", payload)
        .then(() => {
          api.get("/master-coa")
            .then((res) => {
              setData(res.data);
              setFilteredData(res.data);
              setForm({ kode: "", nama: "", masterCategoryCOAId: "", saldoAwal: "" });
              setError("");
            });
        })
        .catch(() => setError("Gagal simpan ke server"));
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Apakah yakin ingin menghapus COA "${row.kode} - ${row.nama}"?`)) {
      api.delete(`/master-coa/${row.id}`)
        .then(() => {
          const newData = data.filter((d) => d.id !== row.id);
          setData(newData);
          setFilteredData(newData);
          window.alert("Data berhasil dihapus!");
        })
        .catch(() => window.alert("Gagal menghapus data!"));
    }
    // Jika pilih No, tidak terjadi apa-apa
  };

  const handleEdit = (row) => {
    setForm({
      kode: row.kode,
      nama: row.nama,
      masterCategoryCOAId: row.masterCategoryCOAId?.toString() || "",
      saldoAwal: row.saldoAwal?.toString() || "",
    });
    setEditId(row.id);
  };

  const handleFilter = (e) => {
    const val = e.target.value.toLowerCase();
    setFilterText(val);
    setFilteredData(
      data.filter(
        (d) =>
          d.kode.toLowerCase().includes(val) ||
          d.nama.toLowerCase().includes(val) ||
          (
            d.masterCategoryCOA
              ? `${d.masterCategoryCOA.nama} ${d.masterCategoryCOA.tipeAkun}`.toLowerCase()
              : ""
          ).includes(val)
      )
    );
  };

  const handlePrint = () => {
    const printContents = tableRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // reload to restore events
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Filter data berdasarkan filter kolom
  const filtered = data.filter((d) =>
    d.kode.toLowerCase().includes(filterKode.toLowerCase()) &&
    d.nama.toLowerCase().includes(filterNama.toLowerCase()) &&
    (
      d.masterCategoryCOA
        ? `${d.masterCategoryCOA.nama} ${d.masterCategoryCOA.tipeAkun}`.toLowerCase()
        : ""
    ).includes(filterKategori.toLowerCase()) &&
    (
      filterText === "" ||
      d.kode.toLowerCase().includes(filterText) ||
      d.nama.toLowerCase().includes(filterText) ||
      (
        d.masterCategoryCOA
          ? `${d.masterCategoryCOA.nama} ${d.masterCategoryCOA.tipeAkun}`.toLowerCase()
          : ""
      ).includes(filterText)
    )
  );

  // Group data by kategori
  const groupedData = filtered.reduce((acc, coa) => {
    const kategori =
      coa.masterCategoryCOA
        ? `${coa.masterCategoryCOA.nama} (${coa.masterCategoryCOA.tipeAkun})`
        : "Tanpa Kategori";
    if (!acc[kategori]) acc[kategori] = [];
    acc[kategori].push(coa);
    return acc;
  }, {});

  // Flatten grouped data with header rows
  const flatData = [];
  Object.entries(groupedData).forEach(([kategori, items]) => {
    flatData.push({ isHeader: true, kategori });
    items.forEach((item) => flatData.push(item));
  });

  // Paging logic
  const pageCount = Math.ceil(flatData.length / rowsPerPage);
  const pagedData = flatData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Master COA</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border"
        >
          <div className="space-y-4">
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Kode Akun
              </label>
              <input
                type="text"
                name="kode"
                value={form.kode}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Contoh: 1001"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Nama Akun
              </label>
              <input
                type="text"
                name="nama"
                value={form.nama}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Contoh: Kas"
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Kategori
              </label>
              <select
                name="masterCategoryCOAId"
                value={form.masterCategoryCOAId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                required
              >
                <option value="">Pilih Kategori</option>
                {kategoriList.map((kat) => (
                  <option key={kat.id} value={kat.id}>
                    {kat.nama} ({kat.tipeAkun})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Saldo Awal
              </label>
              <input
                type="number"
                name="saldoAwal"
                value={form.saldoAwal}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Masukkan saldo awal"
                min={0}
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
            >
              Simpan
            </button>
          </div>
        </form>
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
            <input
              type="text"
              placeholder="Cari kode/nama/kategori..."
              className="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              value={filterText}
              onChange={handleFilter}
            />
            <button
              onClick={handlePrint}
              className="bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition print:hidden"
              type="button"
            >
              Print
            </button>
          </div>
          <div ref={tableRef}>
            <table className="w-full border rounded-lg text-sm shadow-sm">
              <thead>
                <tr className="bg-indigo-100 text-gray-700">
                  <th className="px-3 py-2 font-semibold border-b">Kode</th>
                  <th className="px-3 py-2 font-semibold border-b">Nama</th>
                  <th className="px-3 py-2 font-semibold border-b">Kategori</th>
                  <th className="px-3 py-2 font-semibold border-b">Saldo Awal</th>
                  <th className="px-3 py-2 font-semibold border-b">Aksi</th>
                </tr>
                <tr>
                  <th className="px-3 py-1 border-b">
                    <input
                      type="text"
                      value={filterKode}
                      onChange={e => { setFilterKode(e.target.value); setPage(0); }}
                      className="w-full border rounded px-2 py-1 text-xs"
                      placeholder="Filter kode"
                    />
                  </th>
                  <th className="px-3 py-1 border-b">
                    <input
                      type="text"
                      value={filterNama}
                      onChange={e => { setFilterNama(e.target.value); setPage(0); }}
                      className="w-full border rounded px-2 py-1 text-xs"
                      placeholder="Filter nama"
                    />
                  </th>
                  <th className="px-3 py-1 border-b">
                    <input
                      type="text"
                      value={filterKategori}
                      onChange={e => { setFilterKategori(e.target.value); setPage(0); }}
                      className="w-full border rounded px-2 py-1 text-xs"
                      placeholder="Filter kategori"
                    />
                  </th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pagedData.map((row) =>
                  row.isHeader ? (
                    <tr key={"header-" + row.kategori} className="bg-gray-50">
                      <td colSpan={5} className="px-3 py-2 font-bold text-indigo-700 border-b border-indigo-200">
                        {row.kategori}
                      </td>
                    </tr>
                  ) : (
                    <tr key={row.id} className="hover:bg-indigo-50 border-b last:border-b-0">
                      <td className="px-3 py-2">{row.kode}</td>
                      <td className="px-3 py-2">{row.nama}</td>
                      <td className="px-3 py-2">
                        {row.masterCategoryCOA
                          ? `${row.masterCategoryCOA.nama} (${row.masterCategoryCOA.tipeAkun})`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">{row.saldoAwal ?? 0}</td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => handleEdit(row)}
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 mr-1"
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                          type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            {/* Pagination */}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                {"<"}
              </button>
              <span>
                Page {page + 1} of {pageCount}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
                className="px-2 py-1 border rounded disabled:opacity-50"
              >
                {">"}
              </button>
              <span className="ml-4">Rows per page:</span>
              <select
                value={rowsPerPage}
                onChange={e => {
                  setRowsPerPage(Number(e.target.value));
                  setPage(0); // reset ke halaman pertama
                }}
                className="border rounded px-2 py-1"
              >
                {[5, 10, 20, 50, 100].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      {/* CSS agar hanya tabel yang dicetak */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .rdt_Table, .rdt_Table * {
            visibility: visible;
          }
          .rdt_Table {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}