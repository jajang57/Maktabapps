import React, { useState, useEffect } from "react";
import api from "../../utils/api";

function formatPhone(phone) {
  if (!phone) return "";
  // Format nomor telepon dengan pemisah untuk keterbacaan
  return phone.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

export default function MasterPemasok() {
  const [pemasokList, setPemasokList] = useState([]);
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    jenisUsaha: "",
    alamat: "",
    kota: "",
    provinsi: "",
    kodePos: "",
    negara: "Indonesia",
    telepon: "",
    fax: "",
    email: "",
    website: "",
    npwp: "",
    contactPerson: "",
    jabatanContact: "",
    teleponContact: "",
    emailContact: "",
    bank: "",
    noRekening: "",
    namaRekening: "",
    termPembayaran: "30",
    limitKredit: 0,
    mata_uang: "IDR",
    status: "Aktif",
    keterangan: ""
  });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [activeTab, setActiveTab] = useState("utama");

  useEffect(() => {
    fetchPemasok();
  }, []);

  const fetchPemasok = async () => {
    try {
      const response = await api.get("/pemasok");
      setPemasokList(response.data || []);
    } catch (error) {
      console.error("Error fetching pemasok:", error);
      setPemasokList([]);
    }
  };

  const generateKodePemasok = () => {
    const lastKode = pemasokList.length > 0 
      ? Math.max(...pemasokList.map(p => parseInt(p.kode?.replace(/\D/g, "") || 0)))
      : 0;
    const newNumber = lastKode + 1;
    return `VND${String(newNumber).padStart(3, '0')}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Format khusus untuk angka
    if (name === "limitKredit") {
      const numericValue = value.replace(/[^\d]/g, "");
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }

    // Format khusus untuk telepon
    if (name === "telepon" || name === "teleponContact") {
      const numericValue = value.replace(/[^\d]/g, "");
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }

    // Format khusus untuk email (lowercase)
    if (name === "email" || name === "emailContact") {
      setFormData(prev => ({
        ...prev,
        [name]: value.toLowerCase()
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi required fields
    const requiredFields = ["nama", "alamat", "telepon"];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      alert(`Field berikut harus diisi: ${missingFields.join(", ")}`);
      return;
    }

    try {
      const submitData = {
        ...formData,
        kode: formData.kode || generateKodePemasok(),
        limitKredit: Number(formData.limitKredit) || 0
      };

      if (editingId) {
        await api.put(`/pemasok/${editingId}`, submitData);
        alert("Data pemasok berhasil diupdate!");
      } else {
        await api.post("/pemasok", submitData);
        alert("Data pemasok berhasil ditambahkan!");
      }
      
      resetForm();
      fetchPemasok();
    } catch (error) {
      console.error("Error saving pemasok:", error);
      alert("Gagal menyimpan data pemasok");
    }
  };

  const resetForm = () => {
    setFormData({
      kode: "",
      nama: "",
      jenisUsaha: "",
      alamat: "",
      kota: "",
      provinsi: "",
      kodePos: "",
      negara: "Indonesia",
      telepon: "",
      fax: "",
      email: "",
      website: "",
      npwp: "",
      contactPerson: "",
      jabatanContact: "",
      teleponContact: "",
      emailContact: "",
      bank: "",
      noRekening: "",
      namaRekening: "",
      termPembayaran: "30",
      limitKredit: 0,
      mata_uang: "IDR",
      status: "Aktif",
      keterangan: ""
    });
    setEditingId(null);
  };

  const handleEdit = (pemasok) => {
    setFormData(pemasok);
    setEditingId(pemasok.id);
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data pemasok ini?")) {
      try {
        await api.delete(`/pemasok/${id}`);
        alert("Data pemasok berhasil dihapus!");
        fetchPemasok();
      } catch (error) {
        console.error("Error deleting pemasok:", error);
        alert("Gagal menghapus data pemasok");
      }
    }
  };

  // Filter dan pagination
  const filteredPemasok = pemasokList.filter(pemasok =>
    pemasok.nama?.toLowerCase().includes(search.toLowerCase()) ||
    pemasok.kode?.toLowerCase().includes(search.toLowerCase()) ||
    pemasok.email?.toLowerCase().includes(search.toLowerCase()) ||
    pemasok.telepon?.includes(search)
  );

  const totalPages = Math.ceil(filteredPemasok.length / itemsPerPage);
  const paginatedPemasok = filteredPemasok.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Master Data Pemasok</h1>
        <p className="text-gray-600">Kelola data vendor/supplier perusahaan</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-4">
        <button type="button" onClick={() => setActiveTab("utama")}
          className={`px-4 py-2 rounded-t ${activeTab === "utama" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Data Utama</button>
        <button type="button" onClick={() => setActiveTab("alamat")}
          className={`px-4 py-2 rounded-t ${activeTab === "alamat" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Alamat & Kontak</button>
        <button type="button" onClick={() => setActiveTab("bank")}
          className={`px-4 py-2 rounded-t ${activeTab === "bank" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Bank & Pajak</button>
        <button type="button" onClick={() => setActiveTab("term")}
          className={`px-4 py-2 rounded-t ${activeTab === "term" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Term & Limit</button>
      </div>

      {/* Form Input */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {editingId ? "Edit Data Pemasok" : "Tambah Data Pemasok"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "utama" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Pemasok *
                </label>
                <input
                  type="text"
                  name="kode"
                  value={formData.kode}
                  onChange={handleInputChange}
                  placeholder={generateKodePemasok()}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pemasok *
                </label>
                <input
                  type="text"
                  name="nama"
                  value={formData.nama}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Usaha
                </label>
                <input
                  type="text"
                  name="jenisUsaha"
                  value={formData.jenisUsaha}
                  onChange={handleInputChange}
                  placeholder="Misal: Distributor, Manufaktur, dll"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Tidak Aktif">Tidak Aktif</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  name="keterangan"
                  value={formData.keterangan}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          {activeTab === "alamat" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat *
                </label>
                <textarea
                  name="alamat"
                  value={formData.alamat}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kota
                </label>
                <input
                  type="text"
                  name="kota"
                  value={formData.kota}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  name="provinsi"
                  value={formData.provinsi}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  name="kodePos"
                  value={formData.kodePos}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Negara
                </label>
                <input
                  type="text"
                  name="negara"
                  value={formData.negara}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon *
                </label>
                <input
                  type="text"
                  name="telepon"
                  value={formData.telepon}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fax
                </label>
                <input
                  type="text"
                  name="fax"
                  value={formData.fax}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jabatan Contact
                </label>
                <input
                  type="text"
                  name="jabatanContact"
                  value={formData.jabatanContact}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon Contact
                </label>
                <input
                  type="text"
                  name="teleponContact"
                  value={formData.teleponContact}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Contact
                </label>
                <input
                  type="email"
                  name="emailContact"
                  value={formData.emailContact}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          {activeTab === "bank" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Bank
                </label>
                <input
                  type="text"
                  name="bank"
                  value={formData.bank}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Rekening
                </label>
                <input
                  type="text"
                  name="noRekening"
                  value={formData.noRekening}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Rekening
                </label>
                <input
                  type="text"
                  name="namaRekening"
                  value={formData.namaRekening}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NPWP
                </label>
                <input
                  type="text"
                  name="npwp"
                  value={formData.npwp}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          {activeTab === "term" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Term Pembayaran (hari)
                </label>
                <input
                  type="number"
                  name="termPembayaran"
                  value={formData.termPembayaran}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Limit Kredit
                </label>
                <input
                  type="number"
                  name="limitKredit"
                  value={formData.limitKredit}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mata Uang
                </label>
                <input
                  type="text"
                  name="mata_uang"
                  value={formData.mata_uang}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {editingId ? "Update" : "Simpan"}
            </button>
            {editingId && (
              <button
                type="button"
                className="border px-4 py-2 rounded"
                onClick={resetForm}
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Search and Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Daftar Pemasok</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cari pemasok..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded px-3 py-2 w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-3 border text-left">Kode</th>
                <th className="p-3 border text-left">Nama Pemasok</th>
                <th className="p-3 border text-left">Jenis Usaha</th>
                <th className="p-3 border text-left">Kontak</th>
                <th className="p-3 border text-left">Alamat</th>
                <th className="p-3 border text-left">Term</th>
                <th className="p-3 border text-left">Limit Kredit</th>
                <th className="p-3 border text-left">Status</th>
                <th className="p-3 border text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginatedPemasok.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-gray-500">
                    Tidak ada data pemasok
                  </td>
                </tr>
              ) : (
                paginatedPemasok.map((pemasok) => (
                  <tr key={pemasok.id} className="hover:bg-gray-50">
                    <td className="p-3 border">{pemasok.kode}</td>
                    <td className="p-3 border font-medium">{pemasok.nama}</td>
                    <td className="p-3 border">{pemasok.jenisUsaha || "-"}</td>
                    <td className="p-3 border">
                      <div>
                        <div>{formatPhone(pemasok.telepon)}</div>
                        {pemasok.email && (
                          <div className="text-xs text-gray-600">{pemasok.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border">
                      <div className="max-w-xs">
                        <div>{pemasok.alamat}</div>
                        {pemasok.kota && (
                          <div className="text-xs text-gray-600">
                            {pemasok.kota}, {pemasok.provinsi}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border text-center">
                      {pemasok.termPembayaran === "0" ? "Cash" : `${pemasok.termPembayaran} hari`}
                    </td>
                    <td className="p-3 border text-right">
                      {formatCurrency(pemasok.limitKredit)}
                    </td>
                    <td className="p-3 border">
                      <span className={`px-2 py-1 rounded text-xs ${
                        pemasok.status === "Aktif" 
                          ? "bg-green-100 text-green-800" 
                          : "bg-red-100 text-red-800"
                      }`}>
                        {pemasok.status}
                      </span>
                    </td>
                    <td className="p-3 border text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEdit(pemasok)}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pemasok.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-600">
              Halaman {currentPage} dari {totalPages} (Total: {filteredPemasok.length} data)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
