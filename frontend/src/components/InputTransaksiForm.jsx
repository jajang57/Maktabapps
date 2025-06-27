import React, { useState, useEffect } from "react";
import axios from "axios";

// Tambahkan fungsi untuk mendapatkan tanggal hari ini dalam format YYYY-MM-DD
function getTodayLocal() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export default function InputTransaksiForm({ onCOAChange, afterSubmit }) {
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

  useEffect(() => {
    fetch("http://localhost:8080/api/coa-kas-bank")
      .then(res => res.json())
      .then(data => setCoaList(data))
      .catch(() => setCoaList([]));
  }, []);

  useEffect(() => {
    fetch("http://localhost:8080/api/master-coa")
      .then(res => res.json())
      .then(data => {
        setAkunTransaksiOptions(
          data.map(coa => ({
            value: coa.kode.toString(),
            label: `${coa.nama} (${coa.kode})`
          }))
        );
      })
      .catch(() => setAkunTransaksiOptions([]));
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === "coaAkunBank" && onCOAChange) {
      onCOAChange(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...form,
        tanggal: new Date(form.tanggal).toISOString(),
        debit: form.debit ? parseFloat(form.debit) : 0,
        kredit: form.kredit ? parseFloat(form.kredit) : 0,
      };
      await axios.post("http://localhost:8080/api/input-transaksi", dataToSend);
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
      if (afterSubmit) afterSubmit(form.coaAkunBank); // PANGGIL LANGSUNG SETELAH SIMPAN
      alert("Transaksi berhasil disimpan!");
    } catch (err) {
      alert("Gagal simpan transaksi");
    }
  };

  return (
    <>
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
                  {coa.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium">Nomor Transaksi</label>
            <input
              type="text"
              name="noTransaksi"
              value={form.noTransaksi}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Auto/Manual"
            />
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
            <label className="block mb-1 font-medium">Debit</label>
            <input
              type="number"
              name="debit"
              value={form.debit}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Kredit</label>
            <input
              type="number"
              name="kredit"
              value={form.kredit}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
            />
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
              className="bg-indigo-500 text-white px-6 py-2 rounded hover:bg-indigo-600"
            >
              Simpan
            </button>
            <button
              type="button"
              className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
              onClick={() => setForm({
                noTransaksi: "",
                coaAkunBank: "",
                tanggal: "",
                akunTransaksi: "",
                deskripsi: "",
                projectNo: "",
                projectName: "",
                debit: "",
                kredit: ""
              })}
            >
              Hapus
            </button>
            <button
              type="button"
              className="bg-gray-400 text-white px-6 py-2 rounded hover:bg-gray-500"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
