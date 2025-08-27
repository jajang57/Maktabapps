import { useState, useEffect, useRef } from "react";
import api from "../../utils/api";
import { useTheme } from "../../context/ThemeContext";

// CSS animations for fade transitions
const animationStyles = `
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes fadeDown {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = animationStyles;
  document.head.appendChild(styleSheet);
}

export default function MasterBarangJasa() {
  const { theme } = useTheme();
  const [form, setForm] = useState({ 
    kode: "", 
    nama: "", 
    jenis: "BARANG", // BARANG atau JASA
    kelompokItem: "",
    kategori: "",
    satuan: "",
    hargaBeli: "",
    hargaJual: "",
    stokMinimal: "",
    deskripsi: "",
    diJual: true,
    diBeli: true,
    image: "",
    aktif: true
  });
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [editId, setEditId] = useState(null);
  const tableRef = useRef();

  // State untuk filter kolom
  const [filterKode, setFilterKode] = useState("");
  const [filterNama, setFilterNama] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterKelompokItem, setFilterKelompokItem] = useState("");
  const [filterKategori, setFilterKategori] = useState("");

  // State untuk format angka
  const [formattedHargaBeli, setFormattedHargaBeli] = useState("");
  const [formattedHargaJual, setFormattedHargaJual] = useState("");
  
  // State untuk hide/unhide form
  const [showForm, setShowForm] = useState(true);

  // State untuk upload image
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // State untuk modal kelompok item
  const [showKelompokModal, setShowKelompokModal] = useState(false);
  const [kelompokData, setKelompokData] = useState([]);
  const [kelompokForm, setKelompokForm] = useState({ kode: "", nama: "" });
  const [editKelompokId, setEditKelompokId] = useState(null);

  // State untuk modal kategori
  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [kategoriData, setKategoriData] = useState([]);
  const [kategoriForm, setKategoriForm] = useState({ kode: "", nama: "" });
  const [editKategoriId, setEditKategoriId] = useState(null);

  // Tambahkan state untuk tab dan GL Account
  const [activeTab, setActiveTab] = useState("Umum");
  const [glAccount, setGlAccount] = useState({
    persediaan: "",
    penjualan: "",
    returPenjualan: "",
    diskonPenjualan: "",
    hpp: "",
    returPembelian: "",
    diskonKhusus: "",
  });

  const [coaList, setCoaList] = useState([]);

  // Fungsi untuk format angka dengan 2 desimal
  const formatNumber = (value) => {
    if (!value || value === '') return '';
    
    let cleanValue = value.toString().replace(/[^\d.]/g, '');
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    const numericValue = parseFloat(cleanValue) || 0;
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  };

  // Fungsi untuk unformat angka
  const unformatNumber = (value) => {
    if (!value) return '';
    return value.toString().replace(/,/g, '');
  };

  // Ambil data barang/jasa
  useEffect(() => {
    fetchData();
    fetchKelompokData();
    fetchKategoriData();
    fetchCoaList(); // Tambahkan ini
  }, []);

  const fetchData = () => {
    api.get("/master-barang-jasa")
      .then((res) => {
        setData(res.data);
      })
      .catch(() => setError("Gagal mengambil data Barang/Jasa dari server"));
  };

  const fetchKelompokData = () => {
    api.get("/master-kelompok-item")
      .then((res) => {
        setKelompokData(res.data);
      })
      .catch(() => console.error("Gagal mengambil data Kelompok Item"));
  };

  const fetchKategoriData = () => {
    api.get("/master-kategori")
      .then((res) => {
        setKategoriData(res.data);
      })
      .catch(() => console.error("Gagal mengambil data Kategori"));
  };

  const fetchCoaList = () => {
    api.get("/master-coa")
      .then((res) => setCoaList(res.data))
      .catch(() => setCoaList([]));
  };

  // Submit data
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.kode || !form.nama || !form.jenis) {
      setError("Kode, Nama, dan Jenis wajib diisi!");
      return;
    }

    const payload = {
      ...form,
      hargaBeli: form.hargaBeli ? parseFloat(unformatNumber(form.hargaBeli)) : 0,
      hargaJual: form.hargaJual ? parseFloat(unformatNumber(form.hargaJual)) : 0,
      stokMinimal: form.stokMinimal ? parseInt(form.stokMinimal) : 0,
      // Tambahkan field Akun GL
      akunPersediaan: glAccount.persediaan,
      akunPenjualan: glAccount.penjualan,
      akunReturPenjualan: glAccount.returPenjualan,
      akunDiskonPenjualan: glAccount.diskonPenjualan,
      akunHPP: glAccount.hpp,
      akunReturPembelian: glAccount.returPembelian,
      akunDiskonKhusus: glAccount.diskonKhusus,
    };

    // Cek duplikat kode
    const isDuplicate = data.some(
      (item) => item.kode === form.kode && item.id !== editId
    );
    if (isDuplicate) {
      window.alert(`Kode "${form.kode}" sudah terdaftar!`);
      return;
    }

    if (editId) {
      // Edit mode
      api.put(`/master-barang-jasa/${editId}`, payload)
        .then(() => {
          fetchData();
          handleResetForm();
          setError("");
          window.alert("Data berhasil diupdate!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal update ke server";
          setError(errorMsg);
        });
    } else {
      // Insert mode
      api.post("/master-barang-jasa", payload)
        .then(() => {
          fetchData();
          handleResetForm();
          setError("");
          window.alert("Data berhasil disimpan!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal simpan ke server";
          setError(errorMsg);
        });
    }
  };

  const handleDelete = (row) => {
    if (window.confirm(`Apakah yakin ingin menghapus "${row.kode} - ${row.nama}"?`)) {
      api.delete(`/master-barang-jasa/${row.id}`)
        .then(() => {
          fetchData();
          window.alert("Data berhasil dihapus!");
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal menghapus data!";
          window.alert(errorMsg);
        });
    }
  };

  const handleEdit = (row) => {
    setForm({
      kode: row.kode,
      nama: row.nama,
      jenis: row.jenis,
      kelompokItem: row.kelompokItem || "",
      kategori: row.kategori || "",
      satuan: row.satuan || "",
      hargaBeli: row.hargaBeli?.toString() || "",
      hargaJual: row.hargaJual?.toString() || "",
      stokMinimal: row.stokMinimal?.toString() || "",
      deskripsi: row.deskripsi || "",
      diJual: row.diJual !== false,
      diBeli: row.diBeli !== false,
      image: row.image || "",
      aktif: row.aktif !== false
    });
    setGlAccount({
      persediaan: row.akunPersediaan || "",
      penjualan: row.akunPenjualan || "",
      returPenjualan: row.akunReturPenjualan || "",
      diskonPenjualan: row.akunDiskonPenjualan || "",
      hpp: row.akunHPP || "",
      returPembelian: row.akunReturPembelian || "",
      diskonKhusus: row.akunDiskonKhusus || "",
    });
    setFormattedHargaBeli(row.hargaBeli ? formatNumber(row.hargaBeli) : "");
    setFormattedHargaJual(row.hargaJual ? formatNumber(row.hargaJual) : "");
    setImagePreview(row.image || "");
    setEditId(row.id);
    setFormVisible(true); // <-- Ganti dari setShowForm(true) ke setFormVisible(true)
    setFormAnim("fade-down"); // <-- Tambahkan agar animasi muncul saat edit
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === "hargaBeli") {
      setFormattedHargaBeli(value);
      setForm(prev => ({ ...prev, [name]: unformatNumber(value) }));
    } else if (name === "hargaJual") {
      setFormattedHargaJual(value);
      setForm(prev => ({ ...prev, [name]: unformatNumber(value) }));
    } else if (type === "checkbox") {
      setForm(prev => ({ ...prev, [name]: checked }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleHargaBlur = (field) => {
    if (field === "hargaBeli" && formattedHargaBeli) {
      setFormattedHargaBeli(formatNumber(formattedHargaBeli));
    } else if (field === "hargaJual" && formattedHargaJual) {
      setFormattedHargaJual(formatNumber(formattedHargaJual));
    }
  };

  const handleHargaFocus = (field) => {
    if (field === "hargaBeli" && form.hargaBeli) {
      setFormattedHargaBeli(form.hargaBeli);
    } else if (field === "hargaJual" && form.hargaJual) {
      setFormattedHargaJual(form.hargaJual);
    }
  };

  // Handle image upload
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert("Ukuran file terlalu besar! Maksimal 5MB");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert("File harus berupa gambar!");
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
        setForm(prev => ({ ...prev, image: e.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setForm(prev => ({ ...prev, image: "" }));
  };

  const handleResetForm = () => {
    setForm({ 
      kode: "", 
      nama: "", 
      jenis: "BARANG",
      kelompokItem: "",
      kategori: "",
      satuan: "",
      hargaBeli: "",
      hargaJual: "",
      stokMinimal: "",
      deskripsi: "",
      diJual: true,
      diBeli: true,
      image: "",
      aktif: true
    });
    setFormattedHargaBeli("");
    setFormattedHargaJual("");
    setSelectedImage(null);
    setImagePreview("");
    setEditId(null);
    setError("");
  };

  const handleFilter = (e) => {
    setFilterText(e.target.value.toLowerCase());
  };

  const handlePrint = () => {
    const printContents = tableRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  // Filter data
  const filtered = data.filter((d) =>
    d.kode.toLowerCase().includes(filterKode.toLowerCase()) &&
    d.nama.toLowerCase().includes(filterNama.toLowerCase()) &&
    d.jenis.toLowerCase().includes(filterJenis.toLowerCase()) &&
    (d.kelompokItem || "").toLowerCase().includes(filterKelompokItem.toLowerCase()) &&
    (d.kategori || "").toLowerCase().includes(filterKategori.toLowerCase()) &&
    (
      filterText === "" ||
      d.kode.toLowerCase().includes(filterText) ||
      d.nama.toLowerCase().includes(filterText) ||
      d.jenis.toLowerCase().includes(filterText) ||
      (d.kelompokItem || "").toLowerCase().includes(filterText) ||
      (d.kategori || "").toLowerCase().includes(filterText)
    )
  );

  // Generate kode otomatis
  const generateKode = () => {
    const prefix = form.jenis === "BARANG" ? "BRG" : "JSA";
    const existingCodes = data
      .filter(item => item.kode.startsWith(prefix))
      .map(item => {
        const numPart = item.kode.substring(prefix.length);
        return parseInt(numPart) || 0;
      })
      .sort((a, b) => b - a);
    
    const nextNumber = existingCodes.length > 0 ? existingCodes[0] + 1 : 1;
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  };

  // Fungsi untuk kelompok item
  const handleKelompokSubmit = (e) => {
    e.preventDefault();
    if (!kelompokForm.kode || !kelompokForm.nama) {
      alert("Kode dan Nama kelompok wajib diisi!");
      return;
    }

    const isDuplicate = kelompokData.some(
      (item) => item.kode === kelompokForm.kode && item.id !== editKelompokId
    );
    if (isDuplicate) {
      alert(`Kode "${kelompokForm.kode}" sudah terdaftar!`);
      return;
    }

    if (editKelompokId) {
      api.put(`/master-kelompok-item/${editKelompokId}`, kelompokForm)
        .then(() => {
          fetchKelompokData();
          setKelompokForm({ kode: "", nama: "" });
          setEditKelompokId(null);
          alert("Kelompok item berhasil diupdate!");
        })
        .catch(() => alert("Gagal update kelompok item"));
    } else {
      api.post("/master-kelompok-item", kelompokForm)
        .then((res) => {
          fetchKelompokData();
          // Set form kelompok item dengan item yang baru ditambahkan
          if (res.data && res.data.kode) {
            setForm(prev => ({ ...prev, kelompokItem: res.data.kode }));
          }
          setKelompokForm({ kode: "", nama: "" });
          alert("Kelompok item berhasil disimpan!");
        })
        .catch(() => alert("Gagal simpan kelompok item"));
    }
  };

  const handleKelompokEdit = (item) => {
    setKelompokForm({ kode: item.kode, nama: item.nama });
    setEditKelompokId(item.id);
  };

  const handleKelompokDelete = (item) => {
    if (window.confirm(`Hapus kelompok "${item.nama}"?`)) {
      api.delete(`/master-kelompok-item/${item.id}`)
        .then(() => fetchKelompokData())
        .catch(() => alert("Gagal hapus kelompok item"));
    }
  };

  // Fungsi untuk kategori
  const handleKategoriSubmit = (e) => {
    e.preventDefault();
    if (!kategoriForm.kode || !kategoriForm.nama) {
      alert("Kode dan Nama kategori wajib diisi!");
      return;
    }

    const isDuplicate = kategoriData.some(
      (item) => item.kode === kategoriForm.kode && item.id !== editKategoriId
    );
    if (isDuplicate) {
      alert(`Kode "${kategoriForm.kode}" sudah terdaftar!`);
      return;
    }

    if (editKategoriId) {
      api.put(`/master-kategori/${editKategoriId}`, kategoriForm)
        .then(() => {
          fetchKategoriData();
          setKategoriForm({ kode: "", nama: "" });
          setEditKategoriId(null);
          alert("Kategori berhasil diupdate!");
        })
        .catch(() => alert("Gagal update kategori"));
    } else {
      api.post("/master-kategori", kategoriForm)
        .then((res) => {
          fetchKategoriData();
          // Set form kategori dengan item yang baru ditambahkan
          if (res.data && res.data.kode) {
            setForm(prev => ({ ...prev, kategori: res.data.kode }));
          }
          setKategoriForm({ kode: "", nama: "" });
          alert("Kategori berhasil disimpan!");
        })
        .catch(() => alert("Gagal simpan kategori"));
    }
  };

  const handleKategoriEdit = (item) => {
    setKategoriForm({ kode: item.kode, nama: item.nama });
    setEditKategoriId(item.id);
  };

  const handleKategoriDelete = (item) => {
    if (window.confirm(`Hapus kategori "${item.nama}"?`)) {
      api.delete(`/master-kategori/${item.id}`)
        .then(() => fetchKategoriData())
        .catch(() => alert("Gagal hapus kategori"));
    }
  };

  const [formAnim, setFormAnim] = useState("fade-down");
  const [formVisible, setFormVisible] = useState(true);

  const handleHideForm = () => {
    
 setFormAnim("fade-up"); // Jalankan animasi fade-up
  setTimeout(() => {
    setFormVisible(false); // Sembunyikan form setelah animasi selesai
  }, 300); // durasi animasi harus sama dengan CSS
  };

  const handleShowForm = () => {
    setFormVisible(true);
    setTimeout(() => setFormAnim("fade-down"), 10);
  };

  // Fungsi untuk mendapatkan nama kategori berdasarkan kode
  const getKategoriNama = (kode) => {
    const found = kategoriData.find(item => item.kode === kode);
    return found ? found.nama : kode || "-";
  };

  // Fungsi untuk mendapatkan nama kelompok item berdasarkan kode
  const getKelompokNama = (kode) => {
    const found = kelompokData.find(item => item.kode === kode);
    return found ? found.nama : kode || "-";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight" 
            style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
           Barang Dan Jasa
        </h1>
      </div>

      {/* Form Input Barang/Jasa & Akun GL */}
      {formVisible ? (
        <div
          className={`rounded-xl shadow-lg p-6 border ${formAnim}`}
          style={{ background: theme.formColor }}
        >
          <div className="flex justify-end mb-4">
            <button
              onClick={handleHideForm}
              className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out flex items-center gap-2"
              style={{
                background: theme.buttonUpdate,
                color: "#fff",
                fontFamily: theme.fontFamily,
              }}
              type="button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              Sembunyikan Form
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            {/* Tab Navigation di dalam form */}
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "Umum" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={e => { e.preventDefault(); setActiveTab("Umum"); }}
                style={{ fontFamily: theme.fontFamily }}
                type="button"
              >
                Umum
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "AkunGL" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={e => { e.preventDefault(); setActiveTab("AkunGL"); }}
                style={{ fontFamily: theme.fontFamily }}
                type="button"
              >
                Akun GL
              </button>
            </div>

            {/* Tab Content di dalam form */}
            {activeTab === "Umum" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Jenis
                  </label>
                  <select
                    name="jenis"
                    value={form.jenis}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  >
                    <option value="BARANG">Barang</option>
                    <option value="JASA">Jasa</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Kode
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="kode"
                      value={form.kode}
                      onChange={handleChange}
                      className="flex-1 border rounded-lg px-4 py-2 transition"
                      placeholder="Contoh: BRG001"
                      required
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, kode: generateKode() }))}
                      className="px-3 py-2 rounded-lg transition text-sm"
                      style={{
                        background: theme.buttonUpdate,
                        color: "#fff",
                        fontFamily: theme.fontFamily,
                      }}
                      title="Generate kode otomatis"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Nama
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    placeholder="Nama barang/jasa"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Kelompok Item
                  </label>
                  <select
                    name="kelompokItem"
                    value={form.kelompokItem}
                    onChange={e => {
                      if (e.target.value === "__add_new__") {
                        setShowKelompokModal(true);
                      } else {
                        handleChange(e);
                      }
                    }}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  >
                    <option value="">Pilih Kelompok Item</option>
                    {kelompokData.map((item) => (
                      <option key={item.id} value={item.kode}>
                        {item.nama}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: 'bold', color: '#0066cc' }}>
                      + Tambah Kelompok Item
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Kategori
                  </label>
                  <select
                    name="kategori"
                    value={form.kategori}
                    onChange={e => {
                      if (e.target.value === "__add_new__") {
                        setShowKategoriModal(true);
                      } else {
                        handleChange(e);
                      }
                    }}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  >
                    <option value="">Pilih Kategori</option>
                    {kategoriData.map((item) => (
                      <option key={item.id} value={item.kode}>
                        {item.nama}
                      </option>
                    ))}
                    <option value="__add_new__" style={{ fontWeight: 'bold', color: '#0066cc' }}>
                      + Tambah Kategori
                    </option>
                  </select>
                </div>

                {form.jenis === "BARANG" && (
                  <div>
                    <label className="block mb-1 font-semibold" 
                           style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Satuan
                    </label>
                    <input
                      type="text"
                      name="satuan"
                      value={form.satuan}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-2 transition"
                      placeholder="Contoh: pcs, kg, liter"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </div>
                )}

                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Harga Beli
                  </label>
                  <input
                    type="text"
                    name="hargaBeli"
                    value={formattedHargaBeli}
                    onChange={handleChange}
                    onBlur={() => handleHargaBlur("hargaBeli")}
                    onFocus={() => handleHargaFocus("hargaBeli")}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    placeholder="0.00"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>

                <div>
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Harga Jual
                  </label>
                  <input
                    type="text"
                    name="hargaJual"
                    value={formattedHargaJual}
                    onChange={handleChange}
                    onBlur={() => handleHargaBlur("hargaJual")}
                    onFocus={() => handleHargaFocus("hargaJual")}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    placeholder="0.00"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>

                {form.jenis === "BARANG" && (
                  <div>
                    <label className="block mb-1 font-semibold" 
                           style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Stok Minimal
                    </label>
                    <input
                      type="number"
                      name="stokMinimal"
                      value={form.stokMinimal}
                      onChange={handleChange}
                      className="w-full border rounded-lg px-4 py-2 transition"
                      placeholder="0"
                      min="0"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </div>
                )}

                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Deskripsi
                  </label>
                  <textarea
                    name="deskripsi"
                    value={form.deskripsi}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border rounded-lg px-4 py-2 transition"
                    placeholder="Deskripsi opsional"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="diJual"
                    checked={form.diJual}
                    onChange={handleChange}
                    id="diJual"
                    className="rounded"
                  />
                  <label htmlFor="diJual" className="font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Dijual
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="diBeli"
                    checked={form.diBeli}
                    onChange={handleChange}
                    id="diBeli"
                    className="rounded"
                  />
                  <label htmlFor="diBeli" className="font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Dibeli
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="aktif"
                    checked={form.aktif}
                    onChange={handleChange}
                    id="aktif"
                    className="rounded"
                  />
                  <label htmlFor="aktif" className="font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Aktif
                  </label>
                </div>

                <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                  <label className="block mb-1 font-semibold" 
                         style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Gambar Produk
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="border rounded-lg px-4 py-2 transition"
                        style={{
                          background: theme.fieldColor,
                          color: theme.fontColor,
                          fontFamily: theme.fontFamily,
                        }}
                      />
                      {imagePreview && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="px-3 py-2 rounded-lg font-semibold transition text-sm"
                          style={{
                            background: theme.buttonHapus,
                            color: "#fff",
                            fontFamily: theme.fontFamily,
                          }}
                        >
                          Hapus Gambar
                        </button>
                      )}
                    </div>
                    
                    {imagePreview && (
                      <div className="border rounded-lg p-4" style={{ background: theme.fieldColor }}>
                        <p className="text-sm mb-2" style={{ color: theme.fontColor }}>Preview:</p>
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-xs max-h-48 object-contain border rounded"
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
                    <div className="text-red-500 text-sm">{error}</div>
                  </div>
                )}                
              </div>
            )}

            {activeTab === "AkunGL" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun Persediaan
                  </label>
                  <select
                    value={glAccount.persediaan}
                    onChange={e => setGlAccount(prev => ({ ...prev, persediaan: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun Persediaan</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun Penjualan
                  </label>
                  <select
                    value={glAccount.penjualan}
                    onChange={e => setGlAccount(prev => ({ ...prev, penjualan: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun Penjualan</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun Retur Penjualan
                  </label>
                  <select
                    value={glAccount.returPenjualan}
                    onChange={e => setGlAccount(prev => ({ ...prev, returPenjualan: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun Retur Penjualan</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun Diskon Penjualan
                  </label>
                  <select
                    value={glAccount.diskonPenjualan}
                    onChange={e => setGlAccount(prev => ({ ...prev, diskonPenjualan: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun Diskon Penjualan</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun HPP
                  </label>
                  <select
                    value={glAccount.hpp}
                    onChange={e => setGlAccount(prev => ({ ...prev, hpp: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun HPP</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun Retur Pembelian
                  </label>
                  <select
                    value={glAccount.returPembelian}
                    onChange={e => setGlAccount(prev => ({ ...prev, returPembelian: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun Retur Pembelian</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Akun Diskon Khusus
                  </label>
                  <select
                    value={glAccount.diskonKhusus}
                    onChange={e => setGlAccount(prev => ({ ...prev, diskonKhusus: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                    required
                  >
                    <option value="">Pilih Akun Diskon Khusus</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.kode}>
                        {coa.kode} - {coa.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Tombol submit dan reset hanya satu kali di bawah tab content */}
            <div className="md:col-span-2 lg:col-span-3 xl:col-span-4 mt-6">
              <div className="flex gap-2 justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg font-semibold transition"
                  style={{
                    background: theme.buttonSimpan,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  {editId ? 'Update' : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 rounded-lg font-semibold transition"
                  style={{
                    background: theme.buttonRefresh,
                    color: "#fff",
                    fontFamily: theme.fontFamily,
                  }}
                >
                  Kosongkan
                </button>
                {editId && (
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="px-4 py-2 rounded-lg font-semibold transition"
                    style={{
                      background: theme.buttonHapus,
                      color: "#fff",
                      fontFamily: theme.fontFamily,
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={handleShowForm}
            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 ease-in-out flex items-center gap-2"
            style={{
              background: theme.buttonUpdate,
              color: "#fff",
              fontFamily: theme.fontFamily,
            }}
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            Tampilkan Form
          </button>
        </div>
      )}

      {/* Tabel Data */}
      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Cari kode/nama/jenis/kelompok/kategori..."
            className="border rounded-lg px-3 py-2 w-full md:w-64 transition"
            value={filterText}
            onChange={handleFilter}
            style={{
              background: theme.fieldColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
            }}
          />
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg font-semibold transition print:hidden"
            type="button"
            style={{
              background: theme.buttonSimpan,
              color: "#fff",
              fontFamily: theme.fontFamily,
            }}
          >
            Print
          </button>
        </div>
        
        <div ref={tableRef} style={{ maxHeight: '500px', overflowY: 'auto' }}>
          <table className="w-full border rounded-lg text-sm shadow-sm" 
                 style={{ fontFamily: theme.tableFontFamily }}>
            <thead>
              <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                <th className="px-3 py-2 font-semibold border-b">Kode</th>
                <th className="px-3 py-2 font-semibold border-b">Nama</th>
                <th className="px-3 py-2 font-semibold border-b">Jenis</th>
                <th className="px-3 py-2 font-semibold border-b">Kelompok Item</th>
                <th className="px-3 py-2 font-semibold border-b">Kategori</th>
                <th className="px-3 py-2 font-semibold border-b">Satuan</th>
                <th className="px-3 py-2 font-semibold border-b">Harga Beli</th>
                <th className="px-3 py-2 font-semibold border-b">Harga Jual</th>
                <th className="px-3 py-2 font-semibold border-b">Dijual</th>
                <th className="px-3 py-2 font-semibold border-b">Dibeli</th>
                <th className="px-3 py-2 font-semibold border-b">Status</th>
                <th className="px-3 py-2 font-semibold border-b">Aksi</th>
              </tr>
              <tr>
                <th className="px-3 py-1 border-b">
                  <input
                    type="text"
                    value={filterKode}
                    onChange={e => setFilterKode(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                    placeholder="Filter kode"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                    }}
                  />
                </th>
                <th className="px-3 py-1 border-b">
                  <input
                    type="text"
                    value={filterNama}
                    onChange={e => setFilterNama(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                    placeholder="Filter nama"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                    }}
                  />
                </th>
                <th className="px-3 py-1 border-b">
                  <select
                    value={filterJenis}
                    onChange={e => setFilterJenis(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                    }}
                  >
                    <option value="">Semua</option>
                    <option value="BARANG">Barang</option>
                    <option value="JASA">Jasa</option>
                  </select>
                </th>
                <th className="px-3 py-1 border-b">
                  <input
                    type="text"
                    value={filterKelompokItem}
                    onChange={e => setFilterKelompokItem(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                    placeholder="Filter kelompok"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                    }}
                  />
                </th>
                <th className="px-3 py-1 border-b">
                  <input
                    type="text"
                    value={filterKategori}
                    onChange={e => setFilterKategori(e.target.value)}
                    className="w-full border rounded px-2 py-1 text-xs"
                    placeholder="Filter kategori"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                    }}
                  />
                </th>
                <th colSpan="7" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" 
                    style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                  <td className="px-3 py-2">{row.kode}</td>
                  <td className="px-3 py-2">{row.nama}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.jenis === 'BARANG' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {row.jenis}
                    </span>
                  </td>
                  <td className="px-3 py-2">{getKelompokNama(row.kelompokItem)}</td>
                  <td className="px-3 py-2">{getKategoriNama(row.kategori)}</td>
                  <td className="px-3 py-2">{row.satuan || "-"}</td>
                  <td className="px-3 py-2 text-right">
                    {row.hargaBeli ? formatNumber(row.hargaBeli) : "-"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.hargaJual ? formatNumber(row.hargaJual) : "-"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.diJual ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.diJual ? 'Ya' : 'Tidak'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.diBeli ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.diBeli ? 'Ya' : 'Tidak'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      row.aktif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {row.aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(row)}
                        className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                        style={{
                          background: theme.buttonUpdate,
                          color: "#fff",
                          fontFamily: theme.fontFamily,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row)}
                        className="px-3 py-1 rounded-lg font-semibold transition text-sm"
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Kelompok Item */}
      {showKelompokModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
               style={{ background: theme.formColor }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" 
                  style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Master Kelompok Item
              </h2>
              <button
                onClick={() => {
                  setShowKelompokModal(false);
                  setKelompokForm({ kode: "", nama: "" });
                  setEditKelompokId(null);
                  if (form.kelompokItem === "__add_new__") {
                    setForm(prev => ({ ...prev, kelompokItem: "" }));
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Input */}
              <div>
                <form onSubmit={handleKelompokSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-semibold" 
                           style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Kode Kelompok Item
                    </label>
                    <input
                      type="text"
                      value={kelompokForm.kode}
                      onChange={(e) => setKelompokForm(prev => ({ ...prev, kode: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2 transition"
                      placeholder="Contoh: KLM001"
                      required
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-semibold" 
                           style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Nama Kelompok Item
                    </label>
                    <input
                      type="text"
                      value={kelompokForm.nama}
                      onChange={(e) => setKelompokForm(prev => ({ ...prev, nama: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2 transition"
                      placeholder="Nama kelompok item"
                      required
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg font-semibold transition"
                      style={{
                        background: theme.buttonSimpan,
                        color: "#fff",
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      {editKelompokId ? 'Update' : 'Simpan'}
                    </button>
                    {editKelompokId && (
                      <button
                        type="button"
                        onClick={() => {
                          setKelompokForm({ kode: "", nama: "" });
                          setEditKelompokId(null);
                        }}
                        className="px-4 py-2 rounded-lg font-semibold transition"
                        style={{
                          background: theme.buttonHapus,
                          color: "#fff",
                          fontFamily: theme.fontFamily,
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
              
              {/* Tabel List */}
              <div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="w-full border rounded-lg text-sm shadow-sm" 
                         style={{ fontFamily: theme.tableFontFamily }}>
                    <thead>
                      <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                        <th className="px-3 py-2 font-semibold border-b">Kode</th>
                        <th className="px-3 py-2 font-semibold border-b">Nama</th>
                        <th className="px-3 py-2 font-semibold border-b">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kelompokData.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0" 
                            style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                          <td className="px-3 py-2">{item.kode}</td>
                          <td className="px-3 py-2">{item.nama}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleKelompokEdit(item)}
                                className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                                style={{
                                  background: theme.buttonUpdate,
                                  color: "#fff",
                                  fontFamily: theme.fontFamily,
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleKelompokDelete(item)}
                                className="px-3 py-1 rounded-lg font-semibold transition text-sm"
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Kategori */}
      {showKategoriModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
               style={{ background: theme.formColor }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" 
                  style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                Master Kategori
              </h2>
              <button
                onClick={() => {
                  setShowKategoriModal(false);
                  setKategoriForm({ kode: "", nama: "" });
                  setEditKategoriId(null);
                  if (form.kategori === "__add_new__") {
                    setForm(prev => ({ ...prev, kategori: "" }));
                  }
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Input */}
              <div>
                <form onSubmit={handleKategoriSubmit} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-semibold" 
                           style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Kode Kategori
                    </label>
                    <input
                      type="text"
                      value={kategoriForm.kode}
                      onChange={(e) => setKategoriForm(prev => ({ ...prev, kode: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2 transition"
                      placeholder="Contoh: KAT001"
                      required
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-semibold" 
                           style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Nama Kategori
                    </label>
                    <input
                      type="text"
                      value={kategoriForm.nama}
                      onChange={(e) => setKategoriForm(prev => ({ ...prev, nama: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2 transition"
                      placeholder="Nama kategori"
                      required
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-6 py-2 rounded-lg font-semibold transition"
                      style={{
                        background: theme.buttonSimpan,
                        color: "#fff",
                        fontFamily: theme.fontFamily,
                      }}
                    >
                      {editKategoriId ? 'Update' : 'Simpan'}
                    </button>
                    {editKategoriId && (
                      <button
                        type="button"
                        onClick={() => {
                          setKategoriForm({ kode: "", nama: "" });
                          setEditKategoriId(null);
                        }}
                        className="px-4 py-2 rounded-lg font-semibold transition"
                        style={{
                          background: theme.buttonHapus,
                          color: "#fff",
                          fontFamily: theme.fontFamily,
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
              
              {/* Tabel List */}
              <div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table className="w-full border rounded-lg text-sm shadow-sm" 
                         style={{ fontFamily: theme.tableFontFamily }}>
                    <thead>
                      <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                        <th className="px-3 py-2 font-semibold border-b">Kode</th>
                        <th className="px-3 py-2 font-semibold border-b">Nama</th>
                        <th className="px-3 py-2 font-semibold border-b">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kategoriData.map((item) => (
                        <tr key={item.id} className="border-b last:border-b-0" 
                            style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                          <td className="px-3 py-2">{item.kode}</td>
                          <td className="px-3 py-2">{item.nama}</td>
                          <td className="px-3 py-2">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleKategoriEdit(item)}
                                className="px-3 py-1 rounded-lg font-semibold transition text-sm"
                                style={{
                                  background: theme.buttonUpdate,
                                  color: "#fff",
                                  fontFamily: theme.fontFamily,
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleKategoriDelete(item)}
                                className="px-3 py-1 rounded-lg font-semibold transition text-sm"
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
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
