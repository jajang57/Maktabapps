import { useState, useContext, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

export default function MasterGudang() {
  const { theme } = useTheme();
  const [formVisible, setFormVisible] = useState(true);
  const [formFade, setFormFade] = useState(true);
  const [formAnim, setFormAnim] = useState("fade-down");
  const [form, setForm] = useState({
    kode: "",
    nama: "",
    group: "",
    departement: "",
    deskripsi: "",
    alamat: "",
    penanggungJawab: "",
  });
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState({
    kode: "",
    nama: "",
    group: "",
    departement: "",
    alamat: "",
    penanggungJawab: "",
  });
  const [groupData, setGroupData] = useState([]);
  const [departementData, setDepartementData] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showDepartementModal, setShowDepartementModal] = useState(false);
  const [groupForm, setGroupForm] = useState({ kode: "", nama: "" });
  const [departementForm, setDepartementForm] = useState({ kode: "", nama: "" });
  const [editGroupId, setEditGroupId] = useState(null);
  const [editDepartementId, setEditDepartementId] = useState(null);
  const [gudangNotif, setGudangNotif] = useState(""); // Tambahkan state notifikasi gudang
  // Tambahkan state untuk notifikasi
  const [groupNotif, setGroupNotif] = useState("");
  const [departementNotif, setDepartementNotif] = useState("");

  // Fetch data dari backend
  const fetchAll = () => {
    api.get("/master-gudang-group").then(res => setGroupData(res.data));
    api.get("/master-departement").then(res => setDepartementData(res.data));
    api.get("/master-gudang").then(res => setData(res.data));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Fungsi generate kode otomatis
  const generateKodeGudang = () => {
    const prefix = "GDG";
    const lastNumber = data.length > 0
      ? Math.max(...data.map(d => {
          const num = parseInt((d.kode || "").replace(prefix, ""));
          return isNaN(num) ? 0 : num;
        }))
      : 0;
    const nextNumber = lastNumber + 1;
    return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const kodeGudang = form.kode.trim() === "" ? generateKodeGudang() : form.kode.trim();
    if (!kodeGudang || !form.nama || !form.group || !form.departement || !form.alamat || !form.penanggungJawab) return;
    const newForm = { ...form, kode: kodeGudang };

    try {
      if (editId !== null) {
        await api.put(`/master-gudang/${data[editId].id}`, newForm);
        setGudangNotif("Berhasil update gudang!");
      } else {
        await api.post("/master-gudang", newForm);
        setGudangNotif("Berhasil simpan gudang!");
      }
      fetchAll();
      setForm({
        kode: "",
        nama: "",
        group: "",
        departement: "",
        deskripsi: "",
        alamat: "",
        penanggungJawab: "",
      });
      setEditId(null);
    } catch (err) {
      setGudangNotif("Gagal simpan gudang!");
    }
  };

  const handleEdit = (idx) => {
    setForm(data[idx]);
    setEditId(idx);
    setFormVisible(true);
  };

  const handleDelete = async (idx) => {
    try {
      await api.delete(`/master-gudang/${data[idx].id}`);
      setGudangNotif("Berhasil hapus gudang!");
      fetchAll();
      setForm({ kode: "", nama: "", group: "", departement: "", deskripsi: "", alamat: "", penanggungJawab: "" });
      setEditId(null);
    } catch (err) {
      setGudangNotif("Gagal hapus gudang!");
    }
  };

  const handleReset = () => {
    setForm({
      kode: "",
      nama: "",
      group: "",
      departement: "",
      deskripsi: "",
      alamat: "",
      penanggungJawab: "",
    });
    setEditId(null);
  };

  const handleHideForm = () => {
    setFormAnim("fade-up");
    setTimeout(() => {
      setFormVisible(false);
      setFormAnim("fade-down");
      setFormFade(false);
    }, 300);
  };

  const handleShowForm = () => {
    setFormVisible(true);
    setTimeout(() => {
      setFormAnim("fade-down");
      setFormFade(true);
    }, 10);
  };

  // CRUD Gudang Group ke backend
  const handleGroupSubmit = async (e) => {
    e.preventDefault();
    if (!groupForm.kode || !groupForm.nama) return;
    try {
      if (editGroupId !== null) {
        await api.put(`/master-gudang-group/${editGroupId}`, groupForm);
        setGroupNotif("Berhasil update group!");
      } else {
        await api.post("/master-gudang-group", groupForm);
        setGroupNotif("Berhasil tambah group!");
      }
      fetchAll();
      setGroupForm({ kode: "", nama: "" });
      setEditGroupId(null);
      // Modal tetap terbuka, data baru langsung muncul di tabel
      setForm(prev => ({ ...prev, group: groupForm.kode }));
    } catch (err) {
      setGroupNotif("Gagal simpan group!");
    }
  };

  const handleGroupEdit = (item) => {
    setGroupForm({ kode: item.kode, nama: item.nama });
    setEditGroupId(item.id);
    setGroupNotif("");
  };

  const handleGroupDelete = async (item) => {
    try {
      await api.delete(`/master-gudang-group/${item.id}`);
      setGroupNotif("Berhasil hapus group!");
      fetchAll();
      setGroupForm({ kode: "", nama: "" });
      setEditGroupId(null);
    } catch (err) {
      setGroupNotif("Gagal hapus group!");
    }
  };

  // CRUD Departement ke backend
  const handleDepartementSubmit = async (e) => {
    e.preventDefault();
    if (!departementForm.kode || !departementForm.nama) return;
    try {
      if (editDepartementId !== null) {
        await api.put(`/master-departement/${editDepartementId}`, departementForm);
        setDepartementNotif("Berhasil update departement!");
      } else {
        await api.post("/master-departement", departementForm);
        setDepartementNotif("Berhasil tambah departement!");
      }
      fetchAll();
      setDepartementForm({ kode: "", nama: "" });
      setEditDepartementId(null);
      // Modal tetap terbuka, data baru langsung muncul di tabel
      setForm(prev => ({ ...prev, departement: departementForm.kode }));
    } catch (err) {
      setDepartementNotif("Gagal simpan departement!");
    }
  };

  const handleDepartementEdit = (item) => {
    setDepartementForm({ kode: item.kode, nama: item.nama });
    setEditDepartementId(item.id);
    setDepartementNotif("");
  };

  const handleDepartementDelete = async (item) => {
    try {
      await api.delete(`/master-departement/${item.id}`);
      setDepartementNotif("Berhasil hapus departement!");
      fetchAll();
      setDepartementForm({ kode: "", nama: "" });
      setEditDepartementId(null);
    } catch (err) {
      setDepartementNotif("Gagal hapus departement!");
    }
  };

  const filteredData = data.filter(row =>
    row.kode.toLowerCase().includes(filter.kode.toLowerCase()) &&
    row.nama.toLowerCase().includes(filter.nama.toLowerCase()) &&
    row.group.toLowerCase().includes(filter.group.toLowerCase()) &&
    row.departement.toLowerCase().includes(filter.departement.toLowerCase()) &&
    row.alamat.toLowerCase().includes(filter.alamat.toLowerCase()) &&
    row.penanggungJawab.toLowerCase().includes(filter.penanggungJawab.toLowerCase())
  );

  const getGroupNama = kode => {
    const found = groupData.find(item => item.kode === kode);
    return found ? found.nama : kode || "-";
  };
  const getDepartementNama = kode => {
    const found = departementData.find(item => item.kode === kode);
    return found ? found.nama : kode || "-";
  };

  return (
    <div className="space-y-6" style={{ background: theme.bgColor, fontFamily: theme.fontFamily, color: theme.fontColor }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor }}>Master Gudang</h1>
      {gudangNotif && (
        <div className="mb-2 px-4 py-2 rounded text-sm font-semibold"
             style={{ background: "#e0f7fa", color: "#00796b" }}>
          {gudangNotif}
        </div>
      )}
      {formVisible ? (
        <div
          className={`rounded-xl shadow-lg p-6 border transition-opacity duration-300 ${formFade ? "opacity-100" : "opacity-0"} ${formAnim}`}
          style={{ background: theme.formColor }}
        >
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={handleHideForm}
              className="px-4 py-2 rounded-lg font-semibold"
              style={{ background: theme.buttonUpdate, color: "#fff", fontFamily: theme.fontFamily }}
            >
              Sembunyikan Form
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Kode Gudang</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    name="kode"
                    value={form.kode}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Otomatis jika kosong"
                    style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                  />
                  <span className="text-xs text-gray-400">*Kosongkan untuk kode otomatis</span>
                </div>
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Nama Gudang</label>
                <input
                  type="text"
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Nama Gudang"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Gudang Group</label>
                <select
                  name="group"
                  value={form.group}
                  onChange={e => {
                    if (e.target.value === "__add_new__") {
                      setShowGroupModal(true);
                    } else {
                      setForm({ ...form, group: e.target.value });
                    }
                  }}
                  className="w-full border rounded-lg px-4 py-2"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                  required
                >
                  <option value="">Pilih Gudang Group</option>
                  {groupData.map(item => (
                    <option key={item.kode} value={item.kode}>{item.nama}</option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 'bold', color: '#0066cc' }}>+ Tambah Group</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Departement</label>
                <select
                  name="departement"
                  value={form.departement}
                  onChange={e => {
                    if (e.target.value === "__add_new__") {
                      setShowDepartementModal(true);
                    } else {
                      setForm({ ...form, departement: e.target.value });
                    }
                  }}
                  className="w-full border rounded-lg px-4 py-2"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                  required
                >
                  <option value="">Pilih Departement</option>
                  {departementData.map(item => (
                    <option key={item.kode} value={item.kode}>{item.nama}</option>
                  ))}
                  <option value="__add_new__" style={{ fontWeight: 'bold', color: '#0066cc' }}>+ Tambah Departement</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Deskripsi</label>
                <input
                  type="text"
                  name="deskripsi"
                  value={form.deskripsi}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Deskripsi (opsional)"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Alamat</label>
                <input
                  type="text"
                  name="alamat"
                  value={form.alamat}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Alamat Gudang"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Penanggung Jawab</label>
                <input
                  type="text"
                  name="penanggungJawab"
                  value={form.penanggungJawab}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Penanggung Jawab"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg font-semibold"
                style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}
              >
                {editId !== null ? "Update" : "Simpan"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 rounded-lg font-semibold"
                style={{ background: theme.buttonRefresh, color: "#fff", fontFamily: theme.fontFamily }}
              >
                Kosongkan
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleShowForm}
            className="px-4 py-2 rounded-lg font-semibold"
            style={{ background: theme.buttonUpdate, color: "#fff", fontFamily: theme.fontFamily }}
          >
            Tampilkan Form
          </button>
        </div>
      )}

      {/* Tabel Transaksi Gudang */}
      <div className="rounded-xl shadow-lg p-6 border mt-4"  style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.fontColor }}>Data Gudang</h2>
        <table className="min-w-full rounded-lg" style={{ fontFamily: theme.tableFontFamily }}>
          <thead>
            <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
              <th className="px-4 py-2">Kode Gudang</th>
              <th className="px-4 py-2">Nama Gudang</th>
              <th className="px-4 py-2">Gudang Group</th>
              <th className="px-4 py-2">Departement</th>
              <th className="px-4 py-2">Deskripsi</th>
              <th className="px-4 py-2">Alamat</th>
              <th className="px-4 py-2">Penanggung Jawab</th>
              <th className="px-4 py-2">Aksi</th>
            </tr>
            <tr>
              <th className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Filter kode"
                  value={filter.kode}
                  onChange={e => setFilter({ ...filter, kode: e.target.value })}
                  className="w-full px-2 py-1 rounded border"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Filter nama"
                  value={filter.nama}
                  onChange={e => setFilter({ ...filter, nama: e.target.value })}
                  className="w-full px-2 py-1 rounded border"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Filter group"
                  value={filter.group}
                  onChange={e => setFilter({ ...filter, group: e.target.value })}
                  className="w-full px-2 py-1 rounded border"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Filter departement"
                  value={filter.departement}
                  onChange={e => setFilter({ ...filter, departement: e.target.value })}
                  className="w-full px-2 py-1 rounded border"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-4 py-2"></th>
              <th className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Filter alamat"
                  value={filter.alamat}
                  onChange={e => setFilter({ ...filter, alamat: e.target.value })}
                  className="w-full px-2 py-1 rounded border"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-4 py-2">
                <input
                  type="text"
                  placeholder="Filter penanggung jawab"
                  value={filter.penanggungJawab}
                  onChange={e => setFilter({ ...filter, penanggungJawab: e.target.value })}
                  className="w-full px-2 py-1 rounded border"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-4" style={{ color: theme.fontMuted }}>
                  Belum ada data gudang.
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx} className="border-b" style={{ borderColor: theme.tableBorder }}>
                  <td className="px-4 py-2">{row.kode}</td>
                  <td className="px-4 py-2">{row.nama}</td>
                  <td className="px-4 py-2">{getGroupNama(row.group)}</td>
                  <td className="px-4 py-2">{getDepartementNama(row.departement)}</td>
                  <td className="px-4 py-2">{row.deskripsi}</td>
                  <td className="px-4 py-2">{row.alamat}</td>
                  <td className="px-4 py-2">{row.penanggungJawab}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(idx)}
                        className="px-4 py-1 rounded font-semibold transition-colors duration-150 hover:brightness-90"
                        style={{ background: theme.buttonUpdate, color: "#fff", fontFamily: theme.fontFamily }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="px-4 py-1 rounded font-semibold transition-colors duration-150 hover:brightness-90"
                        style={{ background: theme.buttonHapus, color: "#fff", fontFamily: theme.fontFamily }}
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

      {/* Modal Tambah Gudang Group */}
      {showGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
               style={{ background: theme.formColor }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.fontColor }}>Master Gudang Group</h2>
              <button
                onClick={() => {
                  setShowGroupModal(false);
                  setGroupForm({ kode: "", nama: "" });
                  setEditGroupId(null);
                  setGroupNotif("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {groupNotif && (
              <div className="mb-2 px-4 py-2 rounded text-sm font-semibold"
                   style={{ background: "#e0f7fa", color: "#00796b" }}>
                {groupNotif}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor }}>
                    Kode Group
                  </label>
                  <input
                    type="text"
                    value={groupForm.kode}
                    onChange={e => setGroupForm(prev => ({ ...prev, kode: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 mb-2"
                    placeholder="Contoh: GRP001"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor }}>Nama Group</label>
                  <input
                    type="text"
                    value={groupForm.nama}
                    onChange={e => setGroupForm(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 mb-4"
                    placeholder="Nama Group"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="submit" className="px-6 py-2 rounded-lg font-semibold" style={{ background: theme.buttonSimpan, color: "#fff" }}>
                    {editGroupId ? "Update" : "Simpan"}
                  </button>
                  {editGroupId && (
                    <button type="button" onClick={() => {
                      setGroupForm({ kode: "", nama: "" });
                      setEditGroupId(null);
                      setGroupNotif("");
                    }} className="px-4 py-2 rounded-lg font-semibold" style={{ background: theme.buttonHapus, color: "#fff" }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <div>
                <table className="w-full border rounded-lg text-sm shadow-sm" style={{ fontFamily: theme.tableFontFamily }}>
                  <thead>
                    <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                      <th className="px-3 py-2 font-semibold border-b">Kode</th>
                      <th className="px-3 py-2 font-semibold border-b">Nama</th>
                      <th className="px-3 py-2 font-semibold border-b">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupData.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{item.kode}</td>
                        <td className="px-3 py-2">{item.nama}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleGroupEdit(item)}
                            className="px-3 py-1 rounded font-semibold mr-2"
                            style={{ background: theme.buttonUpdate, color: "#fff" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleGroupDelete(item)}
                            className="px-3 py-1 rounded font-semibold"
                            style={{ background: theme.buttonHapus, color: "#fff" }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Departement */}
      {showDepartementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto"
               style={{ background: theme.formColor }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.fontColor }}>Master Departement</h2>
              <button
                onClick={() => {
                  setShowDepartementModal(false);
                  setDepartementForm({ kode: "", nama: "" });
                  setEditDepartementId(null);
                  setDepartementNotif("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {departementNotif && (
              <div className="mb-2 px-4 py-2 rounded text-sm font-semibold"
                   style={{ background: "#e0f7fa", color: "#00796b" }}>
                {departementNotif}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={handleDepartementSubmit} className="space-y-4">
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor }}>Kode Departement</label>
                  <input
                    type="text"
                    value={departementForm.kode}
                    onChange={e => setDepartementForm(prev => ({ ...prev, kode: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 mb-2"
                    placeholder="Contoh: DEP001"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold" style={{ color: theme.fontColor }}>Nama Departement</label>
                  <input
                    type="text"
                    value={departementForm.nama}
                    onChange={e => setDepartementForm(prev => ({ ...prev, nama: e.target.value }))}
                    className="w-full border rounded-lg px-4 py-2 mb-4"
                    placeholder="Nama Departement"
                    required
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                    }}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="submit" className="px-6 py-2 rounded-lg font-semibold" style={{ background: theme.buttonSimpan, color: "#fff" }}>
                    {editDepartementId ? "Update" : "Simpan"}
                  </button>
                  {editDepartementId && (
                    <button type="button" onClick={() => {
                      setDepartementForm({ kode: "", nama: "" });
                      setEditDepartementId(null);
                      setDepartementNotif("");
                    }} className="px-4 py-2 rounded-lg font-semibold" style={{ background: theme.buttonHapus, color: "#fff" }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
              <div>
                <table className="w-full border rounded-lg text-sm shadow-sm" style={{ fontFamily: theme.tableFontFamily }}>
                  <thead>
                    <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                      <th className="px-3 py-2 font-semibold border-b">Kode</th>
                      <th className="px-3 py-2 font-semibold border-b">Nama</th>
                      <th className="px-3 py-2 font-semibold border-b">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departementData.map((item) => (
                      <tr key={item.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{item.kode}</td>
                        <td className="px-3 py-2">{item.nama}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => handleDepartementEdit(item)}
                            className="px-3 py-1 rounded font-semibold mr-2"
                            style={{ background: theme.buttonUpdate, color: "#fff" }}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDepartementDelete(item)}
                            className="px-3 py-1 rounded font-semibold"
                            style={{ background: theme.buttonHapus, color: "#fff" }}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}