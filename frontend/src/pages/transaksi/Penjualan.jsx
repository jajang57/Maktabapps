import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../context/ThemeContext';
import api from "../../utils/api";

export default function Penjualan() {
  const { theme } = useTheme();

  // Tambahkan state master
  const [masterPembeli, setMasterPembeli] = useState([]);
  const [masterGudang, setMasterGudang] = useState([]);
  const [masterDepartement, setMasterDepartement] = useState([]);

  const [formData, setFormData] = useState({
    nomorInvoice: '',
    tanggal: new Date().toISOString().split('T')[0],
    dueDate: '',
    customer: '',
    gudang: '',
    termPembayaran: '',
    departement: '',
    nomorEfaktur: '',
    notes: ''
  });

  const [items, setItems] = useState([
    {
      id: 1,
      kodeItem: '',
      namaItem: '',
      qty: 0,
      unit: '',
      price: 0,
      discPercent: 0,
      discAmountItem: 0,
      discAmount: 0,
      tax: 0,
      amount: 0
    }
  ]);

  const [masterBarangJasa, setMasterBarangJasa] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [listPenjualan, setListPenjualan] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchMasterBarangJasa();
    fetchMasterPembeli();
    fetchMasterGudang();
    fetchMasterDepartement();
    generateNomorInvoice();
    fetchListPenjualan();
  }, []);
useEffect(() => {
  console.log('Isi masterPembeli:', masterPembeli);
}, [masterPembeli]);
  // Fetch master pembeli
  const fetchMasterPembeli = async () => {
    try {
      const response = await api.get('/master-pembeli');
      setMasterPembeli(response.data);
    } catch (error) { }
  };
  // Fetch master gudang
  const fetchMasterGudang = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/master-gudang', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMasterGudang(data);
      }
    } catch (error) { }
  };
  // Fetch master departement
  const fetchMasterDepartement = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/master-departement', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMasterDepartement(data);
      }
    } catch (error) { }
  };

  const fetchMasterBarangJasa = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/master-barang-jasa', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMasterBarangJasa(data);
      }
    } catch (error) {
      console.error('Error fetching master barang jasa:', error);
    }
  };

  const generateNomorInvoice = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      nomorInvoice: `INV-${year}${month}${day}-${random}`
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value // biarkan string
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto calculate
    if (['qty', 'price', 'discPercent', 'discAmountItem', 'tax'].includes(field)) {
      const item = newItems[index];
      const subtotal = item.qty * item.price;
      const discAmountItem = item.discAmountItem || 0;
      const discAmount = (subtotal * item.discPercent) / 100 + discAmountItem;
      const afterDisc = subtotal - discAmount;
      const taxAmount = (afterDisc * item.tax) / 100;
      newItems[index].discAmount = discAmount;
      newItems[index].amount = afterDisc + taxAmount;
    }

    setItems(newItems);
  };

  const addNewItem = () => {
    setItems([...items, {
      id: items.length + 1,
      kodeItem: '',
      namaItem: '',
      qty: 0,
      unit: '',
      price: 0,
      discPercent: 0,
      discAmountItem: 0,
      discAmount: 0,
      tax: 0,
      amount: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculateSubtotal = () => items.reduce((total, item) => total + (item.qty * item.price), 0);
  const calculatePPN = () =>
  items.reduce((total, item) => {
    const subtotal = item.qty * item.price;
    const discAmountItem = item.discAmountItem || 0;
    const discAmount = (subtotal * item.discPercent) / 100 + discAmountItem;
    const afterDisc = subtotal - discAmount;
    const taxAmount = (afterDisc * item.tax) / 100;
    return total + taxAmount;
  }, 0);
  const calculateTotal = () => items.reduce((total, item) => total + (item.amount || 0), 0);

  const handleSave = async () => {
    try {
      const invoiceData = {
        nomorInvoice: formData.nomorInvoice,
        tanggal: formData.tanggal, // atau tanggalStr jika backend pakai string
        dueDate: formData.dueDate, // atau dueDateStr
        customerId: formData.customer ? Number(formData.customer) : null,
        gudangId: Number(formData.gudang),
        departementId: Number(formData.departement),
        nomorEfaktur: formData.nomorEfaktur,
        notes: formData.notes,
        subtotal: calculateSubtotal(),
        ppn: calculatePPN(),
        freight: parseFloat(formData.freight) || 0,
        stamp: parseFloat(formData.stamp) || 0,
        total: calculateTotal() + (parseFloat(formData.freight) || 0) + (parseFloat(formData.stamp) || 0),
        status: 'draft',
        details: items.map(item => ({
          kodeItem: item.kodeItem,
          namaItem: item.namaItem,
          qty: item.qty,
          unit: item.unit,
          price: item.price,
          discPercent: item.discPercent,
          discAmountItem: item.discAmountItem,
          discAmount: item.discAmount,
          tax: item.tax,
          amount: item.amount
        }))
      };

      const url = editMode ? `/penjualan/${editId}` : '/penjualan';
      const method = editMode ? 'put' : 'post';
      const response = await api[method](url, invoiceData);

      if (response.status === 200 || response.status === 201) {
        setEditMode(false);
        setEditId(null);
        // Reset form
        setFormData({
          nomorInvoice: '',
          tanggal: new Date().toISOString().split('T')[0],
          customer: '',
          alamat: '',
          noTelp: '',
          termPembayaran: '',
          jatuhTempo: '',
          keterangan: ''
        });
        setItems([{
          id: 1,
          packingNo: '',
          itemNo: '',
          description: '',
          qty: 0,
          unit: '',
          unitPrice: 0,
          discPercent: 0,
          discAmountItem: 0,
          discAmount: 0,
          tax: 0,
          amount: 0,
          serialBatchNumber: '',
          notes: ''
        }]);
        generateNomorInvoice();
        fetchListPenjualan();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Gagal menyimpan invoice!');
    }
  };

  const handleDelete = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan semua data?')) {
      setFormData({
        nomorInvoice: '',
        tanggal: new Date().toISOString().split('T')[0],
        customer: '',
        alamat: '',
        noTelp: '',
        termPembayaran: '',
        jatuhTempo: '',
        keterangan: ''
      });
      setItems([{
        id: 1,
        packingNo: '',
        itemNo: '',
        description: '',
        qty: 0,
        unit: '',
        unitPrice: 0,
        discPercent: 0,
        discAmountItem: 0,
        discAmount: 0,
        tax: 0,
        amount: 0,
        serialBatchNumber: '',
        notes: ''
      }]);
      generateNomorInvoice();
    }
  };

  // Fetch list transaksi penjualan
  const fetchListPenjualan = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/penjualan');
      setListPenjualan(response.data);
    } catch (error) {
      setListPenjualan([]);
    }
    setLoadingList(false);
  };

  // Filter transaksi berdasarkan search
  const filteredPenjualan = listPenjualan.filter(trx =>
    trx.nomorInvoice?.toLowerCase().includes(search.toLowerCase()) ||
    trx.customerNama?.toLowerCase().includes(search.toLowerCase()) ||
    String(trx.total).includes(search)
  );

  // Fungsi untuk handle edit
  const handleEdit = (trx) => {
    setShowForm(true);
    setEditMode(true);
    setEditId(trx.id);
    setFormData({
      nomorInvoice: trx.nomorInvoice,
      tanggal: trx.tanggal?.split('T')[0] || '',
      dueDate: trx.dueDate?.split('T')[0] || '',
      customer: String(trx.customerId),
      gudang: String(trx.gudangId),
      departement: String(trx.departementId),
      nomorEfaktur: trx.nomorEfaktur || '',
      notes: trx.notes || '',
      freight: trx.freight || 0,
      stamp: trx.stamp || 0,
      // tambahkan field lain jika ada
    });
    setItems(trx.details?.map((item, idx) => ({
      id: idx + 1,
      kodeItem: item.kodeItem,
      namaItem: item.namaItem,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      discPercent: item.discPercent,
      discAmountItem: item.discAmountItem,
      discAmount: item.discAmount,
      tax: item.tax,
      amount: item.amount
    })) || []);
  };

  // Fungsi hapus transaksi penjualan
  const handleDeleteTransaksi = async (id) => {
    if (window.confirm('Yakin ingin menghapus transaksi ini?')) {
      try {
        const response = await api.delete(`/penjualan/${id}`);
        if (response.status === 200) {
          alert('Transaksi berhasil dihapus!');
          fetchListPenjualan();
        } else {
          alert('Gagal menghapus transaksi!');
        }
      } catch (error) {
        alert('Gagal menghapus transaksi!');
      }
    }
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: theme.backgroundColor, color: theme.fontColor, fontFamily: theme.fontFamily }}>
      <h1 className="text-2xl font-bold mb-6">Penjualan - AR Invoice</h1>
      
      {/* Card Form Input */}
      <Card className="p-8 rounded-xl shadow-lg mb-8" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.cardBorderColor }}>
        {/* Header & Tombol Tampilkan Form */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Form Input</h2>
          <Button
            onClick={() => setShowForm(!showForm)}
            style={{
              background: showForm ? theme.buttonHapus : theme.buttonSimpan,
              color: "#fff",
              fontWeight: "bold",
              borderRadius: 8,
              padding: "8px 20px"
            }}
          >
            {showForm ? "Sembunyikan Form" : "Tampilkan Form"}
          </Button>
        </div>   

        {/* Form Penjualan */}
        {showForm && (
          <div>
            {/* Form Input Atas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Customer</label>
               <select
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded"
                style={{ ...inputStyle(theme) }}
              >
                <option value="">Pilih Customer</option>
                {masterPembeli.map(p => (
                  <option key={p.id} value={String(p.ID)}>{p.nama}</option>
                ))}
              </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Invoice No.</label>
                <Input name="nomorInvoice" value={formData.nomorInvoice} readOnly style={{ ...inputStyle(theme) }} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Tanggal</label>
                <Input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Due Date</label>
                <Input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Gudang</label>
                <select
                  name="gudang"
                  value={formData.gudang}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  style={{ ...inputStyle(theme) }}
                >
                  <option value="">Pilih Gudang</option>
                  {masterGudang.map(g => (
                    <option key={g.id} value={g.id}>{g.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700">Departement</label>
                <select
                  name="departement"
                  value={formData.departement}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded"
                  style={{ ...inputStyle(theme) }}
                >
                  <option value="">Pilih Departement</option>
                  {masterDepartement.map(d => (
                    <option key={d.id} value={d.id}>{d.nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Table Items */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Detail Barang/Jasa
                </h3>
                <Button onClick={addNewItem} style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily, border: `2px solid ${theme.buttonSimpan}` }}>
                  + Tambah Item
                </Button>
              </div>
              <div className="overflow-x-auto rounded-lg border" style={{ borderColor: theme.cardBorderColor }}>
                <table className="w-full border-collapse" style={{ fontFamily: theme.tableFontFamily }}>
                  <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                    <tr>
                      <th className="px-3 py-2">Kode Item</th>
                      <th className="px-3 py-2">Nama Item</th>
                      <th className="px-3 py-2">Qty</th>
                      <th className="px-3 py-2">Item Unit</th>
                      <th className="px-3 py-2">Price</th>
                      <th className="px-3 py-2">Discount %</th>
                      <th className="px-3 py-2">Discount Amount Item</th>
                      <th className="px-3 py-2">Discount Amount</th>
                      <th className="px-3 py-2">Tax</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item.id} style={{ background: index % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor, color: theme.tableFontColor }}>
                        <td className="px-2 py-1">
                          <select value={item.kodeItem} onChange={e => {
                            const selected = masterBarangJasa.find(m => m.kode === e.target.value);
                            handleItemChange(index, 'kodeItem', e.target.value);
                            handleItemChange(index, 'namaItem', selected ? selected.nama : '');
                            handleItemChange(index, 'unit', selected ? selected.satuan : '');
                            handleItemChange(index, 'price', selected ? selected.hargaJual : 0);
                          }} className="w-full px-1 py-1 text-xs border border-gray-200 rounded">
                            <option value="">Pilih Kode</option>
                            {masterBarangJasa.map(item => (
                              <option key={item.id} value={item.kode}>{item.kode}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input type="text" value={item.namaItem} onChange={e => handleItemChange(index, 'namaItem', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={item.qty} onChange={e => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded text-right" min="0" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="text" value={item.unit} onChange={e => handleItemChange(index, 'unit', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={item.price} onChange={e => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded text-right" min="0" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={item.discPercent} onChange={e => handleItemChange(index, 'discPercent', parseFloat(e.target.value) || 0)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded text-right" min="0" max="100" />
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={item.discAmountItem} onChange={e => handleItemChange(index, 'discAmountItem', parseFloat(e.target.value) || 0)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded text-right" min="0" />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <span className="text-xs">{item.discAmount.toLocaleString('id-ID')}</span>
                        </td>
                        <td className="px-2 py-1">
                          <input type="number" value={item.tax} onChange={e => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded text-right" min="0" max="100" />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <span className="text-xs font-semibold">{item.amount.toLocaleString('id-ID')}</span>
                        </td>
                        <td className="px-2 py-1">
                          <Button onClick={() => removeItem(index)} style={{ background: theme.buttonHapus, color: "#fff", fontFamily: theme.fontFamily, fontSize: 12, border: `2px solid ${theme.buttonHapus}` }} disabled={items.length === 1}>
                            Hapus
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: theme.tableFooterColor, color: theme.tableFontColor }}>
                      <td colSpan="9" className="border px-2 py-2 text-right" style={{ borderColor: theme.cardBorderColor }}>
                        Total:
                      </td>
                      <td className="border px-2 py-2 text-right" style={{ borderColor: theme.cardBorderColor }}>
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </td>
                      <td className="border"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Bagian Bawah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Kiri: Nomor eFaktur & Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Nomor eFaktur</label>
                  <Input name="nomorEfaktur" value={formData.nomorEfaktur} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                    style={{
                      background: theme.fieldColor,
                      color: theme.fontColor,
                      fontFamily: theme.fontFamily,
                      borderColor: theme.dropdownColor,
                    }}
                  />
                </div>
              </div>
              {/* Kanan: Summary */}
              <div>
                <div className="rounded-lg p-6 mb-4" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, border: `1px solid ${theme.cardBorderColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span>Sub Total:</span>
                    <span className="font-semibold">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>PPN:</span>
                    <span className="font-semibold">Rp {calculatePPN().toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Freight:</span>
                    <Input type="number" name="freight" value={formData.freight || 0} onChange={handleInputChange} style={{ ...inputStyle(theme), width: 80, textAlign: "right" }} />
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Stamp:</span>
                    <Input type="number" name="stamp" value={formData.stamp || 0} onChange={handleInputChange} style={{ ...inputStyle(theme), width: 80, textAlign: "right" }} />
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg mt-4">
                    <span>Total Invoice:</span>
                    <span>
                      Rp {(
                        calculateTotal()
                        + (parseFloat(formData.freight) || 0)
                        + (parseFloat(formData.stamp) || 0)
                      ).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Button onClick={handleSave} style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily, border: `2px solid ${theme.buttonSimpan}`, width: "100%", fontSize: 16, padding: "12px 0" }}>
                    {editMode ? "Update" : "Simpan"}
                  </Button>
                  <Button
  onClick={handleDelete}
  style={{
    background: theme.buttonKosongkan || "#6366f1",
    color: "#fff",
    fontFamily: theme.fontFamily,
    border: `2px solid ${theme.buttonKosongkan || "#6366f1"}`,
    width: "100%",
    fontSize: 16,
    padding: "12px 0"
  }}
>
  Kosongkan
</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Card List Transaksi Penjualan */}
      <Card className="p-8 rounded-xl shadow-lg" style={{
  background: theme.cardColor,
  color: theme.fontColor,
  fontFamily: theme.fontFamily,
  borderColor: theme.cardBorderColor
}}>
  <h2 className="text-lg font-bold mb-4" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
    Daftar Transaksi Penjualan
  </h2>
  <div className="flex gap-2 mb-2">
    <Input
      placeholder="Cari invoice/customer/total"
      value={search}
      onChange={e => setSearch(e.target.value)}
      style={{ width: 260, background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.dropdownColor }}
    />
    <Button style={{ background: theme.buttonSimpan, color: "#fff", fontWeight: "bold", borderRadius: 8 }}>
      Print
    </Button>
  </div>
  <div className="overflow-x-auto rounded-lg border mb-4" style={{ borderColor: theme.cardBorderColor }}>
    <table className="w-full border-collapse" style={{ fontFamily: theme.tableFontFamily }}>
      <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
        <tr>
          <th className="px-3 py-2">Invoice No.</th>
          <th className="px-3 py-2">Tanggal</th>
          <th className="px-3 py-2 w-48 text-left">Customer</th>
          <th className="px-3 py-2">Total</th>
          <th className="px-3 py-2">Status</th>
          <th className="px-3 py-2">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {filteredPenjualan.map((trx, idx) => (
          <tr key={trx.id} style={{
            background: idx % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor,
            color: theme.tableFontColor
          }}>
            <td className="px-2 py-1">{trx.nomorInvoice}</td>
            <td className="px-2 py-1">{trx.tanggal ? new Date(trx.tanggal).toLocaleDateString('id-ID') : ''}</td>
            <td className="px-2 py-1">
              {masterPembeli.find(p => String(p.ID) === String(trx.customerId))?.nama || '-'}
            </td>
            <td className="px-2 py-1 text-right">Rp {trx.total?.toLocaleString('id-ID')}</td>
            <td className="px-2 py-1">
              <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">{trx.status}</span>
            </td>
            <td className="px-2 py-1 flex gap-2">
              <Button
                style={{ background: theme.buttonUpdate, color: "#fff", fontWeight: "bold", borderRadius: 6, fontSize: 12, padding: "2px 12px" }}
                onClick={() => handleEdit(trx)}
              >
                Edit
              </Button>
              <Button
                style={{ background: theme.buttonHapus, color: "#fff", fontWeight: "bold", borderRadius: 6, fontSize: 12, padding: "2px 12px" }}
                onClick={() => handleDeleteTransaksi(trx.id)}
              >
                Hapus
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</Card>
    </div>
  );
}

// Helper style function
function inputStyle(theme) {
  return {
    background: theme.fieldColor,
    color: theme.fontColor,
    fontFamily: theme.fontFamily,
    borderColor: theme.dropdownColor,
  };
}