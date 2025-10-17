import React, { useEffect, useState } from 'react';
import { Fragment } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../context/ThemeContext';
import api from "../../utils/api";
import Select from 'react-select';

export default function Pembelian() {
  const { theme } = useTheme();
  
    // States
  const [masterSupplier, setMasterSupplier] = useState([]);
  const [loadingSupplier, setLoadingSupplier] = useState(true);
  const [listPembelian, setListPembelian] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedModalItems, setSelectedModalItems] = useState([]);
  const [modalFilter, setModalFilter] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  // ✅ Tambahkan missing editing states:
  const [editingQty, setEditingQty] = useState({});
  const [editingPrice, setEditingPrice] = useState({});
  const [editingDiscPercent, setEditingDiscPercent] = useState({});
  const [editingDiscAmountItem, setEditingDiscAmountItem] = useState({});

  // column resize state & handlers
  const [columnWidths, setColumnWidths] = useState({
    kodeItem: 100, namaItem: 220, qty: 80, unit: 80, price: 100, tax: 220, discAmount: 100, dpp: 120, total: 100, aksi: 80
  });
  const resizingRef = React.useRef(null);

  const onMouseMove = (e) => {
    const r = resizingRef.current;
    if (!r) return;
    const delta = e.clientX - r.startX;
    setColumnWidths(prev => ({ ...prev, [r.key]: Math.max(40, r.startWidth + delta) }));
  };
  const onMouseUp = () => {
    resizingRef.current = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
  const startResize = (key, e) => {
    e.preventDefault();
    resizingRef.current = { key, startX: e.clientX, startWidth: columnWidths[key] || 100 };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Master Data States
  const [masterGudang, setMasterGudang] = useState([]);
  const [masterDepartement, setMasterDepartement] = useState([]);
  const [masterPajak, setMasterPajak] = useState([]);
  const [masterBarangJasa, setMasterBarangJasa] = useState([]);

  const [formData, setFormData] = useState({
    nomorapinvoice: '',
    tanggal: new Date().toISOString().split('T')[0],
    deliveryDate: '',
    supplier: '',
    gudang: '',
    departement: '',
    nomorRefSupplier: '',
    notes: '',
    freight: 0,
    stamp: 0
  });

  const [items, setItems] = useState([]);
  // const [search, setSearch] = useState('');
  // const [showForm, setShowForm] = useState(false);
  // const [listPembelian, setListPembelian] = useState([]);
  // const [loadingList, setLoadingList] = useState(false);
  // const [editMode, setEditMode] = useState(false);
  // const [editId, setEditId] = useState(null);
  // const [showModal, setShowModal] = useState(false);
  // const [selectedModalItems, setSelectedModalItems] = useState([]);
  // const [modalFilter, setModalFilter] = useState("");
  // const [saving, setSaving] = useState(false);
  // const [loadingSupplier, setLoadingSupplier] = useState(true);

  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        fetchMasterBarangJasa(),
        fetchMasterSupplier(),
        fetchMasterGudang(),
        fetchMasterDepartement(),
        fetchMasterPajak(),
        fetchListPembelian()
      ]);
      generateNomorapinvoice();
    };
    
    initializeData();
  }, []); // ✅ Empty dependency array

  // Fetch functions
  const fetchMasterSupplier = async () => {
    try {
      setLoadingSupplier(true);
      const response = await api.get('/pemasok-list');
      console.log('Master Supplier Response:', response.data);
      setMasterSupplier(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching master supplier:', error);
      setMasterSupplier([]);
    } finally {
      setLoadingSupplier(false);
    }
  };

  const fetchMasterGudang = async () => {
    try {
      const response = await api.get('/master-gudang');
      setMasterGudang(response.data);
    } catch (error) { }
  };

  const fetchMasterDepartement = async () => {
    try {
      const response = await api.get('/master-departement');
      setMasterDepartement(response.data);
    } catch (error) { }
  };

  const fetchMasterBarangJasa = async () => {
    try {
      const response = await api.get('/master-barang-jasa');
      setMasterBarangJasa(response.data);
    } catch (error) {
      console.error('Error fetching master barang jasa:', error);
    }
  };

  const fetchMasterPajak = async () => {
    try {
      const response = await api.get('/master-pajak');
      setMasterPajak(response.data);
    } catch (error) { }
  };

  const generateNomorapinvoice = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    setFormData(prev => ({
      ...prev,
      nomorapinvoice: `apinv-${year}${month}${day}-${random}`
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', { name, value }); // ✅ Debug log
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const parseDppFormula = (s) => {
    if (s === undefined || s === null) return 1;
    const str = String(s).trim();
    if (str.includes('/')) {
      const parts = str.split('/');
      const a = parseFloat(parts[0].replace(',', '.'));
      const b = parseFloat(parts[1].replace(',', '.'));
      if (!isNaN(a) && !isNaN(b) && b !== 0) return a / b;
      return 1;
    }
    const n = parseFloat(str.replace(',', '.'));
    return isNaN(n) ? 1 : n;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...(newItems[index] || {}) };
    item[field] = value;

    const parseNum = v => {
      if (v === "" || v === null || v === undefined) return 0;
      const s = String(v).trim().replace(/,/g, '.');
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : 0;
    };

    const qty = parseNum(item.qty);
    const price = parseNum(item.price);
    let discPercent = item.discPercent === "" ? 0 : parseNum(item.discPercent);
    let discAmountItem = item.discAmountItem === "" ? 0 : parseNum(item.discAmountItem);

    if (field === 'discPercent') {
      if (price > 0 && discPercent > 0) {
        discAmountItem = (price * discPercent) / 100;
      } else {
        discAmountItem = 0;
      }
    }

    if (field === 'discAmountItem') {
      if (price > 0 && discAmountItem > 0) {
        discPercent = (discAmountItem / price) * 100;
      } else {
        discPercent = 0;
      }
    }

    const discAmount = discAmountItem * qty;
    const subtotal = qty * price;
    const afterDisc = subtotal - discAmount;

    item.discPercent = discPercent;
    item.discAmountItem = Number(Number(discAmountItem || 0).toFixed(2));
    item.discAmount = Number(Number(discAmount || 0).toFixed(2));

    item.taxamount1 = 0;
    item.taxamount2 = 0;
    item.taxamount3 = 0;
    item.dppDetails = [];

    let taxSum = 0;
    if (Array.isArray(item.tax)) {
      item.tax.forEach(code => {
        const pajak = masterPajak.find(p => p.code === code);
        if (!pajak) return;
        const dppFactor = parseDppFormula(pajak.dpp_formula);
        const baseForTax = dppFactor * afterDisc;
        const rate = parseNum(pajak.rate_percent) || 0;
        const amt = (baseForTax * rate) / 100;

        if (pajak.order === 1) item.taxamount1 += amt;
        if (pajak.order === 2) item.taxamount2 += amt;
        if (pajak.order === 3) item.taxamount3 += amt;

        taxSum += amt;

        item.dppDetails.push({
          code: pajak.code,
          tax_type: pajak.tax_type,
          base: Number(Number(baseForTax || 0).toFixed(2)),
          rate_percent: rate,
          amount: Number(Number(amt || 0).toFixed(2))
        });
      });
    }

    item.amount = Number((afterDisc + taxSum).toFixed(2));
    item.dpp = Number(Number(afterDisc || 0).toFixed(2));
    newItems[index] = item;
    setItems(newItems);
  };

  const calculateSubtotal = () => items.reduce((total, item) => total + (item.qty * item.price), 0);
  const calculateTotal = () => items.reduce((total, item) => total + (item.amount || 0), 0);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    
    // ✅ Validasi supplier lebih ketat

    console.log(formData.supplier);
    if (!formData.supplier || formData.supplier === '' || formData.supplier === '0') {
      alert('Pilih supplier terlebih dahulu!');
      setSaving(false);
      return;
    }
    
    const raw = Array.isArray(items) ? items : [];
    const filtered = raw.filter(d => 
      d && 
      String(d.kodeItem).trim() !== "" && 
      Number(d.qty) > 0
    );

    if (filtered.length === 0) {
      alert('Tambahkan minimal satu item!');
      setSaving(false);
      return;
    }

    // ✅ Perbaikan format tanggal - gunakan format yang lebih sederhana
    const formatDateForBackend = (dateString) => {
      if (!dateString) return null;
      try {
        // Format: YYYY-MM-DDTHH:MM:SSZ (tanpa milliseconds)
        const date = new Date(dateString + 'T00:00:00Z');
        return date.toISOString().replace('.000Z', 'Z');
      } catch (error) {
        console.error('Error formatting date:', error);
        return null;
      }
    };

    // ✅ Perbaikan struktur data
    const cleanedDetails = filtered.map(d => ({
      KodeItem: String(d.kodeItem).trim(),
      NamaItem: d.namaItem || '',
      Qty: Number(d.qty || 0),
      Unit: d.unit || '',
      Price: Number(d.price || 0),
      DiscPercent: Number(d.discPercent || 0),
      DiscAmountItem: Number(d.discAmountItem || 0),
      DiscAmount: Number(d.discAmount || 0),
      Tax: Array.isArray(d.tax) ? d.tax : [],
      TaxAmount1: Number(d.taxamount1 || 0),
      TaxAmount2: Number(d.taxamount2 || 0),
      TaxAmount3: Number(d.taxamount3 || 0),
      Dpp: Number(d.dpp || 0),
      Amount: Number(d.amount || 0),
      GudangID: Number(d.gudang || formData.gudang || 1) // ✅ Default gudang ID jika kosong
    }));

    const summaryTaxamount1 = cleanedDetails.reduce((s, it) => s + (it.TaxAmount1 || 0), 0);
    const summaryTaxamount2 = cleanedDetails.reduce((s, it) => s + (it.TaxAmount2 || 0), 0);
    const summaryTaxamount3 = cleanedDetails.reduce((s, it) => s + (it.TaxAmount3 || 0), 0);
    const subtotal = cleanedDetails.reduce((s, it) => s + (Number(it.Qty) * Number(it.Price)), 0);
    const totalAmount = cleanedDetails.reduce((s, it) => s + (it.Amount || 0), 0);

    // ✅ Struktur data dengan format yang lebih sederhana
    const purchaseData = {
      nomorapinvoice: formData.nomorapinvoice,
      tanggal: formatDateForBackend(formData.tanggal),           // ✅ Format sederhana
      deliveryDate: formatDateForBackend(formData.deliveryDate), // ✅ Format sederhana  
      supplierId: Number(formData.supplier),                     // ✅ Pastikan number
      gudangId: Number(formData.gudang || 1),                    // ✅ Default 1 jika kosong
      departementId: Number(formData.departement || 1),          // ✅ Default 1 jika kosong
      nomorRefSupplier: formData.nomorRefSupplier || '',
      notes: formData.notes || '',
      subtotal: Number(subtotal.toFixed(2)),
      ppnMasukan: Number(summaryTaxamount1.toFixed(2)),
      freight: Number(formData.freight || 0),
      stamp: Number(formData.stamp || 0),
      total: Number((totalAmount + Number(formData.freight || 0) + Number(formData.stamp || 0)).toFixed(2)),
      taxamount1: Number(summaryTaxamount1.toFixed(2)),
      taxamount2: Number(summaryTaxamount2.toFixed(2)),
      taxamount3: Number(summaryTaxamount3.toFixed(2)),
      status: 'draft',
      Details: cleanedDetails
    };

    console.log('Purchase Data to send:', purchaseData); // ✅ Debug log

    try {
      const url = editMode ? `/pembelian/${editId}` : '/pembelian';
      const method = editMode ? 'put' : 'post';
      const response = await api[method](url, purchaseData);
      
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        alert(editMode ? 'Data berhasil diupdate!' : 'Data berhasil disimpan!');
        
        if (!editMode) {
          // Reset form setelah create berhasil
          setEditMode(false);
          setEditId(null);
          setFormData({
            nomorapinvoice: '',
            tanggal: new Date().toISOString().split('T')[0],
            deliveryDate: '',
            supplier: '',
            gudang: '',
            departement: '',
            nomorRefSupplier: '',
            notes: '',
            freight: 0,
            stamp: 0
          });
          setItems([]);
          setEditingQty({});
          setEditingPrice({});
          setEditingDiscPercent({});
          setEditingDiscAmountItem({});
          generateNomorapinvoice();
        }
        
        fetchListPembelian();
        setShowForm(false);
      } else {
        console.error('Save failed:', response);
        alert('Gagal menyimpan purchase order!');
      }
    } catch (err) {
      console.error('Error saving purchase order:', err);
      console.error('Error details:', err.response?.data);
      alert(`Gagal menyimpan purchase order: ${err.response?.data?.error || err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan semua data?')) {
      setFormData({
        nomorapinvoice: '',
        tanggal: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        supplier: '',
        gudang: '',
        departement: '',
        nomorRefSupplier: '',
        notes: '',
        freight: 0,
        stamp: 0
      });
      setItems([]);
      // ✅ Reset editing states
      setEditingQty({});
      setEditingPrice({});
      setEditingDiscPercent({});
      setEditingDiscAmountItem({});
      generateNomorapinvoice();
    }
  };

  const fetchListPembelian = async () => {
    setLoadingList(true);
    try {
      const response = await api.get('/pembelian');
      setListPembelian(response.data);
    } catch (error) {
      setListPembelian([]);
    }
    setLoadingList(false);
  };

  // ✅ Safe filteredPembelian with useMemo
  const filteredPembelian = React.useMemo(() => {
    if (!Array.isArray(listPembelian)) return [];
    if (!Array.isArray(masterSupplier)) return listPembelian;
    
    return listPembelian.filter(trx => {
      if (!search) return true;
      
      const searchLower = search.toLowerCase();
      const supplierName = masterSupplier.find(p => 
        p && String(p.id) === String(trx.supplierId)
      )?.nama || '';
      
      return (
        (trx.nomorapinvoice && trx.nomorapinvoice.toLowerCase().includes(searchLower)) ||
        (trx.total && trx.total.toString().includes(search)) ||
        (trx.status && trx.status.toLowerCase().includes(searchLower)) ||
        supplierName.toLowerCase().includes(searchLower)
      );
    });
  }, [listPembelian, masterSupplier, search]);

  // ✅ Improved loading check
  if (loadingSupplier || !Array.isArray(masterSupplier)) {
    return (
      <div className="p-6 min-h-screen flex items-center justify-center" style={{ background: theme.backgroundColor }}>
        <div style={{ color: theme.fontColor }}>Loading master data...</div>
      </div>
    );
  }

  const handleEdit = async (trx) => {
    try {
      // ✅ Reset form terlebih dahulu
      setFormData({
        nomorapinvoice: '',
        tanggal: new Date().toISOString().split('T')[0],
        deliveryDate: '',
        supplier: '',
        gudang: '',
        departement: '',
        nomorRefSupplier: '',
        notes: '',
        freight: 0,
        stamp: 0
      });
      setItems([]);
      
      // ✅ Reset editing states
      setEditingQty({});
      setEditingPrice({});
      setEditingDiscPercent({});
      setEditingDiscAmountItem({});
      
      const response = await api.get(`/pembelian/${trx.id}`);
      const data = response.data.data || response.data;
      
      const formatDateFromBackend = (isoString) => {
        if (!isoString) return '';
        try {
          const date = new Date(isoString);
          return date.toISOString().split('T')[0];
        } catch (error) {
          console.error('Error formatting date from backend:', error);
          return '';
        }
      };
      
      // ✅ Set form data dengan delay untuk memastikan reset selesai
      setTimeout(() => {
        setFormData({
          nomorapinvoice: data.nomorapinvoice || '',
          tanggal: formatDateFromBackend(data.tanggal),
          deliveryDate: formatDateFromBackend(data.deliveryDate),
          supplier: String(data.supplierId || ''),
          gudang: String(data.gudangId || ''),
          departement: String(data.departementId || ''),
          nomorRefSupplier: data.nomorRefSupplier || '',
          notes: data.notes || '',
          freight: Number(data.freight || 0),
          stamp: Number(data.stamp || 0)
        });
        
        // ✅ Set items dengan format yang benar
        const details = Array.isArray(data.details) ? data.details : [];
        console.log(details);
        setItems(details.map(detail => ({
          id: detail.ID || Date.now() + Math.random(),
          kodeItem: detail.KodeItem || '',
          namaItem: detail.NamaItem || '',
          qty: Number(detail.qty || 0),
          unit: detail.unit || '',
          price: Number(detail.price || 0),
          discPercent: Number(detail.discPercent || 0),
          discAmountItem: Number(detail.discAmountItem || 0),
          discAmount: Number(detail.discAmount || 0),
          tax: Array.isArray(detail.tax) ? detail.tax : [],
          taxamount1: Number(detail.taxamount1 || 0),
          taxamount2: Number(detail.taxamount2 || 0),
          taxamount3: Number(detail.taxamount3 || 0),
          dpp: Number(detail.dpp || 0),
          amount: Number(detail.amount || 0),
          gudang: String(detail.gudangId || '')
        })));
        
        setEditMode(true);
        setEditId(trx.id);
        setShowForm(true);
      }, 100); // ✅ Delay 100ms untuk memastikan reset selesai
      
    } catch (error) {
      console.error('Error loading data for edit:', error);
      alert('Gagal memuat data untuk edit!');
    }
  };

  const handleDeleteTransaksi = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await api.delete(`/pembelian/${id}`);
        alert('Transaksi berhasil dihapus!');
        fetchListPembelian();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Gagal menghapus transaksi!');
      }
    }
  };

  return (
    <div className="p-6 min-h-screen" style={{ background: theme.backgroundColor, color: theme.fontColor, fontFamily: theme.fontFamily }}>
      <h1 className="text-2xl font-bold mb-6">Pembelian - AP Invoice</h1>
      
      <Card className="p-8 rounded-xl shadow-lg mb-8" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.cardBorderColor }}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {editMode ? "Edit Data" : "Input Data"}
          </h2>
          <Button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditMode(false);
                setEditId(null);
                setFormData({
                  nomorapinvoice: '',
                  tanggal: new Date().toISOString().split('T')[0],
                  deliveryDate: '',
                  supplier: '',
                  gudang: '',
                  departement: '',
                  nomorRefSupplier: '',
                  notes: '',
                  freight: 0,
                  stamp: 0
                });
                setItems([]);
                generateNomorapinvoice();
              } else {
                setShowForm(true);
              }
            }}
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

        {showForm && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div>
                <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Supplier
                </label>
                <select
                  name="supplier"                    // ✅ Pastikan name benar
                  value={formData.supplier}          // ✅ Pastikan value binding
                  onChange={handleInputChange}       // ✅ Pastikan onChange handler
                  className="w-full px-3 py-2 border rounded"
                  style={{ ...inputStyle(theme) }}
                >
                  <option value="">Pilih Supplier</option>
                  {masterSupplier.map(p => (
                    <option key={p.id} value={String(p.ID)}>{p.nama}</option>
                  ))}
                </select>
                {/* ✅ Debug display */}
                <small style={{ color: 'red', fontSize: '10px' }}>
                  Current value: {formData.supplier || 'undefined'}
                </small>
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>AP No.</label>
                <Input name="nomorapinvoice" value={formData.nomorapinvoice} readOnly style={{ ...inputStyle(theme) }} />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Tanggal</label>
                <Input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
              </div>
              <div>
                <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Delivery Date</label>
                <Input type="date" name="deliveryDate" value={formData.deliveryDate} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Gudang</label>
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
                <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Departement</label>
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

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
                  Detail Barang/Jasa
                </h3>
                <Button onClick={() => setShowModal(true)} style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily, border: `2px solid ${theme.buttonSimpan}` }}>
                  + Tambah Item
                </Button>
              </div>

              <div className="overflow-x-auto max-w-full rounded-lg border min-w-max" style={{ borderColor: theme.cardBorderColor }}>
                <table className="w-full border-collapse whitespace-nowrap text-xs" style={{ fontFamily: theme.tableFontFamily }}>
                  <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                    <tr>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.kodeItem }}>Kode Item
                        <div onMouseDown={e => startResize('kodeItem', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.namaItem }}>Nama Item
                        <div onMouseDown={e => startResize('namaItem', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.qty }}>Qty
                        <div onMouseDown={e => startResize('qty', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.unit }}>Item Unit
                        <div onMouseDown={e => startResize('unit', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.price }}>Price
                        <div onMouseDown={e => startResize('price', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 60 }}>Discount %</th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 120 }}>Discount Amount Item</th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 120 }}>Discount Amount
                         <div onMouseDown={e => startResize('discAmount', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.tax }}>Pajak
                        <div onMouseDown={e => startResize('tax', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 100 }}>Gudang</th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: 90 }}>Tax Amount 1</th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: 90 }}>Tax Amount 2</th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: 90 }}>Tax Amount 3</th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: columnWidths.dpp }}>
                        DPP
                        <div onMouseDown={e => startResize('dpp', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: columnWidths.total }}>
                        Total
                        <div onMouseDown={e => startResize('total', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.aksi }}>Action
                        <div onMouseDown={e => startResize('aksi', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor, color: theme.tableFontColor }}>
                        <td className="border px-2 py-1" style={{ width: columnWidths.kodeItem }}>
                          <select
                            value={item.kodeItem || ''}
                            onChange={e => {
                              const selected = masterBarangJasa.find(m => m.kode === e.target.value);
                              handleItemChange(idx, 'kodeItem', e.target.value);
                              if (selected) {
                                handleItemChange(idx, 'namaItem', selected.nama);
                                handleItemChange(idx, 'unit', selected.satuan);
                                handleItemChange(idx, 'price', selected.hargaBeli || 0);
                              }
                            }}
                            className="w-full"
                            style={inputStyle(theme)}
                          >
                            <option value="">Pilih Kode</option>
                            {masterBarangJasa.map(m => <option key={m.id} value={m.kode}>{m.kode}</option>)}
                          </select>
                        </td>

                        <td className="border px-2 py-1" style={{ width: columnWidths.namaItem }}>
                          <input
                            type="text"
                            value={item.namaItem || ''}
                            onChange={e => handleItemChange(idx, 'namaItem', e.target.value)}
                            className="w-full text-xs border rounded px-2 py-1"
                            style={inputStyle(theme)}
                          />
                        </td>

                        <td className="border px-2 py-1" style={{ width: columnWidths.qty }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              editingQty[item.id] !== undefined
                                ? editingQty[item.id]
                                : (item.qty === "" || item.qty === 0) ? "" : Number(item.qty).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                            onFocus={() => {
                              if (editingQty[item.id] === undefined) setEditingQty(prev => ({ ...prev, [item.id]: item.qty === 0 ? "" : String(item.qty) }));
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9.,]/g, "");
                              val = val.replace(/,/g, ".");
                              setEditingQty(prev => ({ ...prev, [item.id]: val }));
                            }}
                            onBlur={() => {
                              const raw = editingQty[item.id] !== undefined ? editingQty[item.id] : String(item.qty || "");
                              const num = raw === "" ? 0 : parseFloat(String(raw).replace(/,/g, "."));
                              handleItemChange(idx, 'qty', Number(Number(num || 0).toFixed(2)));
                              setEditingQty(prev => { const c = { ...prev }; delete c[item.id]; return c; });
                            }}
                            className="w-full text-xs border rounded text-right px-2 py-1"
                            style={inputStyle(theme)}
                            autoComplete="off"
                          />
                        </td>

                        <td className="border px-2 py-1" style={{ width: columnWidths.unit }}>
                          <input
                            type="text"
                            value={item.unit || ''}
                            onChange={e => handleItemChange(idx, 'unit', e.target.value)}
                            className="w-full text-xs border rounded px-2 py-1"
                            style={inputStyle(theme)}
                          />
                        </td>

                        <td className="border px-2 py-1" style={{ width: columnWidths.price }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              editingPrice[item.id] !== undefined
                                ? editingPrice[item.id]
                                : (item.price === "" || item.price === 0) ? "" : Number(item.price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                            onFocus={() => {
                              if (editingPrice[item.id] === undefined) setEditingPrice(prev => ({ ...prev, [item.id]: item.price === 0 ? "" : String(item.price) }));
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9.,]/g, "");
                              val = val.replace(/,/g, ".");
                              setEditingPrice(prev => ({ ...prev, [item.id]: val }));
                            }}
                            onBlur={() => {
                              const raw = editingPrice[item.id] !== undefined ? editingPrice[item.id] : String(item.price || "");
                              const num = raw === "" ? 0 : parseFloat(String(raw).replace(/,/g, "."));
                              handleItemChange(idx, 'price', Number(Number(num || 0).toFixed(2)));
                              setEditingPrice(prev => { const c = { ...prev }; delete c[item.id]; return c; });
                            }}
                            className="w-full text-xs border rounded text-right px-2 py-1"
                            style={inputStyle(theme)}
                          />
                        </td>

                        <td className="border px-2 py-1" style={{ width: 60 }}>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              editingDiscPercent[item.id] !== undefined
                                ? editingDiscPercent[item.id]
                                : (item.discPercent === "" ? "" : String(item.discPercent))
                            }
                            onFocus={() => {
                              if (editingDiscPercent[item.id] === undefined) {
                                setEditingDiscPercent(prev => ({ ...prev, [item.id]: item.discPercent === 0 ? "" : String(item.discPercent) }));
                              }
                            }}
                            onChange={e => {
                              const val = e.target.value.replace(/[^0-9.]/g, "");
                              setEditingDiscPercent(prev => ({ ...prev, [item.id]: val }));
                            }}
                            onBlur={() => {
                              const raw = editingDiscPercent[item.id] !== undefined ? editingDiscPercent[item.id] : String(item.discPercent || "");
                              const num = raw === "" ? "" : parseFloat(String(raw).replace(/,/g, "."));
                              handleItemChange(idx, 'discPercent', num);
                              setEditingDiscPercent(prev => { const c = { ...prev }; delete c[item.id]; return c; });
                            }}
                            className="w-full text-xs border rounded text-right px-2 py-1"
                            style={inputStyle(theme)}
                            min="0"
                            max="100"
                          />
                        </td>

                        <td className="border px-2 py-1" style={{ width: 120 }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={
                              editingDiscAmountItem[item.id] !== undefined
                                ? editingDiscAmountItem[item.id]
                                : (item.discAmountItem === "" || item.discAmountItem === 0) ? "" : Number(item.discAmountItem).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            }
                            onFocus={() => {
                              if (editingDiscAmountItem[item.id] === undefined) {
                                setEditingDiscAmountItem(prev => ({ ...prev, [item.id]: item.discAmountItem === 0 ? "" : String(item.discAmountItem) }));
                              }
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9.,]/g, "");
                              val = val.replace(/,/g, ".");
                              setEditingDiscAmountItem(prev => ({ ...prev, [item.id]: val }));
                            }}
                            onBlur={() => {
                              const raw = editingDiscAmountItem[item.id] !== undefined ? editingDiscAmountItem[item.id] : String(item.discAmountItem || "");
                              const num = raw === "" ? "" : parseFloat(String(raw).replace(/,/g, "."));
                              handleItemChange(idx, 'discAmountItem', num);
                              setEditingDiscAmountItem(prev => { const c = { ...prev }; delete c[item.id]; return c; });
                            }}
                            className="w-full text-xs border rounded text-right px-2 py-1"
                            style={inputStyle(theme)}
                          />
                        </td>

                        <td className="border px-2 py-1 text-right" style={{ width: columnWidths.discAmount }}>
                          { (Number(item.discAmount || 0)).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>
                        
                        <td className="border px-2 py-1" style={{ width: columnWidths.tax }}>
                          <Select
                            isMulti
                            isClearable={false}
                            options={masterPajak.map(p => ({ value: p.code, label: p.code }))}
                            value={Array.isArray(item.tax) ? item.tax.map(code => ({ value: code, label: code })) : []}
                            onChange={selected => {
                              const vals = Array.isArray(selected) ? selected.map(s => s.value) : [];
                              handleItemChange(idx, 'tax', vals);
                            }}
                            menuPortalTarget={document.body}
                            styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            placeholder="Kode Pajak"
                          />
                        </td>

                        <td className="border px-2 py-1" style={{ width: 100 }}>
                          <select
                            value={item.gudang || ''}
                            onChange={e => handleItemChange(idx, 'gudang', e.target.value)}
                            className="w-full"
                            style={inputStyle(theme)}
                          >
                            <option value="">Pilih Gudang</option>
                            {masterGudang.map(g => <option key={g.id} value={g.id}>{g.nama}</option>)}
                          </select>
                        </td>

                        <td className="border px-2 py-1 text-right" style={{ width: 90 }}>
                          { (item.taxamount1 || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>
                        <td className="border px-2 py-1 text-right" style={{ width: 90 }}>
                          { (item.taxamount2 || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>
                        <td className="border px-2 py-1 text-right" style={{ width: 90 }}>
                          { (item.taxamount3 || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>
                        
                        <td className="border px-2 py-1 text-right" style={{ width: columnWidths.dpp }}>
                          { (item.dpp || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>

                        <td className="border px-2 py-1 text-right" style={{ width: columnWidths.total }}>
                          { (item.amount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>

                        <td className="border px-2 py-1 text-center" style={{ width: columnWidths.aksi }}>
                          <button 
                            onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} 
                            className="px-2 py-1 rounded" 
                            style={{ background: theme.buttonHapus, color: '#fff' }}
                          >
                            X
                          </button>
                        </td>
                      </tr>
                     ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Popup Tambah Item */}
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="rounded-lg shadow-lg p-6 min-w-[340px] max-w-[90vw] w-full" style={{background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, border: `1px solid ${theme.cardBorderColor}`}}>
                  <h2 className="text-base font-bold mb-4" style={{color: theme.fontColor}}>Pilih Item</h2>
                  <div className="mb-2 flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Filter kode/deskripsi..."
                      value={modalFilter}
                      onChange={e => setModalFilter(e.target.value)}
                      className="px-2 py-1 rounded border text-sm"
                      style={{background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.dropdownColor, minWidth: 180}}
                    />
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{color: theme.fontColor}}>Gudang:</span>
                      <select
                        value={formData.gudang}
                        onChange={e => setFormData(prev => ({...prev, gudang: e.target.value}))}
                        className="px-2 py-1 rounded border text-sm"
                        style={{background: theme.fieldColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.dropdownColor, minWidth: 120}}
                      >
                        <option value="">Pilih Gudang</option>
                        {masterGudang.map(g => (
                          <option key={g.id} value={g.id}>{g.nama}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto mb-4">
                    <table className="min-w-max w-full border-collapse text-xs" style={{fontFamily: theme.tableFontFamily}}>
                      <thead style={{background: theme.tableHeaderColor, color: theme.tableFontColor}}>
                        <tr>
                          <th className="px-1 py-1 text-center font-bold border" style={{borderColor: theme.cardBorderColor, fontSize: '0.95em'}}>#</th>
                          <th className="px-1 py-1 text-center font-bold border" style={{borderColor: theme.cardBorderColor, fontSize: '0.95em'}}>Kode Item</th>
                          <th className="px-1 py-1 text-center font-bold border" style={{borderColor: theme.cardBorderColor, fontSize: '0.95em'}}>Deskripsi</th>
                          <th className="px-1 py-1 text-center font-bold border" style={{borderColor: theme.cardBorderColor, fontSize: '0.95em'}}>Gudang</th>
                          <th className="px-1 py-1 text-center font-bold border" style={{borderColor: theme.cardBorderColor, fontSize: '0.95em'}}>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masterBarangJasa.filter(item =>
                          item.kode?.toLowerCase().includes(modalFilter.toLowerCase()) ||
                          item.nama?.toLowerCase().includes(modalFilter.toLowerCase())
                        ).map((item, idx) => (
                          <tr key={item.id} style={{background: idx % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor, color: theme.tableFontColor}}>
                            <td className="px-1 py-1 text-center border" style={{borderColor: theme.cardBorderColor}}>
                              <input 
                                type="checkbox" 
                                checked={selectedModalItems.includes(item.id)} 
                                onChange={e => {
                                  setSelectedModalItems(e.target.checked
                                    ? [...selectedModalItems, item.id]
                                    : selectedModalItems.filter(id => id !== item.id));
                                }} 
                              />
                            </td>
                            <td className="px-1 py-1 text-center border" style={{borderColor: theme.cardBorderColor}}>{item.kode}</td>
                            <td className="px-1 py-1 border" style={{borderColor: theme.cardBorderColor}}>{item.nama}</td>
                            <td className="px-1 py-1 text-center border" style={{borderColor: theme.cardBorderColor}}>{masterGudang.find(g => String(g.id) === String(formData.gudang))?.nama || '-'}</td>
                            <td className="px-1 py-1 text-center border" style={{borderColor: theme.cardBorderColor}}>{item.stock || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button onClick={() => setShowModal(false)} style={{background: theme.buttonHapus, color: '#fff'}}>Batal</Button>
                    <Button onClick={() => {
                      const selectedItems = masterBarangJasa.filter(item => selectedModalItems.includes(item.id));
                      const newDetailItems = selectedItems.map((item, idx) => ({
                        id: Date.now() + Math.random() + idx,
                        kodeItem: item.kode,
                        namaItem: item.nama,
                        qty: 0,
                        unit: item.satuan || '',
                        price: item.hargaBeli || 0,
                        discPercent: 0,
                        discAmountItem: 0,
                        discAmount: 0,
                        tax: [],
                        taxamount1: 0,
                        taxamount2: 0, 
                        taxamount3: 0,
                        dpp: 0,
                        amount: 0,
                        gudang: formData.gudang
                      }));
                      setItems(prev => [...prev, ...newDetailItems]);
                      setShowModal(false);
                      setSelectedModalItems([]);
                      setModalFilter("");
                    }} style={{background: theme.buttonSimpan, color: '#fff'}}>Add</Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Nomor Ref Supplier</label>
                  <Input name="nomorRefSupplier" value={formData.nomorRefSupplier} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
                </div>
                <div>
                  <label className="block font-semibold mb-1" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>Notes</label>
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
              
              <div>
                <div className="rounded-lg p-6 mb-4" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, border: `1px solid ${theme.cardBorderColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex justify-between items-center mb-2">
                    <span>Sub Total:</span>
                    <span className="font-semibold">Rp {calculateSubtotal().toLocaleString('id-ID')}</span>
                  </div>
                  {(() => {
                    const totalTax1 = items.reduce((sum, item) => sum + (item.taxamount1 || 0), 0);
                    const pajak1 = masterPajak.find(p => p.order === 1);
                    return (
                      <>
                        {totalTax1 !== 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span>{pajak1 ? `${pajak1.tax_name} Masukan` : 'PPN Masukan'}:</span>
                            <span className="font-semibold">Rp {totalTax1.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
               
                  <div className="flex justify-between items-center mb-2">
                    <span>Freight:</span>
                    <Input type="number" name="freight" value={formData.freight || 0} onChange={handleInputChange} style={{ ...inputStyle(theme), width: 80, textAlign: "right" }} />
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span>Stamp:</span>
                    <Input type="number" name="stamp" value={formData.stamp || 0} onChange={handleInputChange} style={{ ...inputStyle(theme), width: 80, textAlign: "right" }} />
                  </div>
                  <div className="flex justify-between items-center font-bold text-lg mt-4">
                    <span>Total apinvoice:</span>
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
                    Kosongkan Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-8 rounded-xl shadow-lg" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.cardBorderColor }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
          Daftar Transaksi Pembelian
        </h2>

        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by apinvoice No, Supplier, or Total"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={inputStyle(theme)}
              />
            </div>
            <div>
              <Button
                onClick={() => setSearch('')}
                style={{ background: theme.buttonHapus, color: '#fff', fontFamily: theme.fontFamily, border: `2px solid ${theme.buttonHapus}` }}
              >
                Reset Filter
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: theme.cardBorderColor }}>
          <table className="min-w-full border-collapse text-xs" style={{ fontFamily: theme.tableFontFamily }}>
            <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
              <tr>
                <th className="border px-2 py-1 text-left">No.</th>
                <th className="border px-2 py-1 text-left">apinvoice No.</th>
                <th className="border px-2 py-1 text-left">Tanggal</th>
                <th className="border px-2 py-1 text-left">Supplier</th>
                <th className="border px-2 py-1 text-right">Total</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPembelian.map((trx, index) => (
                <tr key={trx.id} style={{ background: index % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor, color: theme.tableFontColor }}>
                  <td className="border px-2 py-1 text-center">{index + 1}</td>
                  <td className="border px-2 py-1">{trx.nomorapinvoice}</td>
                  <td className="border px-2 py-1">{trx.tanggal ? new Date(trx.tanggal).toLocaleDateString('id-ID') : ''}</td>
                  <td className="border px-2 py-1">
                    {masterSupplier.find(p => String(p.id) === String(trx.supplierId))?.nama || '-'}  {/* ✅ Ganti dari p.ID ke p.id */}
                  </td>
                  <td className="border px-2 py-1 text-right">Rp {trx.total?.toLocaleString('id-ID')}</td>
                  <td className="border px-2 py-1">
                    <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">{trx.status}</span>
                  </td>
                  <td className="border px-2 py-1 flex gap-2">
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

function inputStyle(theme) {
  return {
    background: theme.fieldColor,
    color: theme.fontColor,
    fontFamily: theme.fontFamily,
    borderColor: theme.dropdownColor,
  };
}