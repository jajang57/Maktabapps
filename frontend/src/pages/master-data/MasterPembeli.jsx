import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function MasterPembeli() {
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
    keterangan: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("utama");
  const itemsPerPage = 10;

  // Sample data - Ganti dengan API call
  useEffect(() => {
    const sampleData = [
      {
        id: 1,
        kode: 'CUST001',
        nama: 'PT. XYZ Industries',
        jenisCustomer: 'Corporate',
        alamatLengkap: 'Jl. Thamrin No. 456',
        kota: 'Jakarta',
        kodePos: '10230',
        telepon: '021-87654321',
        email: 'procurement@xyzind.com',
        namaBank: 'Bank Mandiri',
        nomorRekening: '9876543210',
        atasNama: 'PT. XYZ Industries',
        npwp: '02.345.678.9-012.000',
        contactPerson: 'Jane Smith',
        teleponCP: '081987654321',
        termPembayaran: 30,
        limitKredit: 150000000,
        diskon: 5,
        kategoriHarga: 'Corporate',
        status: 'Aktif',
        keterangan: 'Customer utama dengan volume besar'
      },
      {
        id: 2,
        kode: 'CUST002',
        nama: 'Toko Maju Jaya',
        jenisCustomer: 'Retail',
        alamatLengkap: 'Jl. Pasar Baru No. 789',
        kota: 'Bandung',
        kodePos: '40111',
        telepon: '022-11223344',
        email: 'tokumaju@gmail.com',
        namaBank: 'Bank BRI',
        nomorRekening: '5555666677',
        atasNama: 'Budi Santoso',
        npwp: '',
        contactPerson: 'Budi Santoso',
        teleponCP: '082112345678',
        termPembayaran: 14,
        limitKredit: 25000000,
        diskon: 2,
        kategoriHarga: 'Retail',
        status: 'Aktif',
        keterangan: 'Toko retail lokasi strategis'
      }
    ];
    setPembeliData(sampleData);
  }, []);

  const formatCurrency = (value) => {
    if (!value || value === 0) return '0';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const parseCurrency = (value) => {
    return parseInt(value.replace(/\D/g, '')) || 0;
  };

  const formatPhone = (value) => {
    // Format: 021-12345678 atau 081234567890
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
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (editingId) {
      // Update existing
      setPembeliData(prev => 
        prev.map(item => 
          item.id === editingId ? { ...formData, id: editingId } : item
        )
      );
      setEditingId(null);
    } else {
      // Add new
      const newId = Math.max(...pembeliData.map(p => p.id), 0) + 1;
      setPembeliData(prev => [...prev, { ...formData, id: newId }]);
    }
    
    // Reset form
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
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      setPembeliData(prev => prev.filter(item => item.id !== id));
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
  };

  // Filter and pagination logic
  const filteredData = pembeliData.filter(item =>
    item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.jenisCustomer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Master Data Pembeli</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-4">
        <button type="button" onClick={() => setActiveTab("utama")}
          className={`px-4 py-2 rounded-t ${activeTab === "utama" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Data Utama</button>
        <button type="button" onClick={() => setActiveTab("alamat")}
          className={`px-4 py-2 rounded-t ${activeTab === "alamat" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Alamat & Kontak</button>
        <button type="button" onClick={() => setActiveTab("bank")}
          className={`px-4 py-2 rounded-t ${activeTab === "bank" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Bank & Pajak</button>
        <button type="button" onClick={() => setActiveTab("term")}
          className={`px-4 py-2 rounded-t ${activeTab === "term" ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}>Term, Limit & Diskon</button>
      </div>

      {/* Form Input */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Pembeli' : 'Tambah Pembeli Baru'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === "utama" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Pembeli *
                  </label>
                  <Input
                    type="text"
                    name="kode"
                    value={formData.kode}
                    onChange={handleInputChange}
                    placeholder="Contoh: CUST001"
                    className={errors.kode ? 'border-red-500' : ''}
                  />
                  {errors.kode && <p className="text-red-500 text-xs mt-1">{errors.kode}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Pembeli *
                  </label>
                  <Input
                    type="text"
                    name="nama"
                    value={formData.nama}
                    onChange={handleInputChange}
                    placeholder="Nama lengkap pembeli/customer"
                    className={errors.nama ? 'border-red-500' : ''}
                  />
                  {errors.nama && <p className="text-red-500 text-xs mt-1">{errors.nama}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jenis Customer *
                  </label>
                  <select
                    name="jenisCustomer"
                    value={formData.jenisCustomer}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${errors.jenisCustomer ? 'border-red-500' : ''}`}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}
            {activeTab === "alamat" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alamat Lengkap *
                  </label>
                  <Input
                    type="text"
                    name="alamatLengkap"
                    value={formData.alamatLengkap}
                    onChange={handleInputChange}
                    placeholder="Alamat lengkap dengan nomor"
                    className={errors.alamatLengkap ? 'border-red-500' : ''}
                  />
                  {errors.alamatLengkap && <p className="text-red-500 text-xs mt-1">{errors.alamatLengkap}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kota
                  </label>
                  <Input
                    type="text"
                    name="kota"
                    value={formData.kota}
                    onChange={handleInputChange}
                    placeholder="Kota"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kode Pos
                  </label>
                  <Input
                    type="text"
                    name="kodePos"
                    value={formData.kodePos}
                    onChange={handleInputChange}
                    placeholder="12345"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon *
                  </label>
                  <Input
                    type="text"
                    name="telepon"
                    value={formData.telepon}
                    onChange={handleInputChange}
                    placeholder="021-12345678"
                    className={errors.telepon ? 'border-red-500' : ''}
                  />
                  {errors.telepon && <p className="text-red-500 text-xs mt-1">{errors.telepon}</p>}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@pembeli.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <Input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleInputChange}
                    placeholder="Nama kontak person"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon CP
                  </label>
                  <Input
                    type="text"
                    name="teleponCP"
                    value={formData.teleponCP}
                    onChange={handleInputChange}
                    placeholder="081234567890"
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
                  <Input
                    type="text"
                    name="namaBank"
                    value={formData.namaBank}
                    onChange={handleInputChange}
                    placeholder="Bank Mandiri"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Rekening
                  </label>
                  <Input
                    type="text"
                    name="nomorRekening"
                    value={formData.nomorRekening}
                    onChange={handleInputChange}
                    placeholder="1234567890"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Atas Nama
                  </label>
                  <Input
                    type="text"
                    name="atasNama"
                    value={formData.atasNama}
                    onChange={handleInputChange}
                    placeholder="Nama pemilik rekening"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NPWP
                  </label>
                  <Input
                    type="text"
                    name="npwp"
                    value={formData.npwp}
                    onChange={handleInputChange}
                    placeholder="01.234.567.8-901.000"
                  />
                </div>
              </div>
            )}
            {activeTab === "term" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                  {errors.termPembayaran && <p className="text-red-500 text-xs mt-1">{errors.termPembayaran}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limit Kredit
                  </label>
                  <Input
                    type="text"
                    name="limitKredit"
                    value={formatCurrency(formData.limitKredit)}
                    onChange={handleInputChange}
                    placeholder="100,000,000"
                    className={errors.limitKredit ? 'border-red-500' : ''}
                  />
                  {errors.limitKredit && <p className="text-red-500 text-xs mt-1">{errors.limitKredit}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  />
                  {errors.diskon && <p className="text-red-500 text-xs mt-1">{errors.diskon}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kategori Harga
                  </label>
                  <select
                    name="kategoriHarga"
                    value={formData.kategoriHarga}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Regular">Regular</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="VIP">VIP</option>
                  </select>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {editingId ? 'Update' : 'Simpan'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Batal
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabel Data */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Data Pembeli</CardTitle>
            <div className="w-64">
              <Input
                type="text"
                placeholder="Cari pembeli..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left">Kode</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Nama Pembeli</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Jenis</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Telepon</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                  <th className="border border-gray-300 px-4 py-2 text-left">Term</th>
                  <th className="border border-gray-300 px-4 py-2 text-right">Limit Kredit</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Diskon</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Status</th>
                  <th className="border border-gray-300 px-4 py-2 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length > 0 ? (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">{item.kode}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.nama}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.jenisCustomer}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.telepon}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.email || '-'}</td>
                      <td className="border border-gray-300 px-4 py-2">{item.termPembayaran} hari</td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        Rp {formatCurrency(item.limitKredit)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">{item.diskon}%</td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${
                          item.status === 'Aktif' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                      Tidak ada data pembeli
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Sebelumnya
              </Button>
              
              <span className="text-sm text-gray-600">
                Halaman {currentPage} dari {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
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
