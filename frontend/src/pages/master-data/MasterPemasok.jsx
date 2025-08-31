import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

function formatPhone(phone) {
  if (!phone) return "";
  // Format nomor telepon dengan pemisah untuk keterbacaan
  return phone.replace(/(\d{4})(\d{4})(\d+)/, "$1-$2-$3");
}

export default function MasterPemasok() {
  const { theme } = useTheme();
  // Tambahkan state untuk toggle form dan animasi
  const [formVisible, setFormVisible] = useState(true);
  const [formAnim, setFormAnim] = useState("fade-down");
  const [notifikasi, setNotifikasi] = useState("");

  const [pemasokList, setPemasokList] = useState([]);
  const [mataUangList, setMataUangList] = useState([]);
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
    fetchMataUang();
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

  const fetchMataUang = async () => {
    try {
      const res = await api.get("/master-mata-uang");
      setMataUangList(res.data || []);
    } catch {
      setMataUangList([]);
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

  // Fungsi toggle form
  const handleShowForm = () => {
    setFormVisible(true);
    setFormAnim("fade-down");
  };
  const handleHideForm = () => {
    setFormAnim("fade-up");
    setTimeout(() => setFormVisible(false), 300);
  };

  // Ubah notifikasi alert jadi state
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
        setNotifikasi("Data pemasok berhasil diupdate!");
      } else {
        await api.post("/pemasok", submitData);
        setNotifikasi("Data pemasok berhasil ditambahkan!");
      }
      
      resetForm();
      fetchPemasok();
    } catch (error) {
      setNotifikasi("Gagal menyimpan data pemasok");
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
    setFormData({
      kode: pemasok.kode || "",
      nama: pemasok.nama || "",
      jenisUsaha: pemasok.jenisUsaha || "",
      alamat: pemasok.alamat || "",
      kota: pemasok.kota || "",
      provinsi: pemasok.provinsi || "",
      kodePos: pemasok.kodePos || "",
      negara: pemasok.negara || "Indonesia",
      telepon: pemasok.telepon || "",
      fax: pemasok.fax || "",
      email: pemasok.email || "",
      website: pemasok.website || "",
      npwp: pemasok.npwp || "",
      contactPerson: pemasok.contactPerson || "",
      jabatanContact: pemasok.jabatanContact || "",
      teleponContact: pemasok.teleponContact || "",
      emailContact: pemasok.emailContact || "",
      bank: pemasok.bank || "",
      noRekening: pemasok.noRekening || "",
      namaRekening: pemasok.namaRekening || "",
      termPembayaran: pemasok.termPembayaran || "30",
      limitKredit: pemasok.limitKredit || 0,
      mata_uang: pemasok.mata_uang || "IDR",
      status: pemasok.status || "Aktif",
      keterangan: pemasok.keterangan || ""
    });
    setEditingId(pemasok.ID); // <-- GANTI id jadi ID
  };

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data pemasok ini?")) {
      try {
        await api.delete(`/pemasok/${id}`);
        setNotifikasi("Data pemasok berhasil dihapus!");
        fetchPemasok();
      } catch (error) {
        setNotifikasi("Gagal menghapus data pemasok");
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
    <div className="p-6" style={{ background: theme.backgroundColor, color: theme.fontColor, fontFamily: theme.fontFamily }}>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Master Data Pemasok</h1>
          <p style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Kelola data vendor/supplier perusahaan</p>
        </div>
  
      </div>

      {notifikasi && (
        <div className="mb-2 px-4 py-2 rounded text-sm font-semibold"
             style={{ background: "#e0f7fa", color: "#00796b" }}>
          {notifikasi}
        </div>
      )}

      {/* Tombol toggle dan Card form input */}
      {formVisible ? (
        <div className={`rounded-lg shadow p-6 mb-6 border transition-opacity duration-300 ${formAnim}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              {editingId ? "Edit Data Pemasok" : "Tambah Data Pemasok"}
            </h2>
            <button
              type="button"
              onClick={handleHideForm}
              className="px-4 py-2 rounded font-semibold"
              style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}
            >
              Sembunyikan Form
            </button>
          </div>
          {/* Tab Navigation */}
          <div className="flex space-x-2 mb-4">
            {["utama", "alamat", "bank", "term"].map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-t font-semibold transition`}
                style={{
                  background: activeTab === tab ? theme.buttonSimpan : theme.cardColor,
                  color: activeTab === tab ? "#fff" : theme.fontColor,
                  fontFamily: theme.fontFamily,
                  border: activeTab === tab ? `2px solid ${theme.buttonSimpan}` : "none",
                }}
              >
                {tab === "utama" && "Data Utama"}
                {tab === "alamat" && "Alamat & Kontak"}
                {tab === "bank" && "Bank & Pajak"}
                {tab === "term" && "Term & Limit"}
              </button>
            ))}
          </div>

          {/* Form Input */}
          <div className="rounded-lg shadow p-6 mb-6" style={{ background: theme.cardColor }}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {activeTab === "utama" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Kode Pemasok *
                    </label>
                    <input
                      type="text"
                      name="kode"
                      value={formData.kode}
                      onChange={handleInputChange}
                      placeholder={generateKodePemasok()}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Nama Pemasok *
                    </label>
                    <input
                      type="text"
                      name="nama"
                      value={formData.nama}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Jenis Usaha
                    </label>
                    <input
                      type="text"
                      name="jenisUsaha"
                      value={formData.jenisUsaha}
                      onChange={handleInputChange}
                      placeholder="Misal: Distributor, Manufaktur, dll"
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Tidak Aktif">Tidak Aktif</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Keterangan
                    </label>
                    <textarea
                      name="keterangan"
                      value={formData.keterangan}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                </div>
              )}
              {activeTab === "alamat" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Alamat *
                    </label>
                    <textarea
                      name="alamat"
                      value={formData.alamat}
                      onChange={handleInputChange}
                      required
                      rows="3"
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Kota
                    </label>
                    <input
                      type="text"
                      name="kota"
                      value={formData.kota}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Provinsi
                    </label>
                    <input
                      type="text"
                      name="provinsi"
                      value={formData.provinsi}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      name="kodePos"
                      value={formData.kodePos}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Negara
                    </label>
                    <input
                      type="text"
                      name="negara"
                      value={formData.negara}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Telepon *
                    </label>
                    <input
                      type="text"
                      name="telepon"
                      value={formData.telepon}
                      onChange={handleInputChange}
                      required
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Fax
                    </label>
                    <input
                      type="text"
                      name="fax"
                      value={formData.fax}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Website
                    </label>
                    <input
                      type="text"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Contact Person
                    </label>
                    <input
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Jabatan Contact
                    </label>
                    <input
                      type="text"
                      name="jabatanContact"
                      value={formData.jabatanContact}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Telepon Contact
                    </label>
                    <input
                      type="text"
                      name="teleponContact"
                      value={formData.teleponContact}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Email Contact
                    </label>
                    <input
                      type="email"
                      name="emailContact"
                      value={formData.emailContact}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                </div>
              )}
              {activeTab === "bank" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Nama Bank
                    </label>
                    <input
                      type="text"
                      name="bank"
                      value={formData.bank}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      No. Rekening
                    </label>
                    <input
                      type="text"
                      name="noRekening"
                      value={formData.noRekening}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Nama Rekening
                    </label>
                    <input
                      type="text"
                      name="namaRekening"
                      value={formData.namaRekening}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      NPWP
                    </label>
                    <input
                      type="text"
                      name="npwp"
                      value={formData.npwp}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                </div>
              )}
              {activeTab === "term" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Term Pembayaran (hari)</label>
                    <input
                      type="number"
                      name="termPembayaran"
                      value={formData.termPembayaran}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Limit Kredit</label>
                    <input
                      type="number"
                      name="limitKredit"
                      value={formData.limitKredit}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mata Uang</label>
                    <select
                      name="mata_uang"
                      value={formData.mata_uang}
                      onChange={handleInputChange}
                      className="w-full border rounded px-3 py-2 focus:outline-none"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                        borderColor: theme.dropdownColor,
                      }}
                    >
                      <option value="">Pilih Mata Uang</option>
                      {mataUangList.map((mu) => (
                        <option key={mu.id} value={mu.id}>
                          {mu.kode} - {mu.nama}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              <div className="flex gap-2 mt-4 justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded font-semibold"
                  style={{
                    background: theme.buttonSimpan,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  {editingId ? "Update" : "Simpan"}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded font-semibold"
                  style={{
                    background: "#222",
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                  onClick={resetForm}
                >
                  Kosongkan
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="px-4 py-2 rounded font-semibold"
                    style={{
                      background: theme.buttonHapus,
                      color: "#fff",
                      fontFamily: theme.fontFamily,
                    }}
                    onClick={resetForm}
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : (
        <div className="rounded-lg shadow p-6 mb-6 border flex justify-end" style={{ background: theme.cardColor }}>
          <button
            type="button"
            onClick={handleShowForm}
            className="px-4 py-2 rounded font-semibold"
            style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}
          >
            Tampilkan Form
          </button>
        </div>
      )}

      {/* Search and Table */}
      <div className="rounded-lg shadow p-6" style={{ background: theme.cardColor }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Daftar Pemasok</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Cari pemasok..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded px-3 py-2 w-64"
              style={{
                background: theme.fieldColor,
                color: theme.fontColor,
                fontFamily: theme.fontFamily,
                borderColor: theme.dropdownColor,
              }}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm" style={{ fontFamily: theme.tableFontFamily }}>
            <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
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
                  <td colSpan={9} className="p-4 text-center" style={{ color: theme.tableFontColor, background: theme.tableBodyColor, fontFamily: theme.tableFontFamily }}>
                    Tidak ada data pemasok
                  </td>
                </tr>
              ) : (
                paginatedPemasok.map((pemasok) => (
                  <tr key={pemasok.id} className="hover:bg-indigo-50" style={{ background: theme.tableBodyColor, color: theme.tableFontColor, fontFamily: theme.tableFontFamily }}>
                    <td className="p-3 border">{pemasok.kode}</td>
                    <td className="p-3 border font-medium">{pemasok.nama}</td>
                    <td className="p-3 border">{pemasok.jenisUsaha || "-"}</td>
                    <td className="p-3 border">
                      <div>
                        <div>{formatPhone(pemasok.telepon)}</div>
                        {pemasok.email && (
                          <div className="text-xs" style={{ color: theme.tableFontColor }}>{pemasok.email}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3 border">
                      <div className="max-w-xs">
                        <div>{pemasok.alamat}</div>
                        {pemasok.kota && (
                          <div className="text-xs" style={{ color: theme.tableFontColor }}>
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
                      <span className="px-2 py-1 rounded text-xs" style={{
                        background: pemasok.status === "Aktif" ? theme.buttonSimpan : theme.buttonHapus,
                        color: "#fff",
                        fontFamily: theme.fontFamily,
                      }}>
                        {pemasok.status}
                      </span>
                    </td>
                    <td className="p-3 border text-center">
                      <div className="flex gap-1 justify-center">
                        <button
                          onClick={() => handleEdit(pemasok)}
                          className="px-3 py-1 rounded text-xs font-semibold"
                          style={{
                            background: theme.buttonUpdate,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(pemasok.ID)} // <-- GANTI id jadi ID
                          className="px-3 py-1 rounded text-xs font-semibold"
                          style={{
                            background: theme.buttonHapus,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                          }}
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
            <span className="text-sm" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              Halaman {currentPage} dari {totalPages} (Total: {filteredPemasok.length} data)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border font-semibold"
                style={{
                  background: theme.buttonRefresh,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border font-semibold"
                style={{
                  background: theme.buttonSimpan,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
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
