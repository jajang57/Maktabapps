import React, { useState, useEffect } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import ActiveFiltersBar from "./ActiveFiltersBar";
import TanggalDropdownCustom from "./TanggalDropdownCustom";
import TanggalDropdownCustomButton from "./TanggalDropdownCustomButton";
import SimpleDropdownFilterButton from "./SimpleDropdownFilterButton";
import api from "../../utils/api";

export default function AJE() {
  const [rows, setRows] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [akunFilter, setAkunFilter] = useState([]); // filter multi-select nama akun
  const [tanggalFilter, setTanggalFilter] = useState([]); // filter multi-select tanggal
  const [noBuktiFilter, setNoBuktiFilter] = useState([]); // filter multi-select no bukti
  const [deskripsiFilter, setDeskripsiFilter] = useState(""); // filter text deskripsi
  const [statusPostingFilter, setStatusPostingFilter] = useState([]); // ['posted', 'unposted']
  // Load daftar COA non kasbank untuk dropdown Nama Akun
  useEffect(() => {
    async function fetchCOA() {
      try {
        const res = await api.get("/aje/coa-akun-aje");
        setCoaList(res.data || []);
      } catch {
        setCoaList([]);
      }
    }
    fetchCOA();
  }, []);
  // Load data dari backend saat komponen mount
  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/aje");
        // Tandai baris hasil fetch sebagai saved
        setRows((res.data || []).map(row => ({
          ...row,
          saved: true,
          posted: !!row.posted
        })));
      } catch (err) {
        setRows([]);
      }
    }
    fetchData();
  }, []);
  // Ambil user id login dari localStorage (atau context jika sudah ada AuthContext)
  // Pastikan backend menerima id numerik (misal: "4" untuk user id 4)
  const user = JSON.parse(localStorage.getItem("user"));
  let userId = user?.id;
  if (!userId) userId = 1; // fallback default jika belum login
  // Format userId jadi 2 digit string (misal: 4 -> '04', 12 -> '12')
  userId = userId.toString().padStart(2, '0');

  // Fungsi untuk generate nomor bukti otomatis
  async function generateNoBukti(tanggal) {
    if (!tanggal) return "";
    try {
      const res = await api.get(`/aje/generate-no-bukti?tanggal=${tanggal}&user=${userId}`);
      return res.data.noBukti || "";
    } catch {
      return "";
    }
  }

  // Tambah baris baru di bawah baris yang dipilih, atau di akhir jika tidak ada baris dipilih
  const addRow = async (idx = null) => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA').slice(0, 10);
    console.log("todayStr addRow:", todayStr); // <-- Tambahkan ini

    const noBukti = await generateNoBukti(todayStr);
    const newRow = {
      tanggal: todayStr,
      noBukti,
      namaAkun: "",
      kodeAkun: "",
      deskripsi: "",
      debit: "",
      kredit: "",
      saved: false,
      posted: false
    };
    let insertIdx = idx;
    if (insertIdx === null) {
      insertIdx = rows.length - 1;
      for (let i = rows.length - 1; i >= 0; i--) {
        if (!rows[i?.posted]) {
          insertIdx = i;
          break;
        }
      }
    }
    const newRows = [...rows];
    newRows.splice(insertIdx + 1, 0, newRow);
    setRows(newRows);
  };

  // Perbaiki handleChange agar selalu set saved: false
  const handleChange = async (idx, e) => {
    const { name, value } = e.target;
    if (name === "tanggal") {
      const noBukti = await generateNoBukti(value);
      setRows(rows.map((row, i) =>
        i === idx ? { ...row, tanggal: value, noBukti, saved: false } : row
      ));
    } else if (name === "namaAkun") {
      const selected = coaList.find(coa => coa.nama === value);
      setRows(rows.map((row, i) =>
        i === idx ? { ...row, namaAkun: value, kodeAkun: selected ? selected.kode : "", saved: false } : row
      ));
    } else {
      setRows(rows.map((row, i) => i === idx ? { ...row, [name]: value, saved: false } : row));
    }
  };

  // Simpan baris ke backend
  const handleSave = async (idx) => {
    const row = rows[idx];
    // Wajib pilih nama akun
    if (!row.namaAkun || row.namaAkun.trim() === "") {
      alert("Nama akun wajib dipilih!");
      return;
    }
    if (!row.deskripsi || row.deskripsi.trim() === "") {
      alert("Deskripsi wajib diisi!");
      return;
    }
    // Hitung summary debit dan kredit untuk semua baris dengan noBukti yang sama
    const groupNoBukti = row.noBukti;
    const groupedRows = rows.filter(r => r.noBukti === groupNoBukti);
    const totalDebit = groupedRows.reduce((sum, r) => sum + (parseFloat(r.debit) || 0), 0);
    const totalKredit = groupedRows.reduce((sum, r) => sum + (parseFloat(r.kredit) || 0), 0);
    if (totalDebit !== totalKredit) {
      alert(`Total debit (${totalDebit}) dan kredit (${totalKredit}) untuk nomor bukti ${groupNoBukti} tidak balance!`);
      return;
    }
    // Ambil semua baris dengan noBukti yang sama dan belum saved
    const unsavedRows = rows
      .map((r, i) => ({ ...r, idx: i }))
      .filter(r => r.noBukti === groupNoBukti && !r.saved);

    // === Tambahkan ini sebelum pengecekan duplikat ===
    const allSaved = groupedRows.every(r => r.saved);

    // === Perbaikan di sini ===
    if (!allSaved) {
      try {
        const cekRes = await api.get(`/aje/cek-no-bukti?noBukti=${encodeURIComponent(groupNoBukti)}`);
        if (cekRes.data && cekRes.data.exists) {
          // Jika backend mengembalikan array ids:
          const foundIds = cekRes.data.ids || (cekRes.data.id ? [cekRes.data.id] : []);
          // Cek apakah id baris yang sedang diedit (atau id baris unsaved) ada di foundIds
          const isEditingOwn = unsavedRows.every(r => foundIds.includes(r.id));
          if (!isEditingOwn) {
            alert(`Nomor transaksi ${groupNoBukti} sudah pernah dibuat!`);
            return;
          }
        }
      } catch (e) {
        // Jika error selain 404, tetap lanjut (anggap tidak ada)
      }
    }
    // Siapkan data untuk dikirim
    const dataArr = unsavedRows.map(r => {
      // JANGAN hilangkan id jika ada!
      return {
        ...r,
        debit: r.debit === "" ? 0 : parseFloat(r.debit),
        kredit: r.kredit === "" ? 0 : parseFloat(r.kredit),
        kodeAkun: r.kodeAkun || (coaList.find(coa => coa.nama === r.namaAkun)?.kode || "")
      };
    });
    try {
      // Simpan dan dapatkan hasil id dari backend
      const res = await api.post("/aje", dataArr);
      let savedIds = [];
      if (Array.isArray(res.data)) {
        // Jika backend mengembalikan array objek dengan id
        if (typeof res.data[0] === "object" && res.data[0].id) {
          savedIds = res.data.map(d => d.id);
        } else {
          // Jika array id saja
          savedIds = res.data;
        }
      }
      setRows(rows.map((r, i) => {
        if (r.noBukti === groupNoBukti && !r.saved) {
          // Update id jika dapat dari backend
          const newId = savedIds.shift();
          return { ...r, saved: true, id: newId };
        }
        return r;
      }));
      alert("Berhasil disimpan!");
    } catch (err) {
      alert("Gagal simpan: " + (err?.response?.data?.error || err.message));
    }
  };

  // Hapus baris dari backend (dan dari tabel)
  const handleDelete = async (idx) => {
    const row = rows[idx];
    const groupNoBukti = row.noBukti;
    const rowsToDelete = rows.filter(r => r.noBukti === groupNoBukti);

    // Jika semua baris belum saved, hapus dari state saja
    if (rowsToDelete.every(r => !r.saved)) {
      setRows(rows.filter(r => r.noBukti !== groupNoBukti));
      return;
    }
    // Jika ada yang sudah saved, hapus di backend lalu di state
    if (rowsToDelete.some(r => r.posted)) {
      alert("Data sudah diposting, tidak bisa dihapus!");
      return;
    }
    try {
      // Hapus semua id baris dengan noBukti yang sama di backend
      const idsToDelete = rowsToDelete.filter(r => r.saved).map(r => r.id);
      if (idsToDelete.length > 0) {
        await api.post("/aje/delete", { ids: idsToDelete });
      }
      setRows(rows.filter(r => r.noBukti !== groupNoBukti));
      alert("Berhasil dihapus!");
    } catch (err) {
      alert("Gagal hapus: " + (err?.response?.data?.error || err.message));
    }
  };

  // Posting baris (set posted = true untuk semua baris dengan noBukti yang sama)
  const handlePosting = async (idx) => {
    const row = rows[idx];
    // Cek ke backend apakah nomor transaksi sudah ada di tabel GL (pakai endpoint cek-no-bukti)
    try {
      const cekGL = await api.get(`/gl/cek-no-bukti?noBukti=${encodeURIComponent(row.noBukti)}`);
      if (cekGL.data && cekGL.data.exists) {
        alert(`Nomor transaksi ${row.noBukti} sudah ada di tabel GL, tidak dapat diposting!`);
        return;
      }
    } catch (e) {
      // Jika error selain 404, lanjut
    }
    try {
      await api.post("/aje/posting", { id: row.id });
      setRows(rows.map((r) =>
        r.noBukti === row.noBukti ? { ...r, posted: true } : r
      ));
      alert("Berhasil posting!");
    } catch (err) {
      alert("Gagal posting: " + (err?.response?.data?.error || err.message));
    }
  };

  // Unposting baris (set posted = false untuk semua baris dengan noBukti yang sama)
  const handleUnposting = async (idx) => {
    const row = rows[idx];
    try {
      await api.post("/aje/unposting", { id: row.id });
      setRows(rows.map((r) =>
        r.noBukti === row.noBukti ? { ...r, posted: false } : r
      ));
      alert("Berhasil unposting!");
    } catch (err) {
      alert("Gagal unposting: " + (err?.response?.data?.error || err.message));
    }
  };

  const removeRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  // Ambil daftar unik
  const tanggalOptions = Array.from(new Set(rows.map(row => row.tanggal))).sort();
  const noBuktiOptions = Array.from(new Set(rows.map(row => row.noBukti))).sort();
  const deskripsiOptions = Array.from(new Set(rows.map(row => row.deskripsi))).sort();
  // Filter rows sesuai semua filter
  let filteredRows = rows;
  if (akunFilter.length > 0) {
    filteredRows = filteredRows.filter(row => akunFilter.includes(row.namaAkun));
  }
  if (tanggalFilter.length > 0) {
    filteredRows = filteredRows.filter(row => tanggalFilter.includes(row.tanggal));
  }
  if (noBuktiFilter.length > 0) {
    filteredRows = filteredRows.filter(row => noBuktiFilter.includes(row.noBukti));
  }
  if (deskripsiFilter && deskripsiFilter.trim() !== "") {
    filteredRows = filteredRows.filter(row => row.deskripsi && row.deskripsi.toLowerCase().includes(deskripsiFilter.toLowerCase()));
  }
  if (statusPostingFilter.length > 0) {
    filteredRows = filteredRows.filter(row => {
      if (statusPostingFilter.includes("posted") && row.posted) return true;
      if (statusPostingFilter.includes("unposted") && !row.posted) return true;
      return false;
    });
  }

  const handleClone = async (idx) => {
    const row = rows[idx];
    const groupNoBukti = row.noBukti;
    const rowsToClone = rows.filter(r => r.noBukti === groupNoBukti);

    // Tanggal hari ini
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA').slice(0, 10);
    console.log("todayStr handleClone:", todayStr); // <-- Tambahkan ini

    // Generate nomor bukti baru
    const newNoBukti = await generateNoBukti(todayStr);

    // Clone semua baris dengan noBukti yang sama
    const clonedRows = rowsToClone.map(r => ({
      ...r,
      id: undefined, // atau cukup hapus field id
      tanggal: todayStr,
      noBukti: newNoBukti,
      saved: false,
      posted: false
    }));

    setRows([...rows, ...clonedRows]);
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Jurnal Penyesuaian (AJE)</h2>
      <ActiveFiltersBar
        tanggalFilter={tanggalFilter}
        noBuktiFilter={noBuktiFilter}
        akunFilter={akunFilter}
        deskripsiFilter={deskripsiFilter}
        statusPostingFilter={statusPostingFilter}
        onRemove={(chip) => {
          if (chip.type === "tanggal") setTanggalFilter(tanggalFilter.filter(t => t !== chip.value));
          if (chip.type === "noBukti") setNoBuktiFilter(noBuktiFilter.filter(nb => nb !== chip.value));
          if (chip.type === "akun") setAkunFilter(akunFilter.filter(a => a !== chip.value));
          if (chip.type === "deskripsi") setDeskripsiFilter("");
          if (chip.type === "status") setStatusPostingFilter(statusPostingFilter.filter(s => s !== chip.value));
        }}
        onReset={() => {
          setTanggalFilter([]);
          setNoBuktiFilter([]);
          setAkunFilter([]);
          setDeskripsiFilter("");
          setStatusPostingFilter([]);
        }}
      />
      <div style={{ overflowX: "auto" }}>
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1" style={{ position: 'relative' }}>
                Tanggal
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <TanggalDropdownCustomButton rows={rows} value={tanggalFilter} onChange={setTanggalFilter} />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ position: 'relative' }}>
                No. Bukti
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={noBuktiOptions.map(nb => ({ label: nb, value: nb }))}
                    value={noBuktiFilter}
                    onChange={setNoBuktiFilter}
                    placeholder="Cari No. Bukti"
                    iconTitle="Filter No. Bukti"
                  />
                </span>
              </th>
              <th className="border px-2 py-1" style={{ position: 'relative' }}>
                Nama Akun
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="multi-select"
                    options={coaList.map(coa => ({ label: `(${coa.kode}) ${coa.nama}`, value: coa.nama }))}
                    value={akunFilter}
                    onChange={setAkunFilter}
                    placeholder="Cari Akun"
                    iconTitle="Filter Nama Akun"
                  />
                </span>
              </th>
               <th className="border px-2 py-1" style={{ position: 'relative' }}>
                Deskripsi
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="text"
                    value={deskripsiFilter}
                    onChange={setDeskripsiFilter}
                    placeholder="Cari Deskripsi"
                    iconTitle="Filter Deskripsi"
                  />
                </span>
              </th>
              <th className="border px-2 py-1">Debit</th>
              <th className="border px-2 py-1">Kredit</th>
             <th className="border px-2 py-1" style={{ position: 'relative' }}>
                Aksi
                <span style={{ position: 'absolute', right: 4, top: 4 }}>
                  <SimpleDropdownFilterButton
                    filterType="status"
                    options={[
                      { label: 'Sudah Posting', value: 'posted' },
                      { label: 'Belum Posting', value: 'unposted' },
                    ]}
                    value={statusPostingFilter}
                    onChange={setStatusPostingFilter}
                    iconTitle="Filter Status Posting"
                  />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => (
              <tr key={row.id} className={row.posted ? "bg-gray-100" : ""}>
                <td className="border px-2 py-1">
                  <input type="date" name="tanggal" value={row.tanggal} onChange={e => handleChange(idx, e)} className="border rounded px-2 py-1" readOnly={row.posted} disabled={row.posted} />
                </td>
                <td className="border px-2 py-1">
                  <input type="text" name="noBukti" value={row.noBukti} onChange={e => handleChange(idx, e)} className="border rounded px-2 py-1" readOnly={row.posted} disabled={row.posted} />
                </td>
                <td className="border px-2 py-1">
                  <select
                    name="namaAkun"
                    value={row.namaAkun}
                    onChange={e => handleChange(idx, e)}
                    className="border rounded px-2 py-1 w-full"
                    disabled={row.posted}
                  >
                    <option value="">Pilih Akun</option>
                    {coaList.map(coa => (
                      <option key={coa.id} value={coa.nama} data-kode={coa.kode}>({coa.kode}) {coa.nama} </option>
                    ))}
                  </select>
                </td>
                <td className="border px-2 py-1">
                  <input type="text" name="deskripsi" value={row.deskripsi} onChange={e => handleChange(idx, e)} className="border rounded px-2 py-1" readOnly={row.posted} disabled={row.posted} />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    name="debit"
                    value={row._editingDebit === undefined ? (row.debit === "" ? "" : Number(row.debit).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : row._editingDebit}
                    onChange={e => {
                      // Izinkan angka, koma, titik
                      let raw = e.target.value.replace(/[^0-9.,]/g, "");
                      // Ganti koma ke titik agar konsisten
                      raw = raw.replace(/,/g, ".");
                      setRows(rows.map((r, i) =>
                        i === idx ? { ...r, _editingDebit: e.target.value, debit: raw, saved: false } : r
                      ));
                    }}
                    onBlur={e => {
                      setRows(rows.map((r, i) => {
                        if (i === idx) {
                          const val = r.debit === "" ? "" : Number(r.debit).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const { _editingDebit, ...rest } = r;
                          return { ...rest };
                        }
                        return r;
                      }));
                    }}
                    onFocus={e => {
                      setRows(rows.map((r, i) => i === idx ? { ...r, _editingDebit: r.debit } : r));
                    }}
                    className="border rounded px-2 py-1 text-right"
                    readOnly={row.posted}
                    disabled={row.posted || (row.kredit && row.kredit !== "" && parseFloat(row.kredit) !== 0)}
                  />
                </td>
                <td className="border px-2 py-1">
                  <input
                    type="text"
                    name="kredit"
                    value={row._editingKredit === undefined ? (row.kredit === "" ? "" : Number(row.kredit).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })) : row._editingKredit}
                    onChange={e => {
                      let raw = e.target.value.replace(/[^0-9.,]/g, "");
                      raw = raw.replace(/,/g, ".");
                      setRows(rows.map((r, i) => i === idx ? { ...r, _editingKredit: e.target.value, kredit: raw, saved: false } : r));
                    }}
                    onBlur={e => {
                      setRows(rows.map((r, i) => {
                        if (i === idx) {
                          const val = r.kredit === "" ? "" : Number(r.kredit).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                          const { _editingKredit, ...rest } = r;
                          return { ...rest };
                        }
                        return r;
                      }));
                    }}
                    onFocus={e => {
                      setRows(rows.map((r, i) => i === idx ? { ...r, _editingKredit: r.kredit } : r));
                    }}
                    className="border rounded px-2 py-1 text-right"
                    readOnly={row.posted}
                    disabled={row.posted || (row.debit && row.debit !== "" && parseFloat(row.debit) !== 0)}
                  />
                </td>
              
                <td className="border px-2 py-1 text-center">
                  {!row.saved ? (
                    <>
                      <button type="button" onClick={() => handleSave(idx)} className="text-green-600 font-bold" title="Simpan">💾</button>
                      <button type="button" onClick={() => handleDelete(idx)} className="ml-2 text-red-500 font-bold" title="Hapus">🗑️</button>
                      <button type="button" onClick={() => handleClone(idx)} className="ml-2 text-indigo-500 font-bold" title="Clone">📋</button>
                    </>
                  ) : (
                    <>
                      {!row.posted ? (
                        <button type="button" onClick={() => handlePosting(idx)} className="text-blue-600 font-bold" title="Posting">📤</button>
                      ) : (
                        <button type="button" onClick={() => handleUnposting(idx)} className="text-gray-500 font-bold" title="Unposting">↩️</button>
                      )}
                      <button type="button" onClick={() => handleDelete(idx)} className="ml-2 text-red-500 font-bold" title="Hapus">🗑️</button>
                      <button type="button" onClick={() => handleClone(idx)} className="ml-2 text-indigo-500 font-bold" title="Clone">📋</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => addRow()} className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded">+ Tambah Baris</button>
    </div>
  );
}