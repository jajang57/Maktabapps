import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../context/ThemeContext';
import api from "../../utils/api";

export default function MasterPembeli() {
  const { theme } = useTheme();

  // Konsep MasterBarangJasa: toggle form, animasi, notifikasi
  const [formVisible, setFormVisible] = useState(true);
  const [formAnim, setFormAnim] = useState("fade-down");
  const [notif, setNotif] = useState("");

  const [pembeliData, setPembeliData] = useState([]);
  const [formData, setFormData] = useState({
    kode: '',
    nama: '',
    jenisCustomer: '',
    alamatLengkap: '',
    kota: '',
    kodePos: '',
    telepon: '',
    email: '',
    namaBank: '',
    nomorRekening: '',
    atasNama: '',
    npwp: '',
    contactPerson: '',
    teleponCP: '',
    termPembayaran: 0,
    limitKredit: 0,
    diskon: 0,
    kategoriHarga: 'Regular',
    status: 'Aktif',
    keterangan: '',
    mata_uang: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("utama");
  const itemsPerPage = 10;

  // Filter state
  const [filterKode, setFilterKode] = useState('');
  const [filterNama, setFilterNama] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [mataUangList, setMataUangList] = useState([]);

  // Pindahkan ke luar useEffect!
  const fetchPembeli = async () => {
    try {
      const res = await api.get("/master-pembeli");
      setPembeliData(res.data);
    } catch (err) {
      setNotif("Gagal mengambil data pembeli");
    }
  };

  useEffect(() => {
    fetchPembeli();
  }, []);

  useEffect(() => {
    if (notif) {
      const timer = setTimeout(() => setNotif(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notif]);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '0';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const parseCurrency = (value) => {
    return parseInt(value.replace(/\D/g, '')) || 0;
  };

  const formatPhone = (value) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1$2$3');
  };

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.kode.trim()) newErrors.kode = 'Kode pembeli wajib diisi';
    if (!formData.nama.trim()) newErrors.nama = 'Nama pembeli wajib diisi';
    if (!formData.jenisCustomer.trim()) newErrors.jenisCustomer = 'Jenis customer wajib diisi';
    if (!formData.alamatLengkap.trim()) newErrors.alamatLengkap = 'Alamat wajib diisi';
    if (!formData.telepon.trim()) newErrors.telepon = 'Telepon wajib diisi';
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (formData.termPembayaran < 0) newErrors.termPembayaran = 'Term pembayaran tidak boleh negatif';
    if (formData.limitKredit < 0) newErrors.limitKredit = 'Limit kredit tidak boleh negatif';
    if (formData.diskon < 0 || formData.diskon > 100) newErrors.diskon = 'Diskon harus antara 0-100%';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'limitKredit') {
      const numericValue = parseCurrency(value);
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else if (name === 'telepon' || name === 'teleponCP') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }));
    } else if (name === 'termPembayaran' || name === 'diskon') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Tampilkan/Sembunyikan Form
  const handleShowForm = () => {
    setFormVisible(true);
    setFormAnim("fade-down");
  };
  const handleHideForm = () => {
    setFormAnim("fade-up");
    setTimeout(() => setFormVisible(false), 300);
  };

  // Tambah/update pembeli
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      if (editingId) {
        await api.put(`/master-pembeli/${editingId}`, formData);
        setNotif("Data pembeli berhasil diupdate!");
      } else {
        await api.post("/master-pembeli", formData);
        setNotif("Data pembeli berhasil ditambahkan!");
      }
      fetchPembeli();
      setEditingId(null);
      setFormData({
        kode: '',
        nama: '',
        jenisCustomer: '',
        alamatLengkap: '',
        kota: '',
        kodePos: '',
        telepon: '',
        email: '',
        namaBank: '',
        nomorRekening: '',
        atasNama: '',
        npwp: '',
        contactPerson: '',
        teleponCP: '',
        termPembayaran: 0,
        limitKredit: 0,
        diskon: 0,
        kategoriHarga: 'Regular',
        status: 'Aktif',
        keterangan: ''
      });
      setErrors({});
    } catch (err) {
      setNotif("Gagal menyimpan data pembeli");
    }
  };

  const handleEdit = (item) => {
    setFormData({
      kode: item.kode || '',
      nama: item.nama || '',
      jenisCustomer: item.jenisCustomer || '',
      alamatLengkap: item.alamatLengkap || '',
      kota: item.kota || '',
      kodePos: item.kodePos || '',
      telepon: item.telepon || '',
      email: item.email || '',
      namaBank: item.namaBank || '',
      nomorRekening: item.nomorRekening || '',
      atasNama: item.atasNama || '',
      npwp: item.npwp || '',
      contactPerson: item.contactPerson || '',
      teleponCP: item.teleponCP || '',
      termPembayaran: item.termPembayaran || 0,
      limitKredit: item.limitKredit || 0,
      diskon: item.diskon || 0,
      kategoriHarga: item.kategoriHarga || 'Regular',
      status: item.status || 'Aktif',
      keterangan: item.keterangan || '',
      mata_uang: item.mata_uang || '' 
    });
    setEditingId(item.ID); // <-- GANTI DI SINI!
    setFormVisible(true);
    setFormAnim("fade-down");
    setNotif("");
    console.log("editingId set to", item.ID); // debug
  };

  // Hapus pembeli
  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await api.delete(`/master-pembeli/${id}`);
        setNotif("Data pembeli berhasil dihapus!");
        fetchPembeli();
      } catch (err) {
        setNotif("Gagal menghapus data pembeli");
      }
    }
  };

  const handleCancel = () => {
    setFormData({
      kode: '',
      nama: '',
      jenisCustomer: '',
      alamatLengkap: '',
      kota: '',
      kodePos: '',
      telepon: '',
      email: '',
      namaBank: '',
      nomorRekening: '',
      atasNama: '',
      npwp: '',
      contactPerson: '',
      teleponCP: '',
      termPembayaran: 0,
      limitKredit: 0,
      diskon: 0,
      kategoriHarga: 'Regular',
      status: 'Aktif',
      keterangan: ''
    });
    setEditingId(null);
    setErrors({});
    setNotif("");
  };

  const filteredData = pembeliData
    .filter(item => item.kode.toLowerCase().includes(filterKode.toLowerCase()))
    .filter(item => item.nama.toLowerCase().includes(filterNama.toLowerCase()))
    .filter(item => item.jenisCustomer.toLowerCase().includes(filterJenis.toLowerCase()))
    .filter(item =>
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.jenisCustomer.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Ambil data mata uang
  useEffect(() => {
    const fetchMataUang = async () => {
      try {
        const res = await api.get("/master-mata-uang");
        setMataUangList(res.data);
      } catch (err) {
        // handle error jika perlu
      }
    };
    fetchMataUang();
  }, []);

  return (
    <div
      className="space-y-6"
      style={{
        background: theme.backgroundColor,
        color: theme.fontColor,
        fontFamily: theme.fontFamily,
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <h1 className="text-2xl font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
        Master Data Pembeli
      </h1>

      {/* Card Form Pembeli */}
      {formVisible && (
        <Card style={{ background: theme.cardColor }}>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
              {editingId ? 'Edit Pembeli' : 'Tambah Pembeli Baru'}
            </CardTitle>
            {/* Tombol toggle di dalam Card, kanan atas */}
            <Button
              type="button"
              onClick={handleHideForm}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                background: theme.buttonSimpan,
                color: "#fff",
                fontFamily: theme.fontFamily,
                boxShadow: "none",
                border: `2px solid ${theme.buttonSimpan}`,
              }}
            >
              Sembunyikan Form
            </Button>
          </CardHeader>
          <CardContent>
            {/* Notifikasi */}
            {notif && (
              <div className="mb-2 px-4 py-2 rounded text-sm font-semibold"
                   style={{ background: "#e0f7fa", color: "#00796b" }}>
                {notif}
              </div>
            )}

            {/* Tab Navigasi & Form Input */}
            {formVisible && (
              <div className={`transition-opacity duration-300 ${formAnim}`}>
                <div className="flex gap-2 mb-4">
                  {["utama", "alamat", "bank", "term"].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-lg font-semibold transition ${
                        activeTab === tab
                          ? "bg-blue-600 text-white border-2 border-blue-600"
                          : "bg-gray-200 text-gray-700 border-2 border-gray-200"
                      }`}
                      style={{
                        fontFamily: theme.fontFamily,
                        boxShadow: "none",
                        outline: "none",
                      }}
                    >
                      {tab === "utama" && "Umum"}
                      {tab === "alamat" && "Alamat"}
                      {tab === "bank" && "Bank"}
                      {tab === "term" && "Term"}
                    </button>
                  ))}
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {activeTab === "utama" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Kode Pembeli *
                        </label>
                        <Input
                          type="text"
                          name="kode"
                          value={formData.kode}
                          onChange={handleInputChange}
                          placeholder="Contoh: CUST001"
                          className={errors.kode ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.kode && <p className="text-red-500 text-xs mt-1">{errors.kode}</p>}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Nama Pembeli *
                        </label>
                        <Input
                          type="text"
                          name="nama"
                          value={formData.nama}
                          onChange={handleInputChange}
                          placeholder="Nama lengkap pembeli/customer"
                          className={errors.nama ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Jenis Customer *
                        </label>
                        <select
                          name="jenisCustomer"
                          value={formData.jenisCustomer}
                          onChange={handleInputChange}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.jenisCustomer ? 'border-red-500' : ''}`}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        >
                          <option value="">Pilih jenis customer</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Retail">Retail</option>
                          <option value="Wholesale">Wholesale</option>
                          <option value="Individual">Individual</option>
                          <option value="Government">Government</option>
                        </select>
                        {errors.jenisCustomer && <p className="text-red-500 text-xs mt-1">{errors.jenisCustomer}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                          Alamat Lengkap *
                        </label>
                        <Input
                          type="text"
                          name="alamatLengkap"
                          value={formData.alamatLengkap}
                          onChange={handleInputChange}
                          placeholder="Alamat lengkap dengan nomor"
                          className={errors.alamatLengkap ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.alamatLengkap && <p className="text-red-500 text-xs mt-1">{errors.alamatLengkap}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Kota
                        </label>
                        <Input
                          type="text"
                          name="kota"
                          value={formData.kota}
                          onChange={handleInputChange}
                          placeholder="Kota"
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
                        <Input
                          type="text"
                          name="kodePos"
                          value={formData.kodePos}
                          onChange={handleInputChange}
                          placeholder="12345"
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
                        <Input
                          type="text"
                          name="telepon"
                          value={formData.telepon}
                          onChange={handleInputChange}
                          placeholder="021-12345678"
                          className={errors.telepon ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.telepon && <p className="text-red-500 text-xs mt-1">{errors.telepon}</p>}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Email
                        </label>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="email@pembeli.com"
                          className={errors.email ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Contact Person
                        </label>
                        <Input
                          type="text"
                          name="contactPerson"
                          value={formData.contactPerson}
                          onChange={handleInputChange}
                          placeholder="Nama kontak person"
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
                          Telepon CP
                        </label>
                        <Input
                          type="text"
                          name="teleponCP"
                          value={formData.teleponCP}
                          onChange={handleInputChange}
                          placeholder="081234567890"
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
                        <Input
                          type="text"
                          name="namaBank"
                          value={formData.namaBank}
                          onChange={handleInputChange}
                          placeholder="Bank Mandiri"
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
                          Nomor Rekening
                        </label>
                        <Input
                          type="text"
                          name="nomorRekening"
                          value={formData.nomorRekening}
                          onChange={handleInputChange}
                          placeholder="1234567890"
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
                          Atas Nama
                        </label>
                        <Input
                          type="text"
                          name="atasNama"
                          value={formData.atasNama}
                          onChange={handleInputChange}
                          placeholder="Nama pemilik rekening"
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
                        <Input
                          type="text"
                          name="npwp"
                          value={formData.npwp}
                          onChange={handleInputChange}
                          placeholder="01.234.567.8-901.000"
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
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Term Pembayaran (Hari)
                        </label>
                        <Input
                          type="number"
                          name="termPembayaran"
                          value={formData.termPembayaran}
                          onChange={handleInputChange}
                          placeholder="30"
                          min="0"
                          className={errors.termPembayaran ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.termPembayaran && <p className="text-red-500 text-xs mt-1">{errors.termPembayaran}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Limit Kredit
                        </label>
                        <Input
                          type="text"
                          name="limitKredit"
                          value={formatCurrency(formData.limitKredit)}
                          onChange={handleInputChange}
                          placeholder="100,000,000"
                          className={errors.limitKredit ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.limitKredit && <p className="text-red-500 text-xs mt-1">{errors.limitKredit}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Diskon (%)
                        </label>
                        <Input
                          type="number"
                          name="diskon"
                          value={formData.diskon}
                          onChange={handleInputChange}
                          placeholder="5"
                          min="0"
                          max="100"
                          step="0.1"
                          className={errors.diskon ? 'border-red-500' : ''}
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        />
                        {errors.diskon && <p className="text-red-500 text-xs mt-1">{errors.diskon}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Kategori Harga
                        </label>
                        <select
                          name="kategoriHarga"
                          value={formData.kategoriHarga}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        >
                          <option value="Regular">Regular</option>
                          <option value="Corporate">Corporate</option>
                          <option value="Wholesale">Wholesale</option>
                          <option value="VIP">VIP</option>
                        </select>
                      </div>
                        <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                          Mata Uang
                        </label>
                        <select
                          name="mata_uang"
                          value={formData.mata_uang}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          style={{
                            background: theme.fieldColor,
                            color: theme.fontColor,
                            fontFamily: theme.fontFamily,
                            borderColor: theme.dropdownColor,
                          }}
                        >
                          {mataUangList.map(mu => (
                            <option key={mu.kode} value={mu.kode}>
                              {mu.kode} - {mu.nama}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2 mt-4 justify-end">
                    {editingId ? (
                      <>
                        <Button
                          type="submit"
                          className="px-6 py-2 rounded-lg font-semibold"
                          style={{
                            background: theme.buttonSimpan,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                            border: `2px solid ${theme.buttonSimpan}`,
                          }}
                        >
                          Update
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setFormData({
                            kode: '',
                            nama: '',
                            jenisCustomer: '',
                            alamatLengkap: '',
                            kota: '',
                            kodePos: '',
                            telepon: '',
                            email: '',
                            namaBank: '',
                            nomorRekening: '',
                            atasNama: '',
                            npwp: '',
                            contactPerson: '',
                            teleponCP: '',
                            termPembayaran: 0,
                            limitKredit: 0,
                            diskon: 0,
                            kategoriHarga: 'Regular',
                            status: 'Aktif',
                            keterangan: ''
                          })}
                          className="px-6 py-2 rounded-lg font-semibold"
                          style={{
                            background: "#222",
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                            border: "2px solid #222",
                          }}
                        >
                          Kosongkan
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCancel}
                          className="px-6 py-2 rounded-lg font-semibold"
                          style={{
                            background: theme.buttonHapus,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                            border: `2px solid ${theme.buttonHapus}`,
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="submit"
                          className="px-6 py-2 rounded-lg font-semibold"
                          style={{
                            background: theme.buttonSimpan,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                            border: `2px solid ${theme.buttonSimpan}`,
                          }}
                        >
                          Simpan
                        </Button>
                        <Button
                          type="button"
                          onClick={() => setFormData({
                            kode: '',
                            nama: '',
                            jenisCustomer: '',
                            alamatLengkap: '',
                            kota: '',
                            kodePos: '',
                            telepon: '',
                            email: '',
                            namaBank: '',
                            nomorRekening: '',
                            atasNama: '',
                            npwp: '',
                            contactPerson: '',
                            teleponCP: '',
                            termPembayaran: 0,
                            limitKredit: 0,
                            diskon: 0,
                            kategoriHarga: 'Regular',
                            status: 'Aktif',
                            keterangan: ''
                          })}
                          className="px-6 py-2 rounded-lg font-semibold"
                          style={{
                            background: "#222",
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                            border: "2px solid #222",
                          }}
                        >
                          Kosongkan
                        </Button>
                      </>
                    )}
                  </div>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tombol tampilkan form di dalam Card jika form disembunyikan */}
      {!formVisible && (
        <Card style={{ background: theme.cardColor }}>
          <CardHeader className="flex flex-row justify-end items-center">
            <Button
              type="button"
              onClick={handleShowForm}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{
                background: theme.buttonSimpan,
                color: "#fff",
                fontFamily: theme.fontFamily,
                boxShadow: "none",
                border: `2px solid ${theme.buttonSimpan}`,
              }}
            >
              Tampilkan Form
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Tabel Data */}
      <Card style={{ background: theme.cardColor }}>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Data Pembeli</CardTitle>
            <div className="w-64">
              <Input
                type="text"
                placeholder="Cari pembeli..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: theme.fieldColor,
                  color: theme.fontColor,
                  fontFamily: theme.fontFamily,
                  borderColor: theme.dropdownColor,
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ fontFamily: theme.tableFontFamily }}>
              <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                <tr>
                  <th className="px-4 py-2 text-left">Kode</th>
                  <th className="px-4 py-2 text-left">Nama Pembeli</th>
                  <th className="px-4 py-2 text-left">Jenis</th>
                  <th className="px-4 py-2 text-left">Telepon</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">Term</th>
                  <th className="px-4 py-2 text-right">Limit Kredit</th>
                  <th className="px-4 py-2 text-center">Diskon</th>
                  <th className="px-4 py-2 text-center">Status</th>
                  <th className="px-4 py-2 text-center">Aksi</th>
                </tr>
                <tr>
                  <th>
                    <Input
                      type="text"
                      placeholder="Filter kode"
                      value={filterKode}
                      onChange={e => setFilterKode(e.target.value)}
                      style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.dropdownColor }}
                    />
                  </th>
                  <th>
                    <Input
                      type="text"
                      placeholder="Filter nama"
                      value={filterNama}
                      onChange={e => setFilterNama(e.target.value)}
                      style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.dropdownColor }}
                    />
                  </th>
                  <th>
                    <Input
                      type="text"
                      placeholder="Filter jenis"
                      value={filterJenis}
                      onChange={e => setFilterJenis(e.target.value)}
                      style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.dropdownColor }}
                    />
                  </th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <tr key={item.id} style={{ background: theme.tableBodyColor, color: theme.tableFontColor, fontFamily: theme.tableFontFamily }}>
                      <td className="px-4 py-2">{item.kode}</td>
                      <td className="px-4 py-2">{item.nama}</td>
                      <td className="px-4 py-2">{item.jenisCustomer}</td>
                      <td className="px-4 py-2">{item.telepon}</td>
                      <td className="px-4 py-2">{item.email || '-'}</td>
                      <td className="px-4 py-2">{item.termPembayaran} hari</td>
                      <td className="px-4 py-2 text-right">Rp {formatCurrency(item.limitKredit)}</td>
                      <td className="px-4 py-2 text-center">{item.diskon}%</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background: item.status === 'Aktif' ? theme.buttonSimpan : theme.buttonHapus,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                          }}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            style={{
                              background: theme.buttonUpdate,
                              fontFamily: theme.fontFamily,
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.ID)}
                            style={{
                              background: theme.buttonHapus,
                              color: "#fff",
                              fontFamily: theme.fontFamily,
                            }}
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="px-4 py-8 text-center" style={{ color: theme.tableFontColor, background: theme.tableBodyColor, fontFamily: theme.tableFontFamily }}>
                      Tidak ada data pembeli
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                style={{
                  background: theme.buttonRefresh,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                  opacity: currentPage === 1 ? 0.5 : 1,
                }}
              >
                Sebelumnya
              </Button>
              <span className="text-sm" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Halaman {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{
                  background: theme.buttonSimpan,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                }}
              >
                Selanjutnya
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
