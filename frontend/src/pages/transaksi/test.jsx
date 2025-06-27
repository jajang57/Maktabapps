import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";

function getTodayLocal() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 10);
}

export default function JurnalUmum() {
  const [akunKasBankList, setakunKasBankList] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [noBuktiToDelete, setNoBuktiToDelete] = useState(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetch("http://localhost:8080/api/coa-kas-bank")
      .then(res => res.json())
      .then(json => setakunKasBankList(json));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/api/master-coa")
      .then(res => res.json())
      .then(json => setCoaList(json));
  }, []);

  const today = getTodayLocal();

  const [header, setHeader] = useState({
    akunKas: "",
    tanggal: today,
    noBukti: "",
    deskripsi: "",
    langsungPosting: false,
    hidePostingOtomatis: true,
  });
  const [rows, setRows] = useState([
    {id: 0, coa: "", nama: "", debit: "", kredit: "", keterangan: "", tanggal: "", noBukti: "", saved: false },
  ]);

  function generateNoBukti(header, rows) {
    const coa = header.akunKas || "";
    const tgl = header.tanggal ? new Date(header.tanggal) : null;
    const user = "01"; // default inisial user

    if (!coa || !tgl) return "";

    const day = String(tgl.getDate()).padStart(2, "0");
    const month = String(tgl.getMonth() + 1).padStart(2, "0");
    const year = String(tgl.getFullYear()).slice(-2);

    // Hitung urutan berdasarkan akunKas & tanggal yang sama
    const count = (
      rows?.filter(
        (row) =>
          row.coa === coa &&
          (row.tanggal || header.tanggal) === header.tanggal
      ).length || 0
    ) + 1;

    const urut = String(count).padStart(6, "0");

    return `${coa}/${day}${month}${year}/${user}-${urut}`;
  }

  const handleHeaderChange = (e) => {
    const { name, type, value, checked } = e.target;
    setHeader((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };
      // Ganti semua 'akunKas' menjadi 'akunKas'
      if (name === "akunKas" || name === "tanggal") {
        updated.noBukti = generateNoBukti(updated, rows);
      }
      return updated;
    });

    // Update rows jika tanggal berubah
    if (name === "tanggal") {
      setRows((prevRows) =>
        prevRows.map((row) =>
          !row.saved
            ? {
                ...row,
                tanggal: value,
                noBukti: generateNoBukti(
                  { ...header, tanggal: value },
                  prevRows
                ),
              }
            : row
        )
      );
    }
    // Update rows jika akunKas berubah
    if (name === "akunKas") {
      setRows((prevRows) =>
        prevRows.map((row) =>
          !row.saved
            ? {
                ...row,
                noBukti: generateNoBukti(
                  { ...header, akunKas: value },
                  prevRows
                ),
              }
            : row
        )
      );
    }
    if (name === "noBukti") {
      setRows((prevRows) =>
        prevRows.map((row) =>
          !row.saved
            ? { ...row, noBukti: value }
            : row
        )
      );
    }
  };

  const handleRowChange = (idx, e) => {
    const newRows = [...rows];
    newRows[idx][e.target.name] = e.target.value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: 0, // <-- tambahkan ini!
        coa: "",
        nama: "",
        debit: "",
        kredit: "",
        keterangan: "",
        tanggal: header.tanggal,
        noBukti: header.noBukti,
        saved: false,
        locked: false,
        akunKas: header.akunKas,
      },
    ]);
  };

  const removeRow = (idx) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleSaveRow = (idx) => {
    setRows((prevRows) => {
      const updatedRows = prevRows.map((row, i) =>
        i === idx ? { ...row, saved: true } : row
      );

      // Jika langsung posting, proses posting otomatis
      if (header.langsungPosting) {
        // Temukan baris yang baru saja disimpan
        const row = updatedRows[idx];
        // Panggil handlePosting dengan baris tersebut
        setTimeout(() => handlePosting(row), 0);
      }

      return updatedRows;
    });
  };

  const handleEditRow = (idx) => {
    setRows((prevRows) => {
      // Dapatkan baris yang diedit
      const editedRow = prevRows[idx];
      // Hapus baris "Posting otomatis" pada grup yang sama (noBukti & tanggal)
      const filteredRows = prevRows.filter(
        (row, i) =>
          !(
            row.keterangan === "Posting otomatis" &&
            row.noBukti === editedRow.noBukti &&
            row.tanggal === editedRow.tanggal
          )
      );
      // Set baris yang diedit menjadi unsaved & unposted
      return filteredRows.map((row, i) =>
        i === idx
          ? { ...row, saved: false, posted: false }
          : row
      );
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Cek jika ada baris yang belum saved atau belum posted
    const notSavedOrPosted = rows.some(row => !row.saved || !row.posted);
    if (notSavedOrPosted) {
      alert("Masih ada baris yang belum disimpan atau belum diposting. Silakan simpan dan posting semua baris terlebih dahulu.");
      return;
    }

    // 1. Filter baris yang sudah di-posting tapi belum di-lock
    const toBeLockedIdx = rows
      .map((row, idx) => (row.posted && !row.locked ? idx : null))
      .filter(idx => idx !== null);

    // 2. Update baris tersebut menjadi locked (hanya yang akan dikirim)
    const rowsToSend = toBeLockedIdx.map(idx => ({
      ...rows[idx],
      locked: true,
      debit: Number(rows[idx].debit) || 0,
      kredit: Number(rows[idx].kredit) || 0,
      noBukti: rows[idx].noBukti || header.noBukti,
      tanggal: rows[idx].tanggal || header.tanggal,
      akunKas: header.akunKas,
    }));

    // 3. Kirim ke backend hanya baris yang baru di-lock
    fetch("http://localhost:8080/api/jurnal-detail", {
      method: "PUT", // gunakan PUT untuk update
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rowsToSend),
    })
      .then((res) => res.json())
      .then((result) => {
        alert("Jurnal berhasil dikirim ke backend!");
        // Ambil ulang data dari backend agar tampilan sesuai database
        fetch("http://localhost:8080/api/jurnal-detail")
          .then((res) => res.json())
          .then((data) => {
            setRows(data.map(row => ({
              ...row,
              saved: true,
              posted: true,
              locked: row.locked || false,
            })));
          });
      })
      .catch((err) => {
        alert("Gagal mengirim data: " + err.message);
      });
  };

  const handlePosting = (row) => {
    setRows((prevRows) => {
      // Group semua baris dengan tanggal & no bukti yang sama
      const groupRows = prevRows.filter(
        (r) =>
          (r.tanggal || header.tanggal) === (row.tanggal || header.tanggal) &&
          (r.noBukti || header.noBukti) === (row.noBukti || header.noBukti)
      );

      // Cari COA Kas dari dropdown header
      const akunKas = akunKasBankList.find((c) => c.kode.toString() === header.akunKas?.toString());
      if (!akunKas) {
        alert("Pilih COA Kas terlebih dahulu!");
        return prevRows;
      }

      // Cek apakah sudah ada baris lawan COA Kas untuk tanggal & no bukti ini
      const alreadyPosted = groupRows.some(
        (r) => r.coa === akunKas?.kode && r.posted
      );

      // Hitung summary debit dan kredit HANYA dari baris yang belum posted
      const totalDebit = groupRows
        .filter(r => !r.posted)
        .reduce((sum, r) => sum + (Number(r.debit) || 0), 0);
      const totalKredit = groupRows
        .filter(r => !r.posted)
        .reduce((sum, r) => sum + (Number(r.kredit) || 0), 0);

      if (alreadyPosted) {
        // Sudah ada baris lawan, cukup update posted: true pada baris lain
        const updatedRows = prevRows.map((r) =>
          (r.tanggal || header.tanggal) === (row.tanggal || header.tanggal) &&
          (r.noBukti || header.noBukti) === (row.noBukti || header.noBukti)
            ? { ...r, posted: true }
            : r
        );
        // Generate nomor bukti baru untuk header
        setTimeout(() => {
          setHeader((prev) => ({
            ...prev,
            noBukti: generateNoBukti(prev, updatedRows),
          }));
        }, 0);
        return updatedRows;
      }

      // Hitung selisih (harus salah satu, debit atau kredit)
      const selisih = totalDebit - totalKredit;

      if (selisih === 0) {
        alert("Tidak ada selisih untuk diposting.");
        return prevRows;
      }

      // Tambahkan baris lawan COA Kas
      const newRows = [
        ...prevRows.map((r) =>
          (r.tanggal || header.tanggal) === (row.tanggal || header.tanggal) &&
          (r.noBukti || header.noBukti) === (row.noBukti || header.noBukti)
            ? { ...r, posted: true }
            : r
        ),
        {
          coa: akunKas.kode,
          nama: akunKas.nama,
          debit: selisih < 0 ? Math.abs(selisih) : "",
          kredit: selisih > 0 ? Math.abs(selisih) : "",
          keterangan: "Posting otomatis",
          tanggal: row.tanggal || header.tanggal,
          noBukti: row.noBukti || header.noBukti,
          saved: true,
          posted: true,
          akunKas: header.akunKas, // ← tambahkan ini!
        },
      ];

      // Generate nomor bukti baru untuk header setelah posting selesai
      setTimeout(() => {
        setHeader((prev) => ({
          ...prev,
          noBukti: generateNoBukti(prev, newRows), // ← generate nomor bukti pakai newRows (sudah termasuk row posting otomatis)
        }));
      }, 0);

      return newRows;
    });
  };

  const toggleLockRow = (idx) => {
    setRows((prevRows) => {
      const { noBukti, tanggal } = prevRows[idx];
      const groupLocked = !prevRows[idx].locked;
      return prevRows.map((row) =>
        row.noBukti === noBukti && row.tanggal === tanggal
          ? { ...row, locked: groupLocked }
          : row
      );
    });
  };

  const isGroupLocked = (row) =>
    rows.some(
      (r) =>
        r.noBukti === row.noBukti &&
        r.tanggal === row.tanggal &&
        r.locked
    );

  // Untuk mendeteksi kombinasi tombol
  const pressedKeys = useRef(new Set());

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!e.key) return; // <-- Tambahkan ini
      pressedKeys.current.add(e.key.toLowerCase());

      // Shift + A + S untuk Simpan Baris (baris pertama yang belum saved)
      if (
        pressedKeys.current.has("shift") &&
        pressedKeys.current.has("a") &&
        pressedKeys.current.has("s")
      ) {
        const idx = rows.findIndex((row) => !row.saved);
        if (idx !== -1) handleSaveRow(idx);
      }

      // Shift + S + D untuk Tambah Baris
      if (
        pressedKeys.current.has("shift") &&
        pressedKeys.current.has("s") &&
        pressedKeys.current.has("d")
      ) {
        addRow();
      }
    };

    const handleKeyUp = (e) => {
      if (!e.key) return; // <-- Tambahkan ini
      pressedKeys.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [rows]); // dependensi rows agar bisa akses rows terbaru

  useEffect(() => {
    fetch("http://localhost:8080/api/jurnal-detail")
      .then((res) => res.json())
      .then((data) => {
        // Jika ingin langsung tampilkan semua data dari DB:
        setRows(data.map(row => ({
          ...row,
          saved: true,
          posted: true,
          locked: row.locked || false,
        })));
      })
      .catch((err) => {
        console.error("Gagal mengambil data jurnal:", err);
      });
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value // simpan sebagai string
    });
  };

  const handleCoaSelect = (idx, option) => {
    const coa = coaList.find(c => c.kode.toString() === (option?.value ?? ""));
    setRows(prevRows => {
      const newRows = [...prevRows];
      newRows[idx] = {
        ...newRows[idx],
        coa: coa ? coa.kode.toString() : "",
        nama: coa ? coa.nama : "",
      };
      return newRows;
    });
  };

  // Fungsi untuk membuka popup konfirmasi
  const confirmDelete = (noBukti) => {
    setNoBuktiToDelete(noBukti);
    setShowConfirm(true);
  };

  // Fungsi untuk melakukan hapus jika Yes
  const handleDeleteByNoBukti = () => {
    fetch("http://localhost:8080/api/jurnal-detail", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ noBukti: noBuktiToDelete }),
    })
      .then(res => res.json())
      .then(() => {
        setRows(rows.filter(row => row.noBukti !== noBuktiToDelete));
        setShowConfirm(false);
        setNoBuktiToDelete(null);
      });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Cash Bank</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-4 items-end">
          {/* Dropdown COA Kas */}
          <div>
            <label className="block text-sm font-medium">COA Akun Kas</label>
            <select
              name="akunKas"
              value={header.akunKas}
              onChange={handleHeaderChange}
              required
              className="border rounded px-2 py-1 w-full"
            >
              <option value="">Pilih Akun Kas/Bank</option>
              {akunKasBankList.map(coa => (
                <option key={coa.id} value={coa.kode}>
                  {coa.kode} - {coa.nama}
                </option>
              ))}
            </select>
          </div>
          {/* Input Tanggal */}
          <div>
            <label className="block text-sm font-medium">Tanggal</label>
            <input
              type="date"
              name="tanggal"
              value={header.tanggal}
              onChange={handleHeaderChange}
              className="border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">No. Bukti</label>
            <input
              type="text"
              name="noBukti"
              value={header.noBukti}
              onChange={handleHeaderChange}
              className="border rounded px-2 py-1"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">Deskripsi</label>
            <input
              type="text"
              name="deskripsi"
              value={header.deskripsi}
              onChange={handleHeaderChange}
              className="border rounded px-2 py-1 w-full"
            />
          </div>
        </div>
        <div className="flex items-center ml-4 mt-6">
          <input
            type="checkbox"
            id="langsungPosting"
            name="langsungPosting"
            checked={header.langsungPosting}
            onChange={handleHeaderChange}
            className="mr-2"
          />
          <label htmlFor="langsungPosting" className="text-sm font-medium select-none">
            Langsung Posting
          </label>
          <input
            type="checkbox"
            id="hidePostingOtomatis"
            name="hidePostingOtomatis"
            checked={header.hidePostingOtomatis}
            onChange={handleHeaderChange}
            className="ml-6 mr-2"
          />
          <label htmlFor="hidePostingOtomatis" className="text-sm font-medium select-none">
            Sembunyikan Posting Otomatis
          </label>
        </div>
        <div className="jurnal-table-portal-fix" style={{ overflow: "auto", position: "relative", maxHeight: 400 }}>
          <table className="min-w-full border text-sm mt-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-2 py-1 border">ID</th> {/* Tambahkan kolom ID */}
                <th className="px-2 py-1 border" style={{ minWidth: "200px" }}>No. Bukti</th>
                <th className="px-2 py-1 border">Tanggal</th>
                <th className="px-2 py-1 border">Kode Akun</th>
                <th className="px-2 py-1 border" style={{ minWidth: "350px" }}>Nama Akun</th>
                <th className="px-2 py-1 border">Debit</th>
                <th className="px-2 py-1 border">Kredit</th>
                <th className="px-2 py-1 border">Keterangan</th>
                <th className="px-2 py-1 border"></th>
                <th className="px-2 py-1 border"></th>
                <th className="px-2 py-1 border">Posting</th>
                <th className="px-2 py-1 border">Lock</th>
              </tr>
            </thead>
            <tbody>
              {rows
                .map((row, idx) => ({ row, idx }))
                .filter(({ row }) =>
                  // Hanya tampilkan baris dengan akunKas sesuai pilihan header
                  row.akunKas === header.akunKas &&
                  !(header.hidePostingOtomatis && row.keterangan === "Posting otomatis")
                )
                .map(({ row, idx }) => (
                  <tr key={idx}>
                    <td className="border px-2 py-1 text-center">{row.id}</td> {/* Tampilkan ID */}
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        value={row.noBukti}
                        readOnly
                        maxLength={25}
                        className="border rounded px-2 py-1"
                        style={{ width: "200px", backgroundColor: "#f3f4f6" }}
                        tabIndex={-1}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="date"
                        value={row.tanggal || header.tanggal}
                        readOnly
                        className="border rounded px-2 py-1 w-32 bg-gray-100"
                        tabIndex={-1}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        name="coa"
                        value={row.coa}
                        readOnly
                        className="border rounded px-2 py-1 w-24 bg-gray-100"
                        required
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <Select
                        options={coaList.map(coa => ({
                          value: coa.kode.toString(),
                          label: `${coa.nama} (${coa.kode})`,
                        }))}
                        value={
                          row.coa
                            ? {
                                value: row.coa.toString(),
                                label:
                                  coaList.find(c => c.kode.toString() === row.coa.toString())
                                    ? `${coaList.find(c => c.kode.toString() === row.coa.toString()).nama} (${row.coa})`
                                    : row.coa,
                              }
                            : null
                        }
                        onChange={option => handleCoaSelect(idx, option)}
                        isDisabled={row.saved}
                        isClearable
                        placeholder="Pilih Akun"
                        classNamePrefix="react-select"
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                        styles={{
                          menuPortal: base => ({ ...base, zIndex: 99999 }),
                        }}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        name="debit"
                        value={row.debit}
                        onChange={(e) => handleRowChange(idx, e)}
                        className="border rounded px-2 py-1 w-24"
                        disabled={row.saved}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="number"
                        name="kredit"
                        value={row.kredit}
                        onChange={(e) => handleRowChange(idx, e)}
                        className="border rounded px-2 py-1 w-24"
                        disabled={row.saved}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <input
                        type="text"
                        name="keterangan"
                        value={row.keterangan}
                        onChange={(e) => handleRowChange(idx, e)}
                        className="border rounded px-2 py-1 w-32"
                        disabled={row.saved}
                      />
                    </td>
                    <td className="border px-2 py-1">
                      <button
                        type="button"
                        onClick={() => confirmDelete(row.noBukti)} // Ganti dari removeRow(idx)
                        className="text-red-500 font-bold"
                        disabled={rows.length === 1 || row.saved || isGroupLocked(row)}
                        title="Hapus"
                      >
                        🗑️
                      </button>
                    </td>
                    <td className="border px-2 py-1">
                      {!row.saved ? (
                        <button
                          type="button"
                          onClick={() => handleSaveRow(idx)}
                          className="text-green-600 font-bold"
                          title="Simpan Baris"
                        >
                          💾
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleEditRow(idx)}
                          className="text-blue-600 font-bold"
                          title="Edit"
                          disabled={isGroupLocked(row)}
                        >
                          ✏️
                        </button>
                      )}
                    </td>
                    {/* Kolom Posting */}
                    <td className="border px-2 py-1">
                      <button
                        type="button"
                        className={`font-bold ${row.saved && !row.posted ? "text-purple-600" : "text-gray-400 cursor-not-allowed"}`}
                        disabled={!row.saved || row.posted}
                        onClick={() => handlePosting(row)}
                      >
                        Posting
                      </button>
                    </td>
                    <td className="border px-2 py-1 text-center">
                      {row.saved && row.posted ? (
                        <button
                          type="button"
                          onClick={() => toggleLockRow(idx)}
                          title={row.locked ? "Unlock" : "Lock"}
                          style={{ fontSize: "18px", cursor: "pointer", background: "none", border: "none" }}
                        >
                          {row.locked ? "🔒" : "🔓"}
                        </button>
                      ) : (
                        ""
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="mt-2 px-3 py-1 bg-indigo-500 text-white rounded"
        >
          + Tambah Baris
        </button>
        <button
          type="submit"
          className="mt-4 px-4 py-2 bg-green-600 text-white rounded"
        >
          Simpan Jurnal
        </button>
      </form>

      {/* Popup Konfirmasi */}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white rounded shadow-lg p-6">
            <div className="mb-4">Yakin ingin menghapus semua baris dengan No. Bukti <b>{noBuktiToDelete}</b>?</div>
            <div className="flex justify-end gap-4">
              <button
                onClick={handleDeleteByNoBukti}
                className="bg-red-600 text-white px-4 py-1 rounded"
              >
                Yes
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 px-4 py-1 rounded"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}