import React, { useEffect, useState } from 'react';
import { Fragment } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { useTheme } from '../../context/ThemeContext';
import api from "../../utils/api";
import Select from 'react-select';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';

export default function Penjualan() {
  const { theme } = useTheme();
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

  // Tambahkan state master
  const [masterPembeli, setMasterPembeli] = useState([]);
  const [masterGudang, setMasterGudang] = useState([]);
  const [masterDepartement, setMasterDepartement] = useState([]);
  const [masterPajak, setMasterPajak] = useState([]);

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

  const [items, setItems] = useState([]);

  const [masterBarangJasa, setMasterBarangJasa] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [listPenjualan, setListPenjualan] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedModalItems, setSelectedModalItems] = useState([]);
  const [modalFilter, setModalFilter] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMasterBarangJasa();
    fetchMasterPembeli();
    fetchMasterGudang();
    fetchMasterDepartement();
    fetchMasterPajak(); // Tambahkan ini
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
      const response = await api.get('/master-gudang');
      setMasterGudang(response.data);
    } catch (error) { }
  };

  // Fetch master departement
  const fetchMasterDepartement = async () => {
    try {
      const response = await api.get('/master-departement');
      setMasterDepartement(response.data);
    } catch (error) { }
  };

  // Fetch master barang/jasa
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
  // clone item
  const item = { ...(newItems[index] || {}) };
  // simpan raw value
  item[field] = value;

  // parse numeric fields safely (toleran terhadap string dengan koma)
  const parseNum = v => {
    if (v === "" || v === null || v === undefined) return 0;
    const s = String(v).trim().replace(/,/g, '.');
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  };

  const qty = parseNum(item.qty);
  const price = parseNum(item.price);
  // treat stored discPercent / discAmountItem as numbers or empty string
  let discPercent = item.discPercent === "" ? 0 : parseNum(item.discPercent);
  let discAmountItem = item.discAmountItem === "" ? 0 : parseNum(item.discAmountItem);

  // jika user mengubah discPercent => hitung discAmountItem (per unit)
  if (field === 'discPercent') {
    if (price > 0 && discPercent > 0) {
      discAmountItem = (price * discPercent) / 100;
    } else {
      discAmountItem = 0;
    }
  }

  // jika user mengubah discAmountItem => hitung discPercent (per unit)
  if (field === 'discAmountItem') {
    if (price > 0 && discAmountItem > 0) {
      discPercent = (discAmountItem / price) * 100;
    } else {
      discPercent = 0;
    }
  }

  // total discount amount (for line) = per-unit discount * qty
  const discAmount = discAmountItem * qty;
  const subtotal = qty * price;
  const afterDisc = subtotal - discAmount;

  // assign back (normalisasi ke number / empty-string as appropriate)
  item.discPercent = discPercent;
  item.discAmountItem = Number(Number(discAmountItem || 0).toFixed(2));
  item.discAmount = Number(Number(discAmount || 0).toFixed(2));

  // reset tax amounts then compute using masterPajak + parseDppFormula
  item.taxamount1 = 0;
  item.taxamount2 = 0;
  item.taxamount3 = 0;
  item.dppDetails = [];

  // hitung tiap pajak dengan tanda sesuai jenis (PPN = positive, PPH/PPH Final = negative untuk total)
  let taxSum = 0;
  if (Array.isArray(item.tax)) {
    item.tax.forEach(code => {
      const pajak = masterPajak.find(p => p.code === code);
      if (!pajak) return;
      const dppFactor = parseDppFormula(pajak.dpp_formula);
      const baseForTax = dppFactor * afterDisc;
      const rate = parseNum(pajak.rate_percent) || 0;
      const amt = (baseForTax * rate) / 100;
      const isPph = String(pajak.tax_type || '').toLowerCase().includes('pph');

      // Simpan taxamount sebagai nilai positif untuk tampilan
      if (pajak.order === 1) item.taxamount1 += amt;
      if (pajak.order === 2) item.taxamount2 += amt;
      if (pajak.order === 3) item.taxamount3 += amt;

      // Namun kontribusi terhadap total line berkurang kalau ini PPH
      taxSum += isPph ? -amt : amt;

      item.dppDetails.push({
        code: pajak.code,
        tax_type: pajak.tax_type,
        base: Number(Number(baseForTax || 0).toFixed(2)),
        rate_percent: rate,
        amount: Number(Number(amt || 0).toFixed(2)) // simpan positif
      });
    });
  }

  // amount = after discount + total signed taxes (PPH mengurangi amount)
  item.amount = Number((afterDisc + taxSum).toFixed(2));
  item.dpp = Number(Number(afterDisc || 0).toFixed(2));
  // write back and update state
  newItems[index] = item;
  setItems(newItems);
};

  // Tambahkan item baru dengan id unik
  const addNewItem = () => {
    setItems([...items, {
      id: Date.now() + Math.random(),
      kodeItem: '',
      namaItem: '',
      qty: 0,
      unit: '',
      price: "",           // <-- harus string kosong
      discPercent: "",     // <-- harus string kosong
      discAmountItem: "",  // <-- harus string kosong
      discAmount: 0,
      tax: [],
      taxamount1: 0,
      taxamount2: 0,
      taxamount3: 0,
      dpp: 0,
      amount: 0,
      gudang: ''
    }]);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => items.reduce((total, item) => total + (item.qty * item.price), 0);
  items.reduce((total, item) => {
    const subtotal = item.qty * item.price;
    const discAmountItem = item.discAmountItem || 0;
    const discAmount = (subtotal * item.discPercent) / 100 + discAmountItem;
    const afterDisc = subtotal - discAmount;
    //const taxAmount = (afterDisc * item.tax) / 100;
    return total ;
  }, 0);
  const calculateTotal = () => items.reduce((total, item) => total + (item.amount || 0), 0);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    
    // ✅ SIMPEL: Filter item valid tanpa deduplikasi
    const raw = Array.isArray(items) ? items : [];
    const filtered = raw.filter(d => 
      d && 
      String(d.kodeItem).trim() !== "" && 
      Number(d.qty) > 0
    );

    // ✅ LANGSUNG MAP KE FORMAT BACKEND TANPA DEDUPE
    const cleanedDetails = filtered.map(d => ({
      kodeItem: String(d.kodeItem).trim(),
      namaItem: d.namaItem || '',
      qty: Number(d.qty || 0),
      unit: d.unit || '',
      price: Number(d.price || 0),
      discPercent: Number(d.discPercent || 0),
      discAmountItem: Number(d.discAmountItem || 0),
      discAmount: Number(d.discAmount || 0),
      tax: Array.isArray(d.tax) ? d.tax.map(String) : [],
      taxamount1: Number(d.taxamount1 || 0),
      taxamount2: Number(d.taxamount2 || 0),
      taxamount3: Number(d.taxamount3 || 0),
      dpp: Number(d.dpp || 0),
      amount: Number(d.amount || 0),
      gudang: String(d.gudang || '')
    }));

    // compute summary taxes dari semua details (tanpa dedupe)
    const summaryTaxamount1 = cleanedDetails.reduce((s, it) => s + (it.taxamount1 || 0), 0);
    const summaryTaxamount2 = cleanedDetails.reduce((s, it) => s + (it.taxamount2 || 0), 0);
    const summaryTaxamount3 = cleanedDetails.reduce((s, it) => s + (it.taxamount3 || 0), 0);

    const invoiceData = {
      nomorInvoice: formData.nomorInvoice,
      tanggal: formData.tanggal,
      dueDate: formData.dueDate,
      customerId: formData.customer ? Number(formData.customer) : null,
      gudangId: Number(formData.gudang || 0),
      departementId: Number(formData.departement || 0),
      nomorEfaktur: formData.nomorEfaktur,
      notes: formData.notes,
      subtotal: calculateSubtotal(),
      ppn: 0,
      freight: parseFloat(formData.freight) || 0,
      stamp: parseFloat(formData.stamp) || 0,
      total: cleanedDetails.reduce((s, it) => s + (it.amount || 0), 0) + 
             (parseFloat(formData.freight) || 0) + 
             (parseFloat(formData.stamp) || 0),
      taxamount1: summaryTaxamount1,
      taxamount2: summaryTaxamount2,
      taxamount3: summaryTaxamount3,
      status: 'draft',
      details: cleanedDetails // ✅ Kirim semua item tanpa dedupe
    };

    try {
      const url = editMode ? `/penjualan/${editId}` : '/penjualan';
      const method = editMode ? 'put' : 'post';
      const response = await api[method](url, invoiceData);
      
      if (response.status === 200 || response.status === 201 || response.data?.success) {
        alert(editMode ? 'Data berhasil diupdate!' : 'Data berhasil disimpan!');
        
        // ✅ REFRESH UI DENGAN DATA DARI BACKEND
        if (editMode && response.data?.data) {
          const freshData = response.data.data;
          const freshDetails = Array.isArray(freshData.Details) ? freshData.Details : [];
          
          console.log('Refreshing UI with fresh data:', freshDetails.length, 'items');
          setItems(freshDetails.map(detail => ({
            id: detail.ID || Date.now() + Math.random(),
            kodeItem: detail.KodeItem || '',
            namaItem: detail.NamaItem || '',
            qty: Number(detail.Qty || 0),
            unit: detail.Unit || '',
            price: Number(detail.Price || 0),
            discPercent: Number(detail.DiscPercent || 0),
            discAmountItem: Number(detail.DiscAmountItem || 0),
            discAmount: Number(detail.DiscAmount || 0),
            tax: Array.isArray(detail.Tax) ? detail.Tax : [],
            taxamount1: Number(detail.TaxAmount1 || 0),
            taxamount2: Number(detail.TaxAmount2 || 0),
            taxamount3: Number(detail.TaxAmount3 || 0),
            dpp: Number(detail.Dpp || 0),
            amount: Number(detail.Amount || 0),
            gudang: String(detail.GudangID || formData.gudang || '')
          })));
        } else {
          // Reset form untuk mode create
          setEditMode(false);
          setEditId(null);
          setFormData({
            nomorInvoice: '',
            tanggal: new Date().toISOString().split('T')[0],
            dueDate: '',
            customer: '',
            gudang: '',
            termPembayaran: '',
            departement: '',
            nomorEfaktur: '',
            notes: '',
            freight: 0,
            stamp: 0
          });
          setItems([]);
          generateNomorInvoice();
        }
        
        fetchListPenjualan();
      } else {
        console.error('save failed', response);
        alert('Gagal menyimpan invoice!');
      }
    } catch (err) {
      console.error('Error saving invoice:', err);
      alert('Gagal menyimpan invoice!');
    } finally {
      setSaving(false);
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
    setItems(trx.details?.map((item) => ({
      id: item.id, // gunakan id dari backend jika ada, jika tidak buat baru
      kodeItem: item.kodeItem,
      namaItem: item.namaItem,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      discPercent: item.discPercent,
      discAmountItem: item.discAmountItem,
      discAmount: item.discAmount,
      tax: item.tax,
      taxamount1: item.taxamount1,
      taxamount2: item.taxamount2,
      taxamount3: item.taxamount3,
      dpp: item.dpp,
      amount: item.amount,
      gudang: String(item.gudangId || item.gudang)
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

  const columns = [
      {
    accessorKey: 'id',
    header: 'ID',
    cell: info => (
      <span className="text-xs">{info.row.original.id}</span>
    ),
    size: 80,
  },
    {
      accessorKey: 'kodeItem',
      header: 'Kode Item',
      cell: info => (
        <select
          value={info.row.original.kodeItem}
          onChange={e => {
            const selected = masterBarangJasa.find(m => m.kode === e.target.value);
            handleItemChange(info.row.index, 'kodeItem', e.target.value);
            handleItemChange(info.row.index, 'namaItem', selected ? selected.nama : '');
            handleItemChange(info.row.index, 'unit', selected ? selected.satuan : '');
            handleItemChange(info.row.index, 'price', selected ? selected.hargaJual : 0);
          }}
          className="w-full"
          style={{
            background: theme.fieldColor,
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
            border: `1px solid ${theme.dropdownColor}`,
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 12,
            height: 24,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => Object.assign(e.target.style, elegantInputFocus)}
          onBlur={e => Object.assign(e.target.style, { borderColor: theme.cardBorderColor })}
        >
          <option value="" style={{ background: theme.fieldColor, color: theme.fontColor }}>Pilih Kode</option>
          {masterBarangJasa.map(item => (
            <option key={item.id} value={item.kode} style={{ background: theme.fieldColor, color: theme.fontColor }}>
              {item.kode}
            </option>
          ))}
        </select>
      ),
      size: columnWidths.kodeItem,
    },
    {
      accessorKey: 'namaItem',
      header: 'Nama Item',
      cell: info => (
        <input
          type="text"
          value={info.row.original.namaItem}
          onChange={e => handleItemChange(info.row.index, 'namaItem', e.target.value)}
          className="w-full"
          style={elegantInputStyle}
          onFocus={e => Object.assign(e.target.style, elegantInputFocus)}
          onBlur={e => Object.assign(e.target.style, { borderColor: theme.cardBorderColor })}
        />
      ),
      size: columnWidths.namaItem,
    },
{
  accessorKey: 'qty',
  header: 'Qty',
  cell: info => {
    const row = info.row.original;
    return (
      <input
        type="text"
        name="qty"
        value={
          editingQty[row.id] !== undefined
            ? editingQty[row.id]
            : (row.qty === "" || row.qty === 0)
              ? ""
              : Number(row.qty).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }
        onChange={e => {
          // accept digits + decimal separator (comma or dot), normalize to dot for storage
          let val = e.target.value.replace(/[^0-9.,]/g, "");
          val = val.replace(/,/g, ".");
          setEditingQty(prev => ({ ...prev, [row.id]: val }));
        }}
        onBlur={() => {
          const raw = editingQty[row.id] !== undefined ? editingQty[row.id] : String(row.qty || "");
          const num = raw === "" ? 0 : parseFloat(raw.replace(/,/g, "."));
          // store as number with 2 decimals
          handleItemChange(info.row.index, 'qty', Number(Number(num || 0).toFixed(2)));
          setEditingQty(prev => {
            const newState = { ...prev };
            delete newState[row.id];
            return newState;
          });
        }}
        className="w-full text-xs border rounded text-right"
        style={inputStyle(theme)}
        inputMode="decimal"
        autoComplete="off"
      />
    );
  },
  size: columnWidths.qty,
},
    {
      accessorKey: 'unit',
      header: 'Item Unit',
      cell: info => (
        <input
          type="text"
          value={info.row.original.unit}
          onChange={e => handleItemChange(info.row.index, 'unit', e.target.value)}
          className="w-full text-xs border rounded"
          style={inputStyle(theme)}
        />
      ),
      size: columnWidths.unit,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => {
        const row = info.row.original;
        return (
          <input
            type="text"
            inputMode="decimal"
            value={
              editingPrice[row.id] !== undefined
                ? editingPrice[row.id]
                : (item.price === "" || item.price === 0) ? "" : Number(item.price).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            }
            onFocus={() => {
              if (editingPrice[row.id] === undefined) setEditingPrice(prev => ({ ...prev, [row.id]: item.price === 0 ? "" : String(item.price) }));
            }}
            onChange={e => {
              let val = e.target.value.replace(/[^0-9.,]/g, "");
              val = val.replace(/,/g, ".");
              setEditingPrice(prev => ({ ...prev, [row.id]: val }));
            }}
            onBlur={() => {
              const raw = editingPrice[row.id] !== undefined ? editingPrice[row.id] : String(item.price || "");
              const num = raw === "" ? 0 : parseFloat(String(raw).replace(/,/g, "."));
              setItems(prev => {
                const copy = [...prev];
                copy[row.id] = { ...copy[row.id], price: Number(Number(num || 0).toFixed(2)) };
                return copy;
              });
              handleItemChange(info.row.index, 'price', Number(Number(num || 0).toFixed(2)));
              setEditingPrice(prev => { const c = { ...prev }; delete c[row.id]; return c; });
            }}
            className="w-full text-xs border rounded text-right"
            style={inputStyle(theme)}
            min="0"
          />
        );
      },
      size: columnWidths.price,
    },
    {
      accessorKey: 'discPercent',
      header: 'Discount %',
      cell: info => {
        const row = info.row.original;
        return (
          <input
            type="text"
            inputMode="numeric"
            value={
              editingDiscPercent[row.id] !== undefined
                ? editingDiscPercent[row.id]
                : (row.discPercent === "" ? "" : String(row.discPercent))
            }
            onFocus={() => {
              if (editingDiscPercent[row.id] === undefined) {
                setEditingDiscPercent(prev => ({ ...prev, [row.id]: row.discPercent === 0 ? "" : String(row.discPercent) }));
              }
            }}
            onChange={e => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setEditingDiscPercent(prev => ({ ...prev, [row.id]: v }));
            }}
            onBlur={() => {
              const raw = editingDiscPercent[row.id] !== undefined ? editingDiscPercent[row.id] : String(row.discPercent || "");
              const num = raw === "" ? "" : Number(raw);
              // update via handleItemChange so recalculation happens
              handleItemChange(info.row.index, 'discPercent', num);
              // also update local items state to keep UI in sync
              setItems(prev => {
                const copy = [...prev];
                copy[row.id] = { ...copy[row.id], discPercent: num === "" ? "" : Number(num) };
                return copy;
              });
              setEditingDiscPercent(prev => { const c = { ...prev }; delete c[row.id]; return c; });
            }}
            className="w-full text-xs border rounded text-right"
            style={inputStyle(theme)}
            min="0"
            max="100"
          />
        );
      },
      size: 60,
    },
    {
      accessorKey: 'discAmountItem',
      header: 'Discount Amount Item',
      cell: info => (
        <span className="text-xs font-semibold" style={{ textAlign: 'right', display: 'block', width: '100%' }}>
          {info.row.original.discAmountItem?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
      size: 100,
    },
    {
      accessorKey: 'discAmount',
      header: 'Discount Amount',
      cell: info => (
        <span className="text-xs font-semibold" style={{ textAlign: 'right', display: 'block', width: '100%' }}>
          {(Number(info.row.original.discAmount || 0)).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      ),
      size: columnWidths.discAmount,
    },
    {
      accessorKey: 'tax',
      header: 'Pajak',
      cell: info => (
        <Select
          isMulti
          isClearable={false}
          options={masterPajak.map(pajak => ({
            value: pajak.code,
            label: pajak.code
          }))}
          value={Array.isArray(info.row.original.tax) ? info.row.original.tax.map(code => ({ value: code, label: code })) : []}
          onChange={selected => {
            const vals = Array.isArray(selected) ? selected.map(s => s.value) : [];
            // gunakan handleItemChange agar kalkulasi diskon/pajak/amount dilakukan
            handleItemChange(idx, 'tax', vals);
          }}
          menuPortalTarget={document.body}
          styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
          placeholder="Kode Pajak"
        />
      ),
      size: columnWidths.tax,
    },
    {
      accessorKey: 'gudang',
      header: 'Gudang',
      cell: info => (
        <select
          value={info.row.original.gudang || ''}
          onChange={e => handleItemChange(info.row.index, 'gudang', e.target.value)}
          className="w-full"
          style={{
            background: theme.fieldColor,
            color: theme.fontColor,
            fontFamily: theme.fontFamily,
            border: `1px solid ${theme.dropdownColor}`,
            borderRadius: 4,
            padding: '2px 4px',
            fontSize: 12,
            height: 24,
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => Object.assign(e.target.style, elegantInputFocus)}
          onBlur={e => Object.assign(e.target.style, { borderColor: theme.cardBorderColor })}
        >
          <option value="" style={{ background: theme.fieldColor, color: theme.fontColor }}>Pilih Gudang</option>
          {masterGudang.map(g => (
            <option key={g.id} value={g.id} style={{ background: theme.fieldColor, color: theme.fontColor }}>
              {g.nama}
            </option>
          ))}
        </select>
      ),
      size: 80,
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: info => (
        <span
          className="text-xs font-semibold"
          style={{ textAlign: 'right', display: 'block', width: '100%' }}
        >
          {info.row.original.amount?.toLocaleString('id-ID')}
        </span>
      ),
      size: 80,
    },
    {
      accessorKey: 'taxamount1',
      header: 'Tax Amount 1',
      cell: info => (
        <span className="text-xs font-semibold" style={{ textAlign: 'right', display: 'block', width: '100%' }}>
          {info.row.original.taxamount1?.toLocaleString('id-ID')}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: 'taxamount2',
      header: 'Tax Amount 2',
      cell: info => (
        <span className="text-xs font-semibold" style={{ textAlign: 'right', display: 'block', width: '100%' }}>
          {info.row.original.taxamount2?.toLocaleString('id-ID')}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: 'taxamount3',
      header: 'Tax Amount 3',
      cell: info => (
        <span className="text-xs font-semibold" style={{ textAlign: 'right', display: 'block', width: '100%' }}>
          {info.row.original.taxamount3?.toLocaleString('id-ID')}
        </span>
      ),
      size: 70,
    },
    {
      accessorKey: 'dpp',
      header: 'DPP',
      cell: info => {
        const it = info.row.original || {};
        const subtotal = (Number(it.qty) || 0) * (Number(it.price) || 0);
        const dpp = subtotal - (Number(it.discAmount) || 0);
        return (
          <span className="text-xs font-semibold" style={{ textAlign: 'right', display: 'block', width: '100%' }}>
            {dpp.toLocaleString('id-ID')}
          </span>
        );
      },
      size: columnWidths.dpp,
    },
    {
      id: 'action',
      header: 'Action',
      cell: info => (
        <button
          onClick={() => removeItem(info.row.index)}
          style={{
            background: theme.buttonHapus,
            color: "#fff",
            fontFamily: theme.fontFamily,
            fontSize: 8,
            border: `1px solid ${theme.buttonHapus}`,
            borderRadius: 4,
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            cursor: 'pointer',
          }}
          title="Hapus"
        >
          &#10005; {/* Unicode X */}
        </button>
      ),
      size: columnWidths.aksi,
    }
  ];

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange', // agar bisa resize kolom
  });

  // Pindahkan ke dalam komponen
  const elegantInputStyle = {
    background: 'transparent',
    color: theme.fontColor,
    fontFamily: theme.fontFamily,
    border: `1px solid ${theme.cardBorderColor}`,
    borderRadius: 4,
    padding: '2px 4px', // lebih kecil
    fontSize: 12,
    height: 24,         // lebih pendek
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  const elegantInputFocus = {
    borderColor: theme.buttonSimpan,
  };

  // Tambahkan style input grid
  const gridInputStyle = {
    background: '#fff',
    color: theme.fontColor,
    fontFamily: theme.fontFamily,
    border: '1px solid #bfc4d4',
    borderRadius: 0,
    padding: '2px 4px',
    fontSize: 13,
    height: 22,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };
  const gridInputFocus = {
    borderColor: '#4f8edc',
    background: '#eaf3ff',
  };

  useEffect(() => {
    if (items.length === 0) {
      setItems([{
        id: Date.now() + Math.random(),
        kodeItem: '',
        namaItem: '',
        qty: 0,
        unit: '',
        price: "",           // <-- harus string kosong
        discPercent: "",     // <-- harus string kosong
        discAmountItem: "",  // <-- harus string kosong
        discAmount: 0,
        tax: [],
        taxamount1: 0,
        taxamount2: 0,
        taxamount3: 0,
        dpp: 0,
        amount: 0,
        gudang: ''
      }]);
    }
  }, [showForm]);

  return (
    <div className="p-6 min-h-screen" style={{ background: theme.backgroundColor, color: theme.fontColor, fontFamily: theme.fontFamily }}>
      <h1 className="text-2xl font-bold mb-6">Penjualan - AR Invoice</h1>
      
      {/* Card Form Input */}
      <Card className="p-8 rounded-xl shadow-lg mb-8" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.cardBorderColor }}>
        {/* Header & Tombol Tampilkan Form */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">
            {editMode ? "Edit Data" : "Input Data"}
          </h2>
          <Button
            onClick={() => {
              if (showForm) {
                // Sembunyikan form & reset
                setShowForm(false);
                setEditMode(false);
                setEditId(null);
                setFormData({
                  nomorInvoice: '',
                  tanggal: new Date().toISOString().split('T')[0],
                  dueDate: '',
                  customer: '',
                  gudang: '',
                  termPembayaran: '',
                  departement: '',
                  nomorEfaktur: '',
                  notes: '',
                  freight: 0,
                  stamp: 0
                });
                setItems([{
                  id: Date.now() + Math.random(),
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
                generateNomorInvoice();
              } else {
                // Tampilkan form
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

        {/* Form Penjualan */}
        {showForm && (
          <div>
            {/* Form Input Atas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div>
                <label
                  className="block font-semibold mb-1"
                  style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}
                >
                  Customer
                </label>
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
                <label className="block font-semibold mb-1 text-gray-700" style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Invoice No.</label>
                <Input name="nomorInvoice" value={formData.nomorInvoice} readOnly style={{ ...inputStyle(theme) }} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700" style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Tanggal</label>
                <Input type="date" name="tanggal" value={formData.tanggal} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-gray-700" style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Due Date</label>
                <Input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block font-semibold mb-1 text-gray-700" style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Gudang</label>
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
                <label className="block font-semibold mb-1 text-gray-700" style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Departement</label>
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
                <Button onClick={() => setShowModal(true)} style={{ background: theme.buttonSimpan, color: "#fff", fontFamily: theme.fontFamily, border: `2px solid ${theme.buttonSimpan}` }}>
                  + Tambah Item
                </Button>
              </div>

              {/* simplified table: avoid re-mount issues from react-table while editing */}
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
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 60 }}>Discount %
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 120 }}>Discount Amount Item
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 120 }}>Discount Amount
                         <div onMouseDown={e => startResize('discAmount', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: columnWidths.tax }}>Pajak
                        <div onMouseDown={e => startResize('tax', e)} style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: 6, cursor: 'col-resize' }} />
                      </th>
                      <th className="border px-2 py-1" style={{ position: 'relative', width: 100 }}>Gudang
                      </th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: 90 }}>Tax Amount 1
                      </th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: 90 }}>Tax Amount 2
                      </th>
                      <th className="border px-2 py-1 text-right" style={{ position: 'relative', width: 90 }}>Tax Amount 3
                      </th>
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
                              const val = e.target.value;
                              const selected = masterBarangJasa.find(m => m.kode === val);
                              setItems(prev => {
                                const copy = [...prev];
                                copy[idx] = {
                                  ...copy[idx],
                                  kodeItem: val,
                                  namaItem: selected ? selected.nama : copy[idx].namaItem,
                                  unit: selected ? selected.satuan : copy[idx].unit,
                                  price: selected ? selected.hargaJual : copy[idx].price
                                };
                                return copy;
                              });
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
                            onChange={e => setItems(prev => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], namaItem: e.target.value };
                              return copy;
                            })}
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
                              let v = e.target.value.replace(/[^0-9.,]/g, "");
                              v = v.replace(/,/g, ".");
                              setEditingQty(prev => ({ ...prev, [item.id]: v }));
                            }}
                            onBlur={() => {
                              const raw = editingQty[item.id] !== undefined ? editingQty[item.id] : String(item.qty || "");
                              const num = raw === "" ? 0 : parseFloat(String(raw).replace(/,/g, "."));
                              setItems(prev => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], qty: Number(Number(num || 0).toFixed(2)) };
                                return copy;
                              });
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
                            onChange={e => setItems(prev => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], unit: e.target.value };
                              return copy;
                            })}
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
                              setItems(prev => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], price: Number(Number(num || 0).toFixed(2)) };
                                return copy;
                              });
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
                              const v = e.target.value.replace(/[^0-9]/g, "");
                              setEditingDiscPercent(prev => ({ ...prev, [item.id]: v }));
                            }}
                            onBlur={() => {
                              const raw = editingDiscPercent[item.id] !== undefined ? editingDiscPercent[item.id] : String(item.discPercent || "");
                              const num = raw === "" ? "" : Number(raw);
                              // update via handleItemChange so recalculation happens
                              handleItemChange(idx, 'discPercent', num);
                              // also update local items state to keep UI in sync
                              setItems(prev => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], discPercent: num === "" ? "" : Number(num) };
                                return copy;
                              });
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
                              if (editingDiscAmountItem[item.id] === undefined) setEditingDiscAmountItem(prev => ({ ...prev, [item.id]: item.discAmountItem === 0 ? "" : String(item.discAmountItem) }));
                            }}
                            onChange={e => {
                              let val = e.target.value.replace(/[^0-9.,]/g, "");
                              val = val.replace(/,/g, ".");
                              setEditingDiscAmountItem(prev => ({ ...prev, [item.id]: val }));
                            }}
                            onBlur={() => {
                              const raw = editingDiscAmountItem[item.id] !== undefined ? editingDiscAmountItem[item.id] : String(item.discAmountItem || "");
                              const num = raw === "" ? 0 : parseFloat(String(raw).replace(/,/g, "."));
                              setItems(prev => {
                                const copy = [...prev];
                                copy[idx] = { ...copy[idx], discAmountItem: Number(Number(num || 0).toFixed(2)) };
                                return copy;
                              });
                              handleItemChange(idx, 'discAmountItem', Number(Number(num || 0).toFixed(2)));
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
                            options={masterPajak.map(p => ({ value: p.code, label: p.code }))
                            }
                            value={Array.isArray(item.tax) ? item.tax.map(code => ({ value: code, label: code })) : []}
                            onChange={selected => {
                              const vals = Array.isArray(selected) ? selected.map(s => s.value) : [];
                              // gunakan handleItemChange agar kalkulasi diskon/pajak/amount dilakukan
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
                            onChange={e => setItems(prev => {
                              const copy = [...prev];
                              copy[idx] = { ...copy[idx], gudang: e.target.value };
                              return copy;
                            })}
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
                        {/* DPP = qty * price - discount (use discAmountItem) */}
                        <td className="border px-2 py-1 text-right" style={{ width: columnWidths.dpp }}>
                          { (item.dpp || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>

                        {/* Total = DPP + taxamount1 + taxamount2 + taxamount3 */}
                        <td className="border px-2 py-1 text-right" style={{ width: columnWidths.total }}>
                          { (item.amount || 0).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
                        </td>

                        <td className="border px-2 py-1 text-center" style={{ width: columnWidths.aksi }}>
                          <button onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))} className="px-2 py-1 rounded" style={{ background: theme.buttonHapus, color: '#fff' }}>X</button>
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
                              <input type="checkbox" checked={selectedModalItems.includes(item.id)} onChange={e => {
                                setSelectedModalItems(e.target.checked
                                  ? [...selectedModalItems, item.id]
                                  : selectedModalItems.filter(id => id !== item.id));
                              }} />
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
                      // Add selected items to detail
                      const selectedItems = masterBarangJasa.filter(item => selectedModalItems.includes(item.id));
                      const newDetailItems = selectedItems.map((item, idx) => ({
                        id: Date.now() + Math.random() + idx,
                         kodeItem: item.kode,
                         namaItem: item.nama,
                         qty: 0,
                         unit: item.satuan || '',
                         price: item.hargaJual || 0,
                         discPercent: 0,
                         discAmountItem: 0,
                         discAmount: 0,
                         tax: 0,
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

            {/* Bagian Bawah */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {/* Kiri: Nomor eFaktur & Notes */}
              <div className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1 text-gray-700"style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Nomor eFaktur</label>
                  <Input name="nomorEfaktur" value={formData.nomorEfaktur} onChange={handleInputChange} style={{ ...inputStyle(theme) }} />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-gray-700" style={{
                    color: theme.fontColor,
                    fontFamily: theme.fontFamily
                  }}>Notes</label>
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
                  {/* Pajak summary dinamis */}
                  {(() => {
                    // Hitung total taxamount1,2,3
                    const totalTax1 = items.reduce((sum, item) => sum + (item.taxamount1 || 0), 0);
                    const totalTax2 = items.reduce((sum, item) => sum + (item.taxamount2 || 0), 0);
                    const totalTax3 = items.reduce((sum, item) => sum + (item.taxamount3 || 0), 0);
                    // Ambil nama pajak sesuai urutan
                    const pajak1 = masterPajak.find(p => p.order === 1);
                    const pajak2 = masterPajak.find(p => p.order === 2);
                    const pajak3 = masterPajak.find(p => p.order === 3);
                    return (
                      <>
                        {totalTax1 !== 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span>{pajak1 ? pajak1.tax_name : 'Tax Amount 1'}:</span>
                            <span className="font-semibold">Rp {totalTax1.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {totalTax2 !== 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span>{pajak2 ? pajak2.tax_name : 'Tax Amount 2'}:</span>
                            <span className="font-semibold">Rp {totalTax2.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        {totalTax3 !== 0 && (
                          <div className="flex justify-between items-center mb-2">
                            <span>{pajak3 ? pajak3.tax_name : 'Tax Amount 3'}:</span>
                            <span className="font-semibold">Rp {totalTax3.toLocaleString('id-ID')}</span>
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
                    Kosongkan Data
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Card Daftar Transaksi */}
      <Card className="p-8 rounded-xl shadow-lg" style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily, borderColor: theme.cardBorderColor }}>
        <h2 className="text-lg font-bold mb-4" style={{ color: theme.fontColor, fontFamily: theme.fontFamily }}>
          Daftar Transaksi
        </h2>

        {/* Filter & Search */}
        <div className="mb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by Invoice No, Customer, or Total"
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

        {/* Table Transaksi */}
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: theme.cardBorderColor }}>
          <table className="min-w-full border-collapse text-xs" style={{ fontFamily: theme.tableFontFamily }}>
            <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
              <tr>
                <th className="border px-2 py-1 text-left">No.</th>
                <th className="border px-2 py-1 text-left">Invoice No.</th>
                <th className="border px-2 py-1 text-left">Tanggal</th>
                <th className="border px-2 py-1 text-left">Customer</th>
                <th className="border px-2 py-1 text-right">Total</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredPenjualan.map((trx, index) => (
                <tr key={trx.id} style={{ background: index % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor, color: theme.tableFontColor }}>
                  <td className="border px-2 py-1 text-center">{index + 1}</td>
                  <td className="border px-2 py-1">{trx.nomorInvoice}</td>
                  <td className="border px-2 py-1">{trx.tanggal ? new Date(trx.tanggal).toLocaleDateString('id-ID') : ''}</td>
                  <td className="border px-2 py-1">
                    {masterPembeli.find(p => String(p.ID) === String(trx.customerId))?.nama || '-'}
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

// Helper style function
function inputStyle(theme) {
  return {
    background: theme.fieldColor,
    color: theme.fontColor,
    fontFamily: theme.fontFamily,
    borderColor: theme.dropdownColor,
  };
}