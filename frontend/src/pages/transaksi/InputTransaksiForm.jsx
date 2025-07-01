import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import api from "../../utils/api";
import { useAuth } from "../../context/AuthContext";

// Tambahkan fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
function getTodayLocal() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

// Fungsi untuk format angka dengan pemisah ribuan koma dan desimal titik
function formatNumber(value) {
  if (!value) return '';
  
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
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numericValue);
}

// Fungsi untuk mengubah format angka kembali ke number
function parseFormattedNumber(value) {
  if (!value) return '';
  // Hapus semua koma (pemisah ribuan) dan biarkan titik (desimal)
  return value.toString().replace(/,/g, '');
}

const InputTransaksiForm = forwardRef(({ onCOAChange, afterSubmit }, ref) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    noTransaksi: "",
    coaAkunBank: "",
    tanggal: getTodayLocal(),
    akunTransaksi: "",
    deskripsi: "",
    projectNo: "",
    projectName: "",
    debit: "",
    kredit: ""
  });

  const [coaList, setCoaList] = useState([]);
  const [akunTransaksiOptions, setAkunTransaksiOptions] = useState([]);
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [isGeneratingNoTransaksi, setIsGeneratingNoTransaksi] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTransaksiId, setSelectedTransaksiId] = useState(null);
  
  // State untuk nilai yang diformat
  const [formattedDebit, setFormattedDebit] = useState('');
  const [formattedKredit, setFormattedKredit] = useState('');

  // Fungsi untuk handle double click row (untuk edit)
  const handleRowDoubleClick = useCallback((transaksi) => {
    console.log("handleRowDoubleClick called with:", transaksi);
    console.log("Available COA List:", coaList);
    
    setIsEditMode(true);
    setSelectedTransaksiId(transaksi.id);
    
    // Format tanggal dari ISO string ke YYYY-MM-DD
    const tanggalFormatted = transaksi.tanggal ? 
      new Date(transaksi.tanggal).toISOString().split('T')[0] : 
      getTodayLocal();
    
    // Cari COA berdasarkan kode atau ID
    let coaAkunBankValue = transaksi.coaAkunBank || "";
    
    // Jika coaAkunBank adalah kode, cari ID-nya
    const coaByKode = coaList.find(coa => coa.kode === transaksi.coaAkunBank);
    const coaById = coaList.find(coa => String(coa.id) === String(transaksi.coaAkunBank));
    
    if (coaByKode) {
      coaAkunBankValue = String(coaByKode.id);
      console.log("Found COA by kode:", coaByKode);
    } else if (coaById) {
      coaAkunBankValue = String(coaById.id);
      console.log("Found COA by ID:", coaById);
    }
    
    console.log("Setting coaAkunBank to:", coaAkunBankValue);
    
    const newFormData = {
      noTransaksi: transaksi.noTransaksi || "",
      coaAkunBank: coaAkunBankValue,
      tanggal: tanggalFormatted,
      akunTransaksi: transaksi.akunTransaksi || "",
      deskripsi: transaksi.deskripsi || "",
      projectNo: transaksi.projectNo || "",
      projectName: transaksi.projectName || "",
      debit: transaksi.debit || "",
      kredit: transaksi.kredit || ""
    };
    
    console.log("Setting form data:", newFormData);
    setForm(newFormData);
    
    // Set nilai yang diformat untuk debit dan kredit
    setFormattedDebit(transaksi.debit ? formatNumber(transaksi.debit) : '');
    setFormattedKredit(transaksi.kredit ? formatNumber(transaksi.kredit) : '');
    
    // Trigger COA change untuk parent component
    if (onCOAChange && coaAkunBankValue) {
      onCOAChange(coaAkunBankValue);
    }
  }, [coaList, onCOAChange]);

  // Fungsi untuk reset form (Cancel)
  const handleResetForm = useCallback(() => {
    setForm({
      noTransaksi: "",
      coaAkunBank: "",
      tanggal: getTodayLocal(),
      akunTransaksi: "",
      deskripsi: "",
      projectNo: "",
      projectName: "",
      debit: "",
      kredit: ""
    });
    setFormattedDebit('');
    setFormattedKredit('');
    setIsEditMode(false);
    setSelectedTransaksiId(null);
  }, []);

  // Expose handleEdit function to parent via ref
  useImperativeHandle(ref, () => ({
    handleEdit: handleRowDoubleClick,
    resetForm: handleResetForm
  }), [handleRowDoubleClick, handleResetForm]);

  useEffect(() => {
    api.get("/coa-kas-bank")
      .then(res => setCoaList(res.data))
      .catch(() => setCoaList([]));
  }, []);

  useEffect(() => {
    api.get("/master-coa")
      .then(res => {
        setMasterCoaList(res.data);
        // Filter untuk menghilangkan COA yang sedang dipilih sebagai COA Akun Bank
        const filteredOptions = res.data
          .filter(coa => {
            // Cari COA Bank yang sedang dipilih
            const selectedCOA = coaList.find(bankCoa => String(bankCoa.id) === String(form.coaAkunBank));
            // Jika ada COA Bank yang dipilih, hilangkan dari opsi akun transaksi
            return !selectedCOA || coa.kode !== selectedCOA.kode;
          })
          .sort((a, b) => {
            // Urutkan berdasarkan kode akun secara ascending (numerik)
            const kodeA = parseFloat(a.kode) || 0;
            const kodeB = parseFloat(b.kode) || 0;
            if (kodeA !== kodeB) {
              return kodeA - kodeB;
            }
            // Jika sama secara numerik, urutkan secara alfabet
            return a.kode.localeCompare(b.kode);
          })
          .map(coa => ({
            value: coa.kode.toString(),
            label: `(${coa.kode}) ${coa.nama}`,
            masterCategoryCOA: coa.masterCategoryCOA
          }));
        
        setAkunTransaksiOptions(filteredOptions);
      })
      .catch(() => {
        setMasterCoaList([]);
        setAkunTransaksiOptions([]);
      });
  }, [coaList, form.coaAkunBank]); // Tambahkan dependency

  // Debug: Log form changes
  useEffect(() => {
    console.log("Form state changed:", form);
  }, [form]);

  // Debug: Log COA list changes
  useEffect(() => {
    console.log("COA List updated:", coaList);
  }, [coaList]);

  // Fungsi untuk generate nomor transaksi otomatis
  const generateNoTransaksi = async () => {
    if (!form.coaAkunBank || !form.tanggal || !user?.id) {
      console.log("Generate nomor transaksi cancelled - missing data:", {
        coaAkunBank: form.coaAkunBank,
        tanggal: form.tanggal,
        userId: user?.id
      });
      return;
    }

    // Cari kode bank dari ID yang dipilih
    const selectedCOA = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
    if (!selectedCOA || !selectedCOA.kode) {
      console.log("COA Bank tidak ditemukan atau tidak memiliki kode:", selectedCOA);
      return;
    }

    console.log("Generating nomor transaksi with:", {
      kodeBank: selectedCOA.kode,
      userID: user.id,
      tanggal: form.tanggal
    });

    setIsGeneratingNoTransaksi(true);
    try {
      const response = await api.get("/generate-no-transaksi", {
        params: {
          kodeBank: selectedCOA.kode,
          userID: user.id,
          tanggal: form.tanggal
        }
      });
      
      console.log("Generated nomor transaksi:", response.data.noTransaksi);
      
      setForm(prev => ({
        ...prev,
        noTransaksi: response.data.noTransaksi
      }));
    } catch (error) {
      console.error("Error generating nomor transaksi:", error);
      alert("Gagal generate nomor transaksi: " + (error.response?.data?.error || error.message));
    } finally {
      setIsGeneratingNoTransaksi(false);
    }
  };

  // Auto-generate nomor transaksi ketika coaAkunBank atau tanggal berubah
  useEffect(() => {
    // Hanya generate jika bukan mode edit
    if (!isEditMode && form.coaAkunBank && form.tanggal && user?.id) {
      generateNoTransaksi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.coaAkunBank, form.tanggal, user?.id, isEditMode]);

  // Fungsi untuk hapus transaksi
  const handleDeleteTransaksi = async () => {
    if (!selectedTransaksiId) {
      alert("Pilih transaksi yang ingin dihapus dengan double-click terlebih dahulu");
      return;
    }

    if (!confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      return;
    }

    try {
      await api.delete(`/input-transaksi/${selectedTransaksiId}`);
      alert("Transaksi berhasil dihapus!");
      handleResetForm();
      if (afterSubmit) afterSubmit(form.coaAkunBank);
    } catch (err) {
      alert("Gagal menghapus transaksi");
    }
  };

  // Fungsi untuk mengecek apakah akun transaksi adalah kas & bank
  const isAkunTransaksiKasBank = (kodeAkun) => {
    const akunTransaksi = masterCoaList.find(coa => String(coa.kode) === String(kodeAkun));
    return akunTransaksi && akunTransaksi.masterCategoryCOA && akunTransaksi.masterCategoryCOA.isKasBank;
  };

  // Fungsi untuk generate nomor transaksi untuk akun tukar
  const generateNoTransaksiTukar = async (kodeBank, tanggal, userId, originalNoTransaksi) => {
    try {
      const response = await api.get("/generate-no-transaksi", {
        params: {
          kodeBank: kodeBank,
          userID: userId,
          tanggal: tanggal
        }
      });
      
      // Tambahkan suffix -tukar
      return response.data.noTransaksi;
    } catch (error) {
      console.error("Error generating nomor transaksi tukar:", error);
      return originalNoTransaksi;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Khusus untuk field debit dan kredit
    if (name === "debit" || name === "kredit") {
      const newForm = { ...form };
      
      if (name === "debit") {
        // Simpan nilai input langsung ke state formatted (untuk ditampilkan)
        setFormattedDebit(value);
        
        // Simpan nilai asli tanpa format ke form state
        const rawValue = parseFormattedNumber(value);
        newForm.debit = rawValue;
        
        // Jika debit diisi, clear kredit
        if (rawValue && rawValue !== "0") {
          newForm.kredit = "";
          setFormattedKredit("");
        }
      } else if (name === "kredit") {
        // Simpan nilai input langsung ke state formatted (untuk ditampilkan)
        setFormattedKredit(value);
        
        // Simpan nilai asli tanpa format ke form state
        const rawValue = parseFormattedNumber(value);
        newForm.kredit = rawValue;
        
        // Jika kredit diisi, clear debit
        if (rawValue && rawValue !== "0") {
          newForm.debit = "";
          setFormattedDebit("");
        }
      }
      
      setForm(newForm);
    } else {
      const newForm = { ...form, [name]: value };
      
      // Jika COA Akun Bank berubah, cek apakah akun transaksi yang dipilih sama dengan COA Bank yang baru
      if (name === "coaAkunBank") {
        const selectedCOA = coaList.find(bankCoa => String(bankCoa.id) === String(value));
        if (selectedCOA && form.akunTransaksi === selectedCOA.kode) {
          // Reset akun transaksi jika sama dengan COA Bank yang dipilih
          newForm.akunTransaksi = "";
        }
      }
      
      setForm(newForm);
    }
    
    if (name === "coaAkunBank" && onCOAChange) {
      onCOAChange(value);
    }
  };

  // Fungsi untuk format angka saat blur (kehilangan focus)
  const handleDebitBlur = () => {
    if (formattedDebit) {
      const formatted = formatNumber(formattedDebit);
      setFormattedDebit(formatted);
    }
  };

  const handleKreditBlur = () => {
    if (formattedKredit) {
      const formatted = formatNumber(formattedKredit);
      setFormattedKredit(formatted);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi: pastikan salah satu dari debit atau kredit diisi
    if ((!form.debit || form.debit === "0") && (!form.kredit || form.kredit === "0")) {
      alert("Harap isi salah satu dari Debit atau Kredit");
      return;
    }
    
    try {
      // Cari kode COA Bank berdasarkan ID yang dipilih
      const selectedCOA = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
      const coaBankKode = selectedCOA ? selectedCOA.kode : form.coaAkunBank;
      
      const dataToSend = {
        ...form,
        coaAkunBank: coaBankKode, // Gunakan kode, bukan ID
        tanggal: new Date(form.tanggal).toISOString(),
        debit: form.debit ? parseFloat(form.debit) : 0,
        kredit: form.kredit ? parseFloat(form.kredit) : 0,
      };
      
      if (isEditMode && selectedTransaksiId) {
        // Mode Edit - tidak ada transaksi ganda saat edit
        await api.put(`/input-transaksi/${selectedTransaksiId}`, dataToSend);
        alert("Transaksi berhasil diupdate!");
        handleResetForm();
      } else {
        // Mode Create
        console.log("Checking kas & bank for akun transaksi:", form.akunTransaksi);
        const isKasBank = isAkunTransaksiKasBank(form.akunTransaksi);
        console.log("Is akun transaksi kas & bank?", isKasBank);
        
        // Simpan transaksi pertama (normal)
        const response1 = await api.post("/input-transaksi", dataToSend);
        console.log("Transaksi 1 berhasil:", response1.data);
        
        // Jika akun transaksi adalah kas & bank, buat transaksi kedua
        if (isKasBank) {
          console.log("Creating second transaction (tukar)...");
          
          // Cari data COA untuk akun transaksi
          const akunTransaksiCOA = masterCoaList.find(coa => String(coa.kode) === String(form.akunTransaksi));
          
          if (akunTransaksiCOA) {
            // Generate nomor transaksi untuk transaksi tukar
            const noTransaksiTukar = await generateNoTransaksiTukar(
              akunTransaksiCOA.kode, 
              form.tanggal, 
              user.id, 
              form.noTransaksi
            );
            
            // Cari ID COA untuk akun transaksi tukar (yang sekarang jadi COA Akun Bank)
            const coaBankAsli = coaList.find(coa => String(coa.id) === String(form.coaAkunBank));
            
            // Buat transaksi kedua (tukar)
            const dataToSendTukar = {
              noTransaksi: noTransaksiTukar,
              coaAkunBank: akunTransaksiCOA.kode, // COA Akun Bank jadi kode akun transaksi
              tanggal: new Date(form.tanggal).toISOString(),
              akunTransaksi: coaBankAsli ? coaBankAsli.kode : coaBankKode, // Akun transaksi jadi kode COA Bank
              deskripsi: form.noTransaksi,
              projectNo: form.projectNo,
              projectName: form.projectName,
              debit: form.kredit ? parseFloat(form.kredit) : 0, // Tukar
              kredit: form.debit ? parseFloat(form.debit) : 0,  // Tukar
            };
            
            console.log("Data transaksi tukar:", dataToSendTukar);
            
            const response2 = await api.post("/input-transaksi", dataToSendTukar);
            console.log("Transaksi 2 (tukar) berhasil:", response2.data);
            
            alert("2 Transaksi berhasil disimpan (normal + tukar)!");
          } else {
            alert("Transaksi normal berhasil disimpan! (COA akun transaksi tidak ditemukan untuk tukar)");
          }
        } else {
          alert("Transaksi berhasil disimpan!");
        }
        
        // Reset form
        setForm({
          noTransaksi: "",
          coaAkunBank: form.coaAkunBank, // JANGAN DIRESET
          tanggal: getTodayLocal(),
          akunTransaksi: "",
          deskripsi: "",
          projectNo: "",
          projectName: "",
          debit: "",
          kredit: ""
        });
        
        // Reset nilai format
        setFormattedDebit('');
        setFormattedKredit('');
        
        // Generate nomor transaksi untuk transaksi berikutnya
        if (form.coaAkunBank && user?.id) {
          setTimeout(() => generateNoTransaksi(), 100);
        }
      }
      
      if (afterSubmit) afterSubmit(form.coaAkunBank); // PANGGIL LANGSUNG SETELAH SIMPAN
    } catch (err) {
      alert(isEditMode ? "Gagal update transaksi" : "Gagal simpan transaksi");
    }
  };

  return (
    <>
      {/* Header indikator mode */}
      {isEditMode && (
        <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-4">
          <div className="flex justify-between items-center">
            <span>
              <strong>Mode Edit:</strong> Mengedit transaksi ID #{selectedTransaksiId}
            </span>
            <button
              onClick={handleResetForm}
              className="text-orange-700 hover:text-orange-900 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      <form className="space-y-4 w-full bg-white rounded shadow p-6 mt-4" onSubmit={handleSubmit}>
        {/* Baris 1: COA Akun Bank & Nomor Transaksi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">COA Akun Bank</label>
            <select
              name="coaAkunBank"
              value={form.coaAkunBank}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Pilih COA Akun Bank</option>
              {coaList.map(coa => (
                <option key={coa.id} value={coa.id}>
                  {coa.kode} - {coa.nama}
                </option>
              ))}
            </select>
            {/* Debug info */}
            {/* {isEditMode && (
              <small className="text-gray-500 text-xs">
                Debug: Selected COA ID = {form.coaAkunBank}
              </small>
            )} */}
          </div>
          <div>
            <label className="block mb-1 font-medium">Nomor Transaksi</label>
            <div className="flex gap-2">
              <input
                type="text"
                name="noTransaksi"
                value={form.noTransaksi}
                onChange={handleChange}
                className={`flex-1 border rounded px-3 py-2 ${
                  isEditMode ? "" : "bg-gray-100"
                }`}
                placeholder={isEditMode ? "Edit nomor transaksi" : "Auto Generated"}
                readOnly={!isEditMode}
              />
              {!isEditMode && (
                <button
                  type="button"
                  onClick={generateNoTransaksi}
                  disabled={!form.coaAkunBank || !form.tanggal || isGeneratingNoTransaksi}
                  className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
                >
                  {isGeneratingNoTransaksi ? "..." : "Auto"}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Baris 2: Tanggal, Akun Transaksi, Debit, Kredit */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-1 font-medium">Tanggal</label>
            <input
              type="date"
              name="tanggal"
              value={form.tanggal}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Akun Transaksi</label>
            <select
              name="akunTransaksi"
              value={form.akunTransaksi}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            >
              <option value="">Pilih Akun Transaksi</option>
              {akunTransaksiOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Debit
              {form.debit && form.debit !== "0" && (
                <span className="text-green-600 text-sm ml-1">(Aktif)</span>
              )}
              {form.kredit && form.kredit !== "0" && (
                <span className="text-gray-500 text-sm ml-1">(Disabled)</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="debit"
                value={formattedDebit}
                onChange={handleChange}
                onBlur={handleDebitBlur}
                disabled={form.kredit && form.kredit !== "0"}
                className={`flex-1 border rounded px-3 py-2 ${
                  form.kredit && form.kredit !== "0" 
                    ? "bg-gray-100 cursor-not-allowed text-gray-500" 
                    : form.debit && form.debit !== "0"
                    ? "border-green-500 bg-green-50"
                    : ""
                }`}
                placeholder="0"
              />
              {form.debit && form.debit !== "0" && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({...form, debit: ""});
                    setFormattedDebit("");
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  title="Clear Debit"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block mb-1 font-medium">
              Kredit
              {form.kredit && form.kredit !== "0" && (
                <span className="text-green-600 text-sm ml-1">(Aktif)</span>
              )}
              {form.debit && form.debit !== "0" && (
                <span className="text-gray-500 text-sm ml-1">(Disabled)</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                name="kredit"
                value={formattedKredit}
                onChange={handleChange}
                onBlur={handleKreditBlur}
                disabled={form.debit && form.debit !== "0"}
                className={`flex-1 border rounded px-3 py-2 ${
                  form.debit && form.debit !== "0" 
                    ? "bg-gray-100 cursor-not-allowed text-gray-500" 
                    : form.kredit && form.kredit !== "0"
                    ? "border-green-500 bg-green-50"
                    : ""
                }`}
                placeholder="0"
              />
              {form.kredit && form.kredit !== "0" && (
                <button
                  type="button"
                  onClick={() => {
                    setForm({...form, kredit: ""});
                    setFormattedKredit("");
                  }}
                  className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  title="Clear Kredit"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Baris 3: Project No & Project Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 font-medium">Project No</label>
            <input
              type="text"
              name="projectNo"
              value={form.projectNo}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Project Name</label>
            <input
              type="text"
              name="projectName"
              value={form.projectName}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>
        {/* Baris 4: Deskripsi & Tombol */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block mb-1 font-medium">Deskripsi</label>
            <input
              type="text"
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div className="flex gap-2 md:justify-end mt-4 md:mt-0">
            <button
              type="submit"
              className={`px-6 py-2 rounded text-white ${
                isEditMode 
                  ? "bg-orange-500 hover:bg-orange-600" 
                  : "bg-indigo-500 hover:bg-indigo-600"
              }`}
            >
              {isEditMode ? "Update" : "Simpan"}
            </button>
            <button
              type="button"
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
              onClick={handleDeleteTransaksi}
              disabled={!isEditMode || !selectedTransaksiId}
              title={!isEditMode ? "Pilih transaksi dengan double-click untuk menghapus" : "Hapus transaksi yang dipilih"}
            >
              Hapus
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              onClick={handleResetForm}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  );
});

export default InputTransaksiForm;
