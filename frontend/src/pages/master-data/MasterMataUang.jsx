import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
import { useTheme } from "../../context/ThemeContext"; // Sesuaikan path jika berbeda
import api from "../../utils/api"; // Sesuaikan path jika berbeda

export default function MasterMataUang() {
  const { theme } = useTheme();
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    simbol: "",
    kurs: "",
    akunGL: "",
    aktif: true,
  });
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [editId, setEditId] = useState(null);
  const tableRef = useRef();

  const [formVisible, setFormVisible] = useState(true);
  const [formAnim, setFormAnim] = useState("fade-down");

  const [coaList, setCoaList] = useState([]);
  const [glAccount, setGlAccount] = useState({
    akunGL1: "",
    akunGL2: "",
    akunGL3: "",
    BiayaLainLain: "",
    BiayaMaterai: "",
  });

  const [activeTab, setActiveTab] = useState("Umum");

  const sortedCoaList = [...coaList].sort((a, b) => a.kode.localeCompare(b.kode));
  const coaOptions = sortedCoaList.map((coa) => ({
    value: coa.kode,
    label: `${coa.kode} - ${coa.nama}`,
  }));

  useEffect(() => {
    fetchData();
    fetchCoaList();
  }, []);

  const fetchData = () => {
    api.get("/master-mata-uang")
      .then((res) => setData(res.data))
      .catch(() => setError("Gagal mengambil data Mata Uang dari server"));
  };

  const fetchCoaList = () => {
    api.get("/master-coa")
      .then((res) => setCoaList(res.data))
      .catch(() => setCoaList([]));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      kurs: parseFloat(form.kurs),
      HutangUsaha: glAccount.HutangUsaha || "",
      PiutangUsaha: glAccount.PiutangUsaha || "",
      UangMukaBeli: glAccount.UangMukaBeli || "",
      UangMukaJual: glAccount.UangMukaJual || "",
      DiskonJual: glAccount.DiskonJual || "",
      DiskonBeli: glAccount.DiskonBeli || "",
      Pembulatan: glAccount.Pembulatan || "",
      KeuntunganDirealisasi: glAccount.KeuntunganDirealisasi || "",
      KeuntunganBelumDirealisasi: glAccount.KeuntunganBelumDirealisasi || "",
      HutangJatuhTempo: glAccount.HutangJatuhTempo || "",
      PiutangJatuhTempo: glAccount.PiutangJatuhTempo || "",
      BiayaLainLain: glAccount.BiayaLainLain || "",
      BiayaMaterai: glAccount.BiayaMaterai || "",
    };

    if (editId) {
      api.put(`/master-mata-uang/${editId}`, payload)
        .then((response) => {
          alert(response.data.message); // Menampilkan notifikasi sukses
          fetchData();
          handleResetForm();
        })
        .catch(() => setError("Gagal mengupdate data Mata Uang"));
    } else {
      api.post("/master-mata-uang", payload)
        .then((response) => {
          alert(response.data.message); // Menampilkan notifikasi sukses
          fetchData();
          handleResetForm();
        })
        .catch(() => setError("Gagal menyimpan data Mata Uang"));
    }
  };

  const handleResetForm = () => {
    setForm({
      kode: "",
      nama: "",
      simbol: "",
      kurs: "",
      akunGL: "",
      aktif: true,
    });
    setGlAccount({
      akunGL1: "",
      akunGL2: "",
      akunGL3: "",
    });
    setEditId(null);
    setError("");
  };

  const handleHideForm = () => {
    setFormAnim("fade-up");
    setTimeout(() => setFormVisible(false), 300);
  };

  const handleShowForm = () => {
    setFormVisible(true);
    setTimeout(() => setFormAnim("fade-down"), 10);
  };

  const handleEdit = (id) => {
    api.get(`/master-mata-uang/${id}`)
      .then((response) => {
        const data = response.data;

        // Isi state form dengan data dari backend
        setForm({
          kode: data.kode,
          nama: data.nama,
          simbol: data.simbol,
          kurs: data.kurs,
          aktif: data.aktif,
        });

        // Isi state glAccount dengan data akun GL dari backend
        setGlAccount({
          HutangUsaha: data.HutangUsaha || "",
          PiutangUsaha: data.PiutangUsaha || "",
          UangMukaBeli: data.UangMukaBeli || "",
          UangMukaJual: data.UangMukaJual || "",
          DiskonJual: data.DiskonJual || "",
          DiskonBeli: data.DiskonBeli || "",
          Pembulatan: data.Pembulatan || "",
          KeuntunganDirealisasi: data.KeuntunganDirealisasi || "",
          KeuntunganBelumDirealisasi: data.KeuntunganBelumDirealisasi || "",
          HutangJatuhTempo: data.HutangJatuhTempo || "",
          PiutangJatuhTempo: data.PiutangJatuhTempo || "",
          BiayaLainLain: data.BiayaLainLain || "",
          BiayaMaterai: data.BiayaMaterai || "",
        });

        // Set editId untuk menandai bahwa data sedang diedit
        setEditId(id);

        // Tampilkan form
        setFormVisible(true);
      })
      .catch(() => setError("Gagal mengambil data Mata Uang"));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
          Master Mata Uang
        </h1>
      </div>

      {formVisible ? (
        <div className={`rounded-xl shadow-lg p-6 border ${formAnim}`} style={{ background: theme.formColor }}>
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
              Sembunyikan Form
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 mb-4">
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "Umum" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("Umum")}
                style={{ fontFamily: theme.fontFamily }}
                type="button"
              >
                Umum
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === "AkunGL" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
                onClick={() => setActiveTab("AkunGL")}
                style={{ fontFamily: theme.fontFamily }}
                type="button"
              >
                Akun GL
              </button>
            </div>

            {activeTab === "Umum" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Form untuk Umum */}
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Kode Mata Uang
                  </label>
                  <input
                    type="text"
                    name="kode"
                    value={form.kode}
                    onChange={(e) => setForm({ ...form, kode: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Nama Mata Uang
                  </label>
                  <input
                    type="text"
                    name="nama"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Simbol Mata Uang
                  </label>
                  <input
                    type="text"
                    name="simbol"
                    value={form.simbol}
                    onChange={(e) => setForm({ ...form, simbol: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                    Kurs
                  </label>
                  <input
                    type="number"
                    name="kurs"
                    value={form.kurs}
                    onChange={(e) => setForm({ ...form, kurs: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2 transition"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="aktif"
                      checked={form.aktif}
                      onChange={(e) => setForm({ ...form, aktif: e.target.checked })}
                      className="w-6 h-6 transition"
                      style={{
                        background: theme.fieldColor,
                        color: theme.fontColor,
                        fontFamily: theme.fontFamily,
                      }}
                    />
                    <label className="ml-2 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      Aktif
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "AkunGL" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { key: "HutangUsaha", label: "Akun Pembelian" },
                  { key: "PiutangUsaha", label: "Akun Penjualan" },
                  { key: "UangMukaBeli", label: "Akun Uang Muka Pembelian" },
                  { key: "UangMukaJual", label: "Akun Uang Muka Penjualan" },
                  { key: "DiskonJual", label: "Akun Diskon Penjualan" },
                  { key: "DiskonBeli", label: "Akun Diskon Pembelian" },
                  { key: "Pembulatan", label: "Akun Pembulatan" },
                  { key: "KeuntunganDirealisasi", label: "Akun Keuntungan Direalisasi" },
                  { key: "KeuntunganBelumDirealisasi", label: "Akun Keuntungan Belum Direalisasi" },
                  { key: "HutangJatuhTempo", label: "Akun Pembelian Hutang Jatuh Tempo" },
                  { key: "PiutangJatuhTempo", label: "Akun Penjualan Piutang Jatuh Tempo" },
                  { key: "BiayaLainLain", label: "Akun Biaya Lain-lain" },
                  { key: "BiayaMaterai", label: "Akun Biaya Materai" },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                      {field.label}
                    </label>
                    <Select
                      options={coaOptions}
                      value={coaOptions.find((opt) => opt.value === glAccount[field.key]) || null}
                      onChange={(opt) => setGlAccount((prev) => ({ ...prev, [field.key]: opt ? opt.value : "" }))}
                      isClearable
                      placeholder={`Pilih ${field.label}`}
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          background: theme.fieldColor,
                          color: theme.fontColor,
                          fontFamily: theme.fontFamily,
                        }),
                        menu: (base) => ({
                          ...base,
                          background: theme.fieldColor, // Sesuaikan latar belakang dropdown
                          color: theme.fontColor, // Sesuaikan warna teks dropdown
                          fontFamily: theme.fontFamily, // Sesuaikan font dropdown
                          zIndex: 20,
                        }),
                        option: (base, state) => ({
                          ...base,
                          background: state.isSelected ? theme.buttonSimpan : theme.fieldColor, // Warna saat dipilih
                          color: state.isSelected ? "#fff" : theme.fontColor, // Warna teks saat dipilih
                          fontFamily: theme.fontFamily,
                          "&:hover": {
                            background: theme.buttonUpdate, // Warna saat hover
                            color: "#fff",
                          },
                        }), singleValue: (base) => ({
                          ...base,
                          color: theme.fontColor, // Warna teks pada nilai yang dipilih
                          fontFamily: theme.fontFamily,
                        }),
                        placeholder: (base) => ({
                          ...base,
                          color: theme.placeholderColor, // Warna teks placeholder
                          fontFamily: theme.fontFamily,
                        }),
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg font-semibold transition"
                style={{
                  background: theme.buttonSimpan,
                  color: "#fff",
                  fontFamily: theme.fontFamily,
                }}
              >
                {editId ? "Update" : "Simpan"}
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
            Tampilkan Form
          </button>
        </div>
      )}

      <div className="w-full">
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Cari kode/nama/simbol..."
            className="border rounded-lg px-3 py-2 w-full md:w-64 transition"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            style={{
              background: theme.fieldColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
            }}
          />
        </div>
        <div ref={tableRef} style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="w-full border rounded-lg text-sm shadow-sm" style={{ fontFamily: theme.tableFontFamily }}>
            <thead>
              <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                <th className="px-3 py-2 font-semibold border-b">Kode</th>
                <th className="px-3 py-2 font-semibold border-b">Nama</th>
                <th className="px-3 py-2 font-semibold border-b">Simbol</th>
                <th className="px-3 py-2 font-semibold border-b">Kurs</th>
                <th className="px-3 py-2 font-semibold border-b">Akun GL</th>
                <th className="px-3 py-2 font-semibold border-b">Status</th>
                <th className="px-3 py-2 font-semibold border-b">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id} className="border-b last:border-b-0" style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                  <td className="px-3 py-2">{row.kode}</td>
                  <td className="px-3 py-2">{row.nama}</td>
                  <td className="px-3 py-2">{row.simbol}</td>
                  <td className="px-3 py-2">{row.kurs}</td>
                  <td className="px-3 py-2">{row.akunGL}</td>
                  <td className="px-3 py-2">{row.aktif ? "Aktif" : "Nonaktif"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(row.id)} // Ubah dari handleEdit(row) menjadi handleEdit(row.id)
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
                        onClick={() => {
                          if (window.confirm(`Hapus mata uang "${row.nama}"?`)) {
                            api.delete(`/master-mata-uang/${row.id}`).then(() => fetchData());
                          }
                        }}
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
  );
}