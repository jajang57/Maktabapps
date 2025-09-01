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
      item.discAmount = discAmount;

      // Reset taxamount
      item.taxamount1 = 0;
      item.taxamount2 = 0;
      item.taxamount3 = 0;
      // Hitung taxamount berdasarkan pajak yang dipilih
      if (Array.isArray(item.tax)) {
        item.tax.forEach(code => {
          const pajak = masterPajak.find(p => p.code === code);
          if (pajak) {
            const pajakAmount = afterDisc * pajak.rate_percent / 100;
            if (pajak.order === 1) item.taxamount1 += pajakAmount;
            if (pajak.order === 2) item.taxamount2 += pajakAmount;
            if (pajak.order === 3) item.taxamount3 += pajakAmount;
          }
        });
      }
      item.amount = afterDisc + item.taxamount1 + item.taxamount2 + item.taxamount3;
    }
    setItems(newItems);
  };

  // Saat menambah item baru
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
      tax: [], // array of pajak id
      taxamount1: 0,
      taxamount2: 0,
      taxamount3: 0,
      amount: 0
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
    // Hitung summary taxamount1,2,3
    const summaryTaxamount1 = items.reduce((sum, item) => sum + (item.taxamount1 || 0), 0);
    const summaryTaxamount2 = items.reduce((sum, item) => sum + (item.taxamount2 || 0), 0);
    const summaryTaxamount3 = items.reduce((sum, item) => sum + (item.taxamount3 || 0), 0);

    try {
      const invoiceData = {
        nomorInvoice: formData.nomorInvoice,
        tanggal: formData.tanggal,
        dueDate: formData.dueDate,
        customerId: formData.customer ? Number(formData.customer) : null,
        gudangId: Number(formData.gudang),
        departementId: Number(formData.departement),
        nomorEfaktur: formData.nomorEfaktur,
        notes: formData.notes,
        subtotal: calculateSubtotal(),
        ppn: 0,
        freight: parseFloat(formData.freight) || 0,
        stamp: parseFloat(formData.stamp) || 0,
        total: calculateTotal() + (parseFloat(formData.freight) || 0) + (parseFloat(formData.stamp) || 0),
        taxamount1: summaryTaxamount1,
        taxamount2: summaryTaxamount2,
        taxamount3: summaryTaxamount3,
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
          taxamount1: item.taxamount1,
          taxamount2: item.taxamount2,
          taxamount3: item.taxamount3,
          amount: item.amount,
          gudang: item.gudang
        }))
      };

      const url = editMode ? `/penjualan/${editId}` : '/penjualan';
      const method = editMode ? 'put' : 'post';
      const response = await api[method](url, invoiceData);

      if (response.status === 200 || response.status === 201 || response.data?.success) {
        alert(editMode ? 'Data berhasil diupdate!' : 'Data berhasil disimpan!');
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
          keterangan: '',
          gudang: '',
          departement: '',
          dueDate: '',
          nomorEfaktur: '',
          notes: '',
          freight: 0,
          stamp: 0
        });
        setItems([]); // detail barang/jasa default kosong
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
      amount: item.amount,
      gudang: String(item.gudangId || item.gudang) // pastikan id gudang masuk, fallback ke item.gudang jika ada
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
      size: 70,
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
      size: 200,
    },
    {
      accessorKey: 'qty',
      header: 'Qty',
      cell: info => (
        <input
          type="number"
          value={info.row.original.qty}
          onChange={e => handleItemChange(info.row.index, 'qty', parseFloat(e.target.value) || 0)}
          className="w-full text-xs border rounded text-right"
          style={inputStyle(theme)}
          min="0"
        />
      ),
      size: 40,
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
      size: 60,
    },
    {
      accessorKey: 'price',
      header: 'Price',
      cell: info => (
        <input
          type="text"
          value={info.row.original.price?.toLocaleString('id-ID')}
          onChange={e => {
            // Hapus titik, ubah ke angka
            const val = e.target.value.replace(/\./g, '').replace(/[^0-9]/g, '');
            handleItemChange(info.row.index, 'price', parseFloat(val) || 0);
          }}
          className="w-full text-xs border rounded text-right"
          style={inputStyle(theme)}
          min="0"
          inputMode="numeric"
          pattern="[0-9]*"
        />
      ),
      size: 70,
    },
    {
      accessorKey: 'discPercent',
      header: 'Discount %',
      cell: info => (
        <input
          type="number"
          value={info.row.original.discPercent}
          onChange={e => handleItemChange(info.row.index, 'discPercent', parseFloat(e.target.value) || 0)}
          className="w-full text-xs border rounded text-right"
          style={inputStyle(theme)}
          min="0"
          max="100"
        />
      ),
      size: 60,
    },
    {
      accessorKey: 'discAmountItem',
      header: 'Discount Amount Item',
      cell: info => (
        <input
          type="number"
          value={info.row.original.discAmountItem}
          onChange={e => handleItemChange(info.row.index, 'discAmountItem', parseFloat(e.target.value) || 0)}
          className="w-full text-xs border rounded text-right"
          style={inputStyle(theme)}
          min="0"
        />
      ),
      size: 100,
    },
    {
      accessorKey: 'discAmount',
      header: 'Discount Amount',
      cell: info => (
        <span className="text-xs">{info.row.original.discAmount?.toLocaleString('id-ID')}</span>
      ),
      size: 80,
    },
    {
      accessorKey: 'tax',
      header: 'Tax',
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
            handleItemChange(info.row.index, 'tax', selected.map(opt => opt.value));
          }}
          menuPortalTarget={document.body} // <-- Tambahkan ini
          styles={{
            control: (base) => ({
              ...base,
              minHeight: 20,
              height: 22,
              fontSize: 12,
              background: theme.fieldColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
              borderColor: theme.dropdownColor,
              boxShadow: 'none',
              borderRadius: 0,
              padding: '0 2px',
              width: 120,
              maxWidth: 140,
              display: 'flex',
              alignItems: 'center',
            }),
            multiValue: (base) => ({
              ...base,
              background: theme.fieldColor,
              color: theme.fontColor,
              fontFamily: theme.fontFamily,
              fontSize: 11,
              margin: '1px 2px',
              borderRadius: 0,
              maxWidth: 80,
              height: 16,
              display: 'flex',
              alignItems: 'center',
            }),
            multiValueLabel: (base) => ({
              ...base,
              color: theme.fontColor,
              fontWeight: 600,
              padding: '0 0px',
            }),
            valueContainer: (base) => ({
              ...base,
              padding: '0 2px',
              maxWidth: 110,
              display: 'flex',
              alignItems: 'center',
            }),
            indicatorsContainer: (base) => ({
              ...base,
              padding: '0 2px',
              height: 16,
              display: 'flex',
              alignItems: 'center',
            }),
            clearIndicator: (base) => ({
              ...base,
              padding: 0,
              margin: '0 2px',
              fontSize: 12,
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.fontColor,
            }),
            dropdownIndicator: (base) => ({
              ...base,
              padding: 0,
              margin: '0 2px',
              fontSize: 12,
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.fontColor,
            }),
            menu: (base) => ({
              ...base,
              fontSize: 12,
              maxWidth: 160,
              background: theme.fieldColor,
              color: theme.fontColor,
              zIndex: 9999, // pastikan di atas
            }),
            menuPortal: (base) => ({
              ...base,
              zIndex: 9999, // pastikan di atas modal/table
            }),
            placeholder: (base) => ({
              ...base,
              fontSize: 11,
              color: theme.fontColor,
            }),
            input: (base) => ({
              ...base,
              fontSize: 12,
              color: theme.fontColor,
            }),
          }}
          placeholder="Kode Pajak"
        />
      ),
      size: 100,
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
      size: 30,
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
              <div className="overflow-x-auto max-w-full rounded-lg border min-w-max" style={{ borderColor: theme.cardBorderColor }}>
                <table className="w-full border-collapse whitespace-nowrap text-xs" style={{ fontFamily: theme.tableFontFamily }}>
                  <thead style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            style={{
                              borderColor: theme.cardBorderColor,
                              fontSize: '0.95em',
                              width: header.getSize(),
                              minWidth: header.getSize(),
                              maxWidth: header.getSize(),
                              position: 'relative',
                              padding: '6px 4px',
                              borderRadius: '6px 6px 0 0'
                            }}
                            className="text-center font-bold border"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                style={{
                                  position: 'absolute',
                                  right: 0,
                                  top: 0,
                                  height: '100%',
                                  width: '5px',
                                  cursor: 'col-resize',
                                  userSelect: 'none'
                                }}
                              />
                            )}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} style={{
                        background: row.index % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor,
                        color: theme.tableFontColor,
                        borderRadius: 6
                      }}>
                        {row.getVisibleCells().map(cell => (
                          <td
                            key={cell.id}
                            className="align-middle border"
                            style={{
                              borderColor: theme.cardBorderColor,
                              minWidth: cell.column.getSize(),
                              maxWidth: cell.column.getSize(),
                              width: cell.column.getSize(),
                              padding: '0px 2px',
                              background: row.index % 2 === 0 ? theme.tableBodyColor : theme.tableAltRowColor, // <-- GANTI DI SINI
                              borderRadius: 0,
                              verticalAlign: 'middle',
                              height: 28
                            }}
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: theme.tableFooterColor, color: theme.tableFontColor }}>
                      <td colSpan={columns.length - 2} className="border px-1 py-1 text-right font-bold" style={{ borderColor: theme.cardBorderColor }}>
                        Total:
                      </td>
                      <td className="border px-1 py-1 text-right font-bold" style={{ borderColor: theme.cardBorderColor }}>
                        Rp {calculateTotal().toLocaleString('id-ID')}
                      </td>
                      <td className="border"></td>
                    </tr>
                  </tfoot>
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
                        id: Date.now() + idx,
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