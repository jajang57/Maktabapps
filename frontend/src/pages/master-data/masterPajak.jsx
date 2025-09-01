import { useState, useContext, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import api from "../../utils/api";

export default function MasterPajak() {
  const { theme } = useTheme();
  const [formVisible, setFormVisible] = useState(true);
  const [formFade, setFormFade] = useState(true);
  const [formAnim, setFormAnim] = useState("fade-down");
  const [form, setForm] = useState({
    tax_name: "",
    rate_percent: "",
    code: "",
    description: "",
    sales_tax_account: "",
    purchase_tax_account: "",
    order: "",
  });
  const [data, setData] = useState([]);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState({
    tax_name: "",
    rate_percent: "",
    code: "",
    description: "",
    sales_tax_account: "",
    purchase_tax_account: "",
    order: "",
  });
  const [accountData, setAccountData] = useState([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState({ code: "", name: "" });
  const [editAccountId, setEditAccountId] = useState(null);
  const [pajakNotif, setPajakNotif] = useState("");
  const [accountNotif, setAccountNotif] = useState("");
  // Tambahkan state untuk menyimpan data akun GL
  const [akunGL, setAkunGL] = useState([]);

  // Fetch data dari backend
  const fetchAll = () => {
    api.get("/master-pajak").then(res => setData(res.data));
    api.get("/master-coa").then(res => setAccountData(res.data));
  };

  // Fetch data akun GL dari backend
  const fetchAkunGL = () => {
     api.get("/master-coa")
      .then(res => setAkunGL(res.data))
      .catch(() => alert("Gagal mengambil data akun GL"));
  };

  useEffect(() => {
    fetchAll();
    fetchAkunGL(); // Panggil fetchAkunGL saat komponen pertama kali di-render
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === "rate_percent" ? parseFloat(value) || ""
        : name === "order" ? parseInt(value) || "" : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.tax_name || !form.rate_percent || !form.code || !form.sales_tax_account || !form.purchase_tax_account) return;

    try {
      if (editId !== null) {
        await api.put(`/master-pajak/${data[editId].id}`, form);
        setPajakNotif("Berhasil update pajak!");
      } else {
        await api.post("/master-pajak", form);
        setPajakNotif("Berhasil simpan pajak!");
      }
      fetchAll();
      setForm({
        tax_name: "",
        rate_percent: "",
        code: "",
        description: "",
        sales_tax_account: "",
        purchase_tax_account: "",
        order: "",
      });
      setEditId(null);
    } catch (err) {
      setPajakNotif("Gagal simpan pajak!");
    }
  };

  const handleEdit = (idx) => {
    setForm({
      ...data[idx],
      order: data[idx].order || ""
    });
    setEditId(idx);
    setFormVisible(true);
  };

  const handleDelete = async (idx) => {
    try {
      await api.delete(`/master-pajak/${data[idx].id}`);
      setPajakNotif("Berhasil hapus pajak!");
      fetchAll();
      setForm({
        tax_name: "",
        rate_percent: "",
        code: "",
        description: "",
        sales_tax_account: "",
        purchase_tax_account: "",
        order: "",
      });
      setEditId(null);
    } catch (err) {
      setPajakNotif("Gagal hapus pajak!");
    }
  };

  const handleReset = () => {
    setForm({
      tax_name: "",
      rate_percent: "",
      code: "",
      description: "",
      sales_tax_account: "",
      purchase_tax_account: "",
      order: "",
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

  const filteredData = data.filter(row =>
    row.tax_name.toLowerCase().includes(filter.tax_name.toLowerCase()) &&
    row.rate_percent.toString().includes(filter.rate_percent.toString()) &&
    row.code.toLowerCase().includes(filter.code.toLowerCase()) &&
    row.description.toLowerCase().includes(filter.description.toLowerCase()) &&
    row.sales_tax_account.toLowerCase().includes(filter.sales_tax_account.toLowerCase()) &&
    row.purchase_tax_account.toLowerCase().includes(filter.purchase_tax_account.toLowerCase()) &&
    (row.order ? row.order.toString().includes(filter.order.toString()) : true)
  );

  const getAkunGLName = (kode) => {
    const akun = akunGL.find(a => a.kode === kode);
    return akun ? `${akun.kode} - ${akun.nama}` : kode;
  };

  // Sort akunGL berdasarkan kode sebelum render dropdown
  const sortedAkunGL = [...akunGL].sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));

  return (
    <div className="space-y-6" style={{ background: theme.bgColor, fontFamily: theme.fontFamily, color: theme.fontColor }}>
      <h1 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor }}>Master Pajak</h1>
      {pajakNotif && (
        <div className="mb-2 px-4 py-2 rounded text-sm font-semibold"
             style={{ background: "#e0f7fa", color: "#00796b" }}>
          {pajakNotif}
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
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Urutan
                </label>
                <input
                  type="number"
                  name="order"
                  value={form.order}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Urutan"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Nama Pajak
                </label>
                <input
                  type="text"
                  name="tax_name"
                  value={form.tax_name}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Nama Pajak"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Persentase Pajak (%)
                </label>
                <input
                  type="number"
                  name="rate_percent"
                  value={form.rate_percent}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Persentase Pajak (%)"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Kode Pajak
                </label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Kode Pajak"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Deskripsi
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Deskripsi"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Akun Pajak Penjualan
                </label>
                <select
                  name="sales_tax_account"
                  value={form.sales_tax_account}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                >
                  <option value="">Pilih Akun Pajak Penjualan</option>
                  {sortedAkunGL.map((akun) => (
                    <option key={akun.id} value={akun.kode}>
                      {akun.kode} - {akun.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-semibold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Akun Pajak Pembelian
                </label>
                <select
                  name="purchase_tax_account"
                  value={form.purchase_tax_account}
                  onChange={handleChange}
                  required
                  className="w-full border rounded-lg px-4 py-2"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                >
                  <option value="">Pilih Akun Pajak Pembelian</option>
                  {sortedAkunGL.map((akun) => (
                    <option key={akun.id} value={akun.kode}>
                      {akun.kode} - {akun.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="submit"
                className="px-6 py-2 rounded-lg font-semibold"
                style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily }}
              >
                {editId !== null ? "Perbarui" : "Simpan"}
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

      {/* Tabel Data Pajak */}
      <div className="rounded-xl shadow-lg p-6 border mt-4" style={{ maxHeight: '500px', overflowY: 'auto' }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.fontColor }}>Data Pajak</h2>
        <table className="min-w-full rounded-lg" style={{ fontFamily: theme.tableFontFamily }}>
          <thead style={{ fontSize: '0.95rem' }}>
            <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
              <th className="px-2 py-2 text-center rounded-tl-lg">Urutan</th>
              <th className="px-2 py-2 text-center">Nama Pajak</th>
              <th className="px-2 py-2 text-center">Persentase Pajak (%)</th>
              <th className="px-2 py-2 text-center">Kode Pajak</th>
              <th className="px-2 py-2 text-center">Deskripsi</th>
              <th className="px-2 py-2 text-center">Akun Pajak Penjualan</th>
              <th className="px-2 py-2 text-center">Akun Pajak Pembelian</th>
              <th className="px-2 py-2 text-center rounded-tr-lg">Aksi</th>
            </tr>
            <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Urutan"
                  value={filter.order}
                  onChange={e => setFilter({ ...filter, order: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Tax Name"
                  value={filter.tax_name}
                  onChange={e => setFilter({ ...filter, tax_name: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Rate %"
                  value={filter.rate_percent}
                  onChange={e => setFilter({ ...filter, rate_percent: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Code"
                  value={filter.code}
                  onChange={e => setFilter({ ...filter, code: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Description"
                  value={filter.description}
                  onChange={e => setFilter({ ...filter, description: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Sales Tax Account"
                  value={filter.sales_tax_account}
                  onChange={e => setFilter({ ...filter, sales_tax_account: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1">
                <input
                  type="text"
                  placeholder="Filter Purchase Tax Account"
                  value={filter.purchase_tax_account}
                  onChange={e => setFilter({ ...filter, purchase_tax_account: e.target.value })}
                  className="w-full px-1 py-1 rounded border text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
                />
              </th>
              <th className="px-1 py-1"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4" style={{ color: theme.fontMuted }}>
                  Belum ada data pajak.
                </td>
              </tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx} className="border-b transition duration-200 hover:bg-blue-950/40 text-sm" style={{ borderColor: theme.tableBorder }}>
                  <td className="px-2 py-2 text-center font-semibold">{row.order}</td>
                  <td className="px-2 py-2 text-center">{row.tax_name}</td>
                  <td className="px-2 py-2 text-center">{row.rate_percent}</td>
                  <td className="px-2 py-2 text-center">{row.code}</td>
                  <td className="px-2 py-2 text-center">{row.description}</td>
                  <td className="px-2 py-2 text-center">{getAkunGLName(row.sales_tax_account)}</td>
                  <td className="px-2 py-2 text-center">{getAkunGLName(row.purchase_tax_account)}</td>
                  <td className="px-2 py-2 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(idx)}
                        className="px-3 py-1 rounded font-semibold text-xs transition duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        style={{ background: theme.buttonUpdate, color: "#fff", fontFamily: theme.fontFamily }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(idx)}
                        className="px-3 py-1 rounded font-semibold text-xs transition duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-400"
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
    </div>
  );
}