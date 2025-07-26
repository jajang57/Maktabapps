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
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(10);
  const tableRef = useRef();

  const [filterKode, setFilterKode] = useState("");
  const [filterNama, setFilterNama] = useState("");
  const [filterKategori, setFilterKategori] = useState("");
  
  // State untuk format angka saldo awal
  const [formattedSaldoAwal, setFormattedSaldoAwal] = useState("");

  // Fungsi untuk format angka dengan 2 desimal tanpa rounding
  const formatNumber = (value) => {
    if (!value || value === '') return '';
    
    // Hapus semua karakter non-digit dan titik desimal
    let cleanValue = value.toString().replace(/[^\d.]/g, '');
    
    // Pastikan hanya ada satu titik desimal
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    // Convert ke number
    const numericValue = parseFloat(cleanValue) || 0;
    
    // Format dengan pemisah ribuan (koma) dan desimal (titik) - format internasional
    // Tanpa rounding, langsung format apa adanya
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numericValue);
  };

  // Fungsi untuk unformat angka (hapus format untuk simpan ke database)
  const unformatNumber = (value) => {
    if (!value) return '';
    // Untuk format internasional: 1,234,567.89
    // Hapus semua koma (pemisah ribuan) dan biarkan titik (desimal)
    const cleaned = value.toString()
      .replace(/,/g, '');  // Hapus koma pemisah ribuan
    return cleaned;
  };

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
      .then((res) => {
        // Sort kategori berdasarkan kode ascending
        const sortedKategori = res.data.sort((a, b) => a.kode.localeCompare(b.kode));
        setKategoriList(sortedKategori);
      })
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
      saldoAwal: form.saldoAwal ? parseFloat(unformatNumber(form.saldoAwal)) : 0,
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
              setFormattedSaldoAwal("");
              setEditId(null);
              setError("");
            });
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal update ke server";
          setError(errorMsg);
        });
    } else {
      // Insert mode
      api.post("/master-coa", payload)
        .then(() => {
          api.get("/master-coa")
            .then((res) => {
              setData(res.data);
              setFilteredData(res.data);
              setForm({ kode: "", nama: "", masterCategoryCOAId: "", saldoAwal: "" });
              setFormattedSaldoAwal("");
              setError("");
            });
        })
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal simpan ke server";
          setError(errorMsg);
        });
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
        .catch((err) => {
          const errorMsg = err.response?.data?.error || "Gagal menghapus data!";
          window.alert(errorMsg);
        });
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
    setFormattedSaldoAwal(row.saldoAwal ? formatNumber(row.saldoAwal) : "");
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
              ? `${d.masterCategoryCOA.kode} - ${d.masterCategoryCOA.nama} ${d.masterCategoryCOA.tipeAkun}`.toLowerCase()
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
    
    // Khusus untuk saldo awal
    if (name === "saldoAwal") {
      setFormattedSaldoAwal(value);
      setForm(prev => ({ ...prev, [name]: unformatNumber(value) }));
    } 
    // Khusus untuk kategori COA - generate kode otomatis
    else if (name === "masterCategoryCOAId") {
      setForm(prev => ({ ...prev, [name]: value }));
      
      // Generate kode otomatis jika bukan mode edit
      if (!editId && value) {
        const generatedKode = generateKodeCOA(value);
        setForm(prev => ({ ...prev, kode: generatedKode }));
      }
    }
    // Field lainnya
    else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Fungsi untuk format angka saat blur (kehilangan focus)
  const handleSaldoAwalBlur = () => {
    if (formattedSaldoAwal) {
      const formatted = formatNumber(formattedSaldoAwal);
      setFormattedSaldoAwal(formatted);
    }
  };

  // Fungsi untuk menghilangkan format saat focus (field di-klik)
  const handleSaldoAwalFocus = () => {
    if (form.saldoAwal) {
      setFormattedSaldoAwal(form.saldoAwal); // Tampilkan nilai mentah
    }
  };

  // Fungsi untuk kosongkan/reset form
  const handleResetForm = () => {
    setForm({ kode: "", nama: "", masterCategoryCOAId: "", saldoAwal: "" });
    setFormattedSaldoAwal("");
    setEditId(null);
    setError("");
  };

  // Filter data berdasarkan filter kolom
  const filtered = data.filter((d) =>
    d.kode.toLowerCase().includes(filterKode.toLowerCase()) &&
    d.nama.toLowerCase().includes(filterNama.toLowerCase()) &&
    (
      d.masterCategoryCOA
        ? `${d.masterCategoryCOA.kode} - ${d.masterCategoryCOA.nama} ${d.masterCategoryCOA.tipeAkun}`.toLowerCase()
        : ""
    ).includes(filterKategori.toLowerCase()) &&
    (
      filterText === "" ||
      d.kode.toLowerCase().includes(filterText) ||
      d.nama.toLowerCase().includes(filterText) ||
      (
        d.masterCategoryCOA
          ? `${d.masterCategoryCOA.kode} - ${d.masterCategoryCOA.nama} ${d.masterCategoryCOA.tipeAkun}`.toLowerCase()
          : ""
      ).includes(filterText)
    )
  );

  // Group data by kategori
  const groupedData = filtered.reduce((acc, coa) => {
    const kategori =
      coa.masterCategoryCOA
        ? `${coa.masterCategoryCOA.kode} - ${coa.masterCategoryCOA.nama} (${coa.masterCategoryCOA.tipeAkun})`
        : "Tanpa Kategori";
    if (!acc[kategori]) acc[kategori] = [];
    acc[kategori].push(coa);
    return acc;
  }, {});

  // Sort the groups by kategori kode, then sort items within each group by kode akun
  const sortedGroupedData = {};
  Object.keys(groupedData)
    .sort((a, b) => {
      // Extract kode from kategori string for sorting
      const kodeA = a.includes(' - ') ? a.split(' - ')[0] : 'ZZZ'; // Tanpa kategori goes last
      const kodeB = b.includes(' - ') ? b.split(' - ')[0] : 'ZZZ';
      return kodeA.localeCompare(kodeB);
    })
    .forEach(kategori => {
      // Sort items within each category by kode akun
      sortedGroupedData[kategori] = groupedData[kategori].sort((a, b) => 
        a.kode.localeCompare(b.kode)
      );
    });

  // Flatten grouped data with header rows
  const flatData = [];
  Object.entries(sortedGroupedData).forEach(([kategori, items]) => {
    flatData.push({ isHeader: true, kategori });
    items.forEach((item) => flatData.push(item));
  });

  // Paging removed: show all data in scrollable table
  const pagedData = flatData;

  // Fungsi untuk generate kode COA berdasarkan kategori
  const generateKodeCOA = (kategoryCOAId) => {
    if (!kategoryCOAId) return "";
    
    // Cari kategori yang dipilih
    const selectedKategori = kategoriList.find(k => String(k.id) === String(kategoryCOAId));
    if (!selectedKategori) return "";
    
    const kodeKategori = selectedKategori.kode;
    
    // Filter data COA berdasarkan kategori yang sama (tidak termasuk data yang sedang diedit)
    const coaInSameCategory = data.filter(coa => {
      const isInSameCategory = coa.masterCategoryCOA && String(coa.masterCategoryCOA.id) === String(kategoryCOAId);
      const isNotCurrentEdit = editId ? coa.id !== editId : true;
      return isInSameCategory && isNotCurrentEdit;
    });
    
    // Jika tidak ada COA dalam kategori ini, mulai dari format default
    if (coaInSameCategory.length === 0) {
      // Cek apakah kode kategori sudah berformat x-xxx, jika ya gunakan format yang sama
      if (kodeKategori.includes('-')) {
        const parts = kodeKategori.split('-');
        const prefixKategori = parts[0]; // Ambil bagian sebelum strip pertama
        return `${prefixKategori}-001`; // Format 3 digit dengan leading zero
      } else {
        return `${kodeKategori}001`;
      }
    }
    
    // Cari kode dengan format separator - untuk menentukan pola
    const coaWithSeparator = coaInSameCategory.find(coa => coa.kode.includes('-'));
    
    if (coaWithSeparator) {
      // Ada data dengan separator -, ikuti pola tersebut
      // Ambil semua nomor setelah separator terakhir dari kode-kode yang ada
      const nomorUrut = coaInSameCategory
        .map(coa => {
          const kodeStr = coa.kode.toString();
          const parts = kodeStr.split('-');
          
          if (parts.length >= 2) {
            // Ambil angka setelah strip terakhir, batasi 3 digit terakhir
            const nomorBelakang = parts[parts.length - 1];
            
            // Batasi hanya 3 digit terakhir
            let limitedNumber;
            if (nomorBelakang.length > 3) {
              limitedNumber = nomorBelakang.slice(-3); // Ambil 3 digit terakhir
            } else {
              limitedNumber = nomorBelakang;
            }
            
            const nomor = parseInt(limitedNumber, 10);
            console.log(`Parsing kode ${kodeStr}: parts=${JSON.stringify(parts)}, nomorBelakang="${nomorBelakang}", limited="${limitedNumber}", parsed=${nomor}`);
            return isNaN(nomor) ? 0 : nomor;
          }
          return 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => b - a); // Sort descending untuk ambil yang terbesar
      
      // Ambil nomor terbesar dan tambah 1
      const maxNumber = nomorUrut.length > 0 ? nomorUrut[0] : 0;
      const nextNumber = maxNumber + 1;
      
      // Format nextNumber dengan 3 digit (leading zero)
      const formattedNextNumber = nextNumber.toString().padStart(3, '0');
      
      // Ambil prefix dari kode sample (bagian sebelum strip terakhir)
      const sampleKode = coaWithSeparator.kode;
      const sampleParts = sampleKode.split('-');
      
      let prefix;
      if (sampleParts.length >= 2) {
        // Ambil semua bagian kecuali bagian terakhir, lalu gabungkan dengan -
        prefix = sampleParts.slice(0, -1).join('-');
      } else {
        prefix = sampleParts[0];
      }
      
      const finalResult = `${prefix}-${formattedNextNumber}`;
      
      console.log(`Generate dengan separator (3 digit):`, {
        sampleKode,
        sampleParts,
        prefix,
        maxNumber,
        nextNumber,
        formattedNextNumber,
        finalResult
      });
      
      return finalResult;
      
    } else {
      // Tidak ada separator, gunakan format tanpa separator
      const nomorUrut = coaInSameCategory
        .map(coa => {
          const kodeStr = coa.kode.toString();
          if (kodeStr.startsWith(kodeKategori)) {
            const nomorBagian = kodeStr.substring(kodeKategori.length);
            const nomor = parseInt(nomorBagian, 10);
            return isNaN(nomor) ? 0 : nomor;
          }
          return 0;
        })
        .filter(num => num > 0)
        .sort((a, b) => b - a);
      
      const maxNumber = nomorUrut.length > 0 ? nomorUrut[0] : 0;
      const nextNumber = maxNumber + 1;
      const formattedNumber = nextNumber.toString().padStart(3, '0');
      
      return `${kodeKategori}${formattedNumber}`;
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight mb-4">Master COA</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border"
        >
          <div className="space-y-4">
            {/* Button Kosongkan di atas form */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 transition text-sm"
                title="Kosongkan semua field"
              >
                Kosongkan
              </button>
            </div>
            
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Kode Akun
                {!editId && (
                  <span className="text-sm text-gray-500 font-normal ml-2">
                    (Auto-generate saat pilih kategori)
                  </span>
                )}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="kode"
                  value={form.kode}
                  onChange={handleChange}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                  placeholder="Contoh: 1001"
                  required
                />
                <button
                  type="button"
                  onClick={() => {
                    if (form.masterCategoryCOAId) {
                      const generatedKode = generateKodeCOA(form.masterCategoryCOAId);
                      setForm(prev => ({ ...prev, kode: generatedKode }));
                    } else {
                      alert("Pilih kategori COA terlebih dahulu!");
                    }
                  }}
                  disabled={!form.masterCategoryCOAId}
                  className="bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition text-sm"
                  title="Generate kode otomatis berdasarkan kategori"
                >
                  Auto
                </button>
              </div>
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
                    {kat.kode} - {kat.nama} ({kat.tipeAkun})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-gray-700">
                Saldo Awal
              </label>
              <input
                type="text"
                name="saldoAwal"
                value={formattedSaldoAwal}
                onChange={handleChange}
                onBlur={handleSaldoAwalBlur}
                onFocus={handleSaldoAwalFocus}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                placeholder="Masukkan saldo awal"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
              >
                {editId ? 'Update' : 'Simpan'}
              </button>
              {editId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition"
                >
                  Cancel
                </button>
              )}
            </div>
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
          <div ref={tableRef} style={{ maxHeight: '500px', overflowY: 'auto' }}>
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
                          ? `${row.masterCategoryCOA.kode} - ${row.masterCategoryCOA.nama} (${row.masterCategoryCOA.tipeAkun})`
                          : "-"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {row.saldoAwal ? formatNumber(row.saldoAwal) : '0'}
                      </td>
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
            {/* Pagination removed: now using scrollable table */}
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