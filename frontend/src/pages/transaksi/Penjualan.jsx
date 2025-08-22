import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function Penjualan() {
  const [formData, setFormData] = useState({
    nomorInvoice: '',
    tanggal: new Date().toISOString().split('T')[0],
    customer: '',
    alamat: '',
    noTelp: '',
    termPembayaran: '',
    jatuhTempo: '',
    keterangan: ''
  });

  const [items, setItems] = useState([
    {
      id: 1,
      itemNo: '',
      description: '',
      qty: 0,
      unit: '',
      unitPrice: 0,
      discPercent: 0,
      discAmountItem: 0,
      discAmount: 0,
      tax: 0,
      amount: 0
    }
  ]);

  const [masterBarangJasa, setMasterBarangJasa] = useState([]);

  useEffect(() => {
    fetchMasterBarangJasa();
    generateNomorInvoice();
  }, []);

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
      [name]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto calculate when qty, unitPrice, or discount changes
    if (['qty', 'unitPrice', 'discPercent'].includes(field)) {
      const item = newItems[index];
      const subtotal = item.qty * item.unitPrice;
      const discAmount = (subtotal * item.discPercent) / 100;
      const afterDisc = subtotal - discAmount;
      const taxAmount = (afterDisc * item.tax) / 100;
      
      newItems[index].discAmount = discAmount;
      newItems[index].amount = afterDisc + taxAmount;
    }

    setItems(newItems);
  };

  const addNewItem = () => {
    const newItem = {
      id: items.length + 1,
      itemNo: '',
      description: '',
      qty: 0,
      unit: '',
      unitPrice: 0,
      discPercent: 0,
      discAmountItem: 0,
      discAmount: 0,
      tax: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.amount || 0), 0);
  };

  const handleSave = async () => {
    try {
      const invoiceData = {
        ...formData,
        items: items,
        total: calculateTotal(),
        status: 'draft'
      };

      const response = await fetch('http://localhost:8080/api/penjualan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(invoiceData)
      });

      if (response.ok) {
        alert('Invoice penjualan berhasil disimpan!');
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
          itemNo: '',
          description: '',
          qty: 0,
          unit: '',
          unitPrice: 0,
          discPercent: 0,
          discAmountItem: 0,
          discAmount: 0,
          tax: 0,
          amount: 0
        }]);
        generateNomorInvoice();
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Gagal menyimpan invoice!');
    }
  };

  const handleDelete = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua data?')) {
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
        itemNo: '',
        description: '',
        qty: 0,
        unit: '',
        unitPrice: 0,
        discPercent: 0,
        discAmountItem: 0,
        discAmount: 0,
        tax: 0,
        amount: 0
      }]);
      generateNomorInvoice();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Penjualan - AR Invoice</h1>
      
      <Card className="p-6">
        {/* Header Invoice */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nomor Invoice</label>
              <Input
                name="nomorInvoice"
                value={formData.nomorInvoice}
                onChange={handleInputChange}
                placeholder="Nomor Invoice"
                readOnly
                className="bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tanggal</label>
              <Input
                type="date"
                name="tanggal"
                value={formData.tanggal}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Customer</label>
              <Input
                name="customer"
                value={formData.customer}
                onChange={handleInputChange}
                placeholder="Nama Customer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alamat</label>
              <Input
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                placeholder="Alamat Customer"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">No. Telepon</label>
              <Input
                name="noTelp"
                value={formData.noTelp}
                onChange={handleInputChange}
                placeholder="Nomor Telepon"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Term Pembayaran</label>
              <select
                name="termPembayaran"
                value={formData.termPembayaran}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Pilih Term</option>
                <option value="Cash">Cash</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 60">Net 60</option>
                <option value="Net 90">Net 90</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Jatuh Tempo</label>
              <Input
                type="date"
                name="jatuhTempo"
                value={formData.jatuhTempo}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Keterangan</label>
              <Input
                name="keterangan"
                value={formData.keterangan}
                onChange={handleInputChange}
                placeholder="Keterangan"
              />
            </div>
          </div>
        </div>

        {/* Table Items */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Detail Barang/Jasa</h3>
            <Button onClick={addNewItem} className="bg-green-600 hover:bg-green-700">
              + Tambah Item
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-blue-100">
                  <th className="border border-gray-300 px-2 py-2 text-sm">Item No.</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Description</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Qty</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Unit</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Unit Price</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Disc %</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Disc Amount Item</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Disc Amount</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Tax</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Amount</th>
                  <th className="border border-gray-300 px-2 py-2 text-sm">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-1 py-1">
                      <select
                        value={item.itemNo}
                        onChange={(e) => {
                          const selectedItem = masterBarangJasa.find(m => m.kode === e.target.value);
                          if (selectedItem) {
                            handleItemChange(index, 'itemNo', e.target.value);
                            handleItemChange(index, 'description', selectedItem.nama);
                            handleItemChange(index, 'unit', selectedItem.satuan);
                            handleItemChange(index, 'unitPrice', selectedItem.hargaJual);
                          }
                        }}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                      >
                        <option value="">Pilih Item</option>
                        {masterBarangJasa.map(item => (
                          <option key={item.id} value={item.kode}>
                            {item.kode}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        placeholder="Deskripsi"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => handleItemChange(index, 'qty', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        min="0"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="text"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        placeholder="Unit"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        min="0"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={item.discPercent}
                        onChange={(e) => handleItemChange(index, 'discPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={item.discAmountItem}
                        onChange={(e) => handleItemChange(index, 'discAmountItem', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        min="0"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <span className="text-xs">{item.discAmount.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <input
                        type="number"
                        value={item.tax}
                        onChange={(e) => handleItemChange(index, 'tax', parseFloat(e.target.value) || 0)}
                        className="w-full px-1 py-1 text-xs border-0 focus:ring-0"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <span className="text-xs font-semibold">{item.amount.toLocaleString('id-ID')}</span>
                    </td>
                    <td className="border border-gray-300 px-1 py-1">
                      <Button
                        onClick={() => removeItem(index)}
                        className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 text-xs"
                        disabled={items.length === 1}
                      >
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-blue-50 font-semibold">
                  <td colSpan="9" className="border border-gray-300 px-2 py-2 text-right">
                    Total:
                  </td>
                  <td className="border border-gray-300 px-2 py-2">
                    Rp {calculateTotal().toLocaleString('id-ID')}
                  </td>
                  <td className="border border-gray-300"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4">
          <Button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
          >
            Hapus
          </Button>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
          >
            Simpan
          </Button>
        </div>
      </Card>
    </div>
  );
}