import React, { useState, useEffect } from "react";
import api from "../../utils/api";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

function formatDateDMY(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

export default function InputTransaksiTable({ 
  selectedCOA, 
  refresh, 
  shouldJumpToLatest,
  latestTransaksiData,
  onJumpCompleted,
  onRowDoubleClick 
}) {
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [masterCoaList, setMasterCoaList] = useState([]);
  const [coaList, setCoaList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [localRefresh, setLocalRefresh] = useState(false);

  const itemsPerPage = 10;
  
  // State changes
  useEffect(() => {
    // Data state updated
  }, [data, selectedCOA]);

  // ✅ FETCH: COA list
  useEffect(() => {
    api.get("/coa-kas-bank")
      .then(res => {
        setCoaList(res.data || []);
      })
      .catch(err => {
        setCoaList([]);
      });
  }, []);

  // ✅ FETCH: Master COA list
  useEffect(() => {
    api.get("/master-coa")
      .then(res => {
        setMasterCoaList(res.data || []);
      })
      .catch(err => {
        setMasterCoaList([]);
      });
  }, []);

  // ✅ FETCH: Project list
  useEffect(() => {
    api.get("/master-project")
      .then(res => {
        setProjectList(res.data.data || []);
      })
      .catch(err => {
        setProjectList([]);
      });
  }, []);

  // selectedCOA changes
  useEffect(() => {
    // selectedCOA updated
  }, [selectedCOA]);

  // ✅ FIXED: Single useEffect untuk fetch transaksi data
  useEffect(() => {
    //
    
    if (!selectedCOA) {
      //
      setData([]);
      return;
    }

    const fetchWithDelay = setTimeout(() => {
      fetchTransaksiData();
    }, 300);

    const fetchTransaksiData = async () => {
      try {
        let queryParam = selectedCOA;
        if (coaList.length > 0) {
          const coaById = coaList.find(coa => String(coa.id) === String(selectedCOA));
          if (coaById) {
            queryParam = coaById.kode;
          }
        } else {
          try {
            const coaRes = await api.get("/coa-kas-bank");
            const tempCoaList = coaRes.data || [];
            const coaById = tempCoaList.find(coa => String(coa.id) === String(selectedCOA));
            if (coaById) {
              queryParam = coaById.kode;
            }
          } catch (err) {
            //
          }
        }
        const res = await api.get(`/input-transaksi?coaAkunBank=${queryParam}`);
        if (Array.isArray(res.data)) {
          setData(res.data);
        } else if (res.data?.data && Array.isArray(res.data.data)) {
          setData(res.data.data);
        } else {
          setData([]);
        }
      } catch (err) {
        setData([]);
      }
    };

    return () => clearTimeout(fetchWithDelay);
  }, [selectedCOA, refresh, localRefresh, coaList.length]); // ✅ ADD: coaList.length dependency

  // ✅ TRIGGER: Local refresh when coaList loads
  useEffect(() => {
    if (selectedCOA && coaList.length > 0 && data.length === 0) {
      
      const timeoutId = setTimeout(() => {
        setLocalRefresh(prev => !prev);
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [coaList.length, selectedCOA]);

  // ✅ HELPER: Get current query param
  const getCurrentQueryParam = () => {
    if (!selectedCOA) return null;
    
    if (coaList.length > 0) {
      const coaById = coaList.find(coa => String(coa.id) === String(selectedCOA));
      return coaById ? coaById.kode : selectedCOA;
    }
    
    return selectedCOA;
  };

  // ✅ HELPER: Get selected COA name for header
  const getSelectedCoaName = () => {
    if (!selectedCOA) return '';
    
    if (coaList.length > 0) {
      const coaById = coaList.find(coa => String(coa.id) === String(selectedCOA));
      if (coaById) {
        return `${coaById.kode} - ${coaById.nama}`;
      }
    }
    
    const queryParam = getCurrentQueryParam();
    if (queryParam && masterCoaList.length > 0) {
      const found = masterCoaList.find(coa => String(coa.kode) === String(queryParam));
      return found ? `${found.kode} - ${found.nama}` : queryParam;
    }
    
    return selectedCOA;
  };

  // ✅ HELPER: Other helper functions
  const getCoaName = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `${found.kode} - ${found.nama}` : kode;
  };

  const getAkunTransaksiName = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? `(${found.kode}) ${found.nama}` : kode;
  };

  const getAkunTransaksiKode = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? found.kode : kode;
  };

  const getAkunTransaksiNamaOnly = (kode) => {
    if (!kode) return '';
    const found = masterCoaList.find(coa => String(coa.kode) === String(kode));
    return found ? found.nama : '';
  };

  const getProjectName = (kodeProject) => {
    if (!kodeProject) return '';
    const found = projectList.find(project => project.kode_project === kodeProject);
    return found ? found.nama_project : kodeProject;
  };

  // ✅ DATA PROCESSING
  const { filteredData, sortedFiltered } = React.useMemo(() => {
    
    // Step 1: Filter data
    const filtered = data.filter(row => {
      if (!search) return true;
      const searchLower = search.toLowerCase();
      return (
        String(row.noTransaksi || '').toLowerCase().includes(searchLower) ||
        String(row.deskripsi || '').toLowerCase().includes(searchLower) ||
        String(row.projectNo || '').toLowerCase().includes(searchLower) ||
        String(row.projectName || '').toLowerCase().includes(searchLower) ||
        getCoaName(row.coaAkunBank).toLowerCase().includes(searchLower) ||
        getAkunTransaksiName(row.akunTransaksi).toLowerCase().includes(searchLower)
      );
    });

    // Step 2: Sort data (chronological order)
    const sorted = filtered.sort((a, b) => {
      const dateA = new Date(a.tanggal || 0);
      const dateB = new Date(b.tanggal || 0);
      
      // Primary sort: by date (ascending - oldest first for chronological order)
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA - dateB;
      }
      
      // Secondary sort: by ID (ascending - oldest first)
      return (a.id || 0) - (b.id || 0);
    });
    
    return {
      filteredData: filtered,
      sortedFiltered: sorted
    };
  }, [data, search, masterCoaList, projectList]); // ✅ All dependencies for filtering/sorting

  // ✅ ENHANCED: Smart auto-jump using the same filtered data
  useEffect(() => {
    if (shouldJumpToLatest && latestTransaksiData && data.length > 0) {
      
      // ✅ Use the same sortedFiltered data (no duplicate processing)
      const targetIndex = findTargetTransaksiIndex(sortedFiltered, latestTransaksiData);
      
      if (targetIndex !== -1) {
        const targetPage = Math.ceil((targetIndex + 1) / itemsPerPage);
        
        // Jump to target page
        if (targetPage !== page) {
          setPage(targetPage);
        }
        
        // Clear search to ensure visibility
        if (search) {
          setSearch("");
        }
      } else {
        //
        // Fallback: jump to last page
        const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
        if (totalPages > 0) {
          setPage(totalPages);
        }
      }
      
      // Notify completion
      if (onJumpCompleted) {
        setTimeout(() => {
          onJumpCompleted();
        }, 300);
      }
    }
  }, [shouldJumpToLatest, latestTransaksiData, sortedFiltered.length, search, itemsPerPage, page, onJumpCompleted]);

  // ✅ HELPER: Find target transaksi index
  const findTargetTransaksiIndex = (sortedData, targetData) => {
    if (!targetData) return -1;
    
    // Try to find by exact ID match
    if (targetData.id) {
      const index = sortedData.findIndex(item => item.id === targetData.id);
      if (index !== -1) return index;
    }
    
    // Fallback: find by noTransaksi and date
    if (targetData.noTransaksi) {
      return sortedData.findIndex(item => 
        item.noTransaksi === targetData.noTransaksi &&
        new Date(item.tanggal).getTime() === new Date(targetData.tanggal).getTime()
      );
    }
    
    return -1;
  };

  // ✅ PAGINATION: Use the memoized sorted data
  const totalPages = Math.ceil(sortedFiltered.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paged = sortedFiltered.slice(startIndex, startIndex + itemsPerPage);

  // ✅ SALDO CALCULATION: Use the memoized sorted data
  const masterSaldoAwal = React.useMemo(() => {
    if (!selectedCOA || !coaList.length) return 0;
    
    const coa = coaList.find(coa => String(coa.id) === String(selectedCOA));
    if (!coa) return 0;
    
    const saldoAwal = coa.saldoAwal;
    if (saldoAwal === null || saldoAwal === undefined || isNaN(saldoAwal)) return 0;
    
    return Number(saldoAwal);
  }, [coaList, selectedCOA]);

  const saldoAwalPage = React.useMemo(() => {
    if (!sortedFiltered || !sortedFiltered.length) return masterSaldoAwal;

    const transaksSebelumPage = (page - 1) * itemsPerPage;
    
    if (transaksSebelumPage === 0) {
      return masterSaldoAwal;
    }

    let saldo = masterSaldoAwal;
    for (let i = 0; i < transaksSebelumPage && i < sortedFiltered.length; i++) {
      const row = sortedFiltered[i];
      if (row) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        saldo += debit - kredit;
      }
    }

    return saldo;
  }, [sortedFiltered, masterSaldoAwal, page, itemsPerPage]);

  const calculateBalances = React.useMemo(() => {
    if (!paged || !paged.length) return {};
    
    let running = saldoAwalPage;
    const balanceMap = {};
    
    paged.forEach((row) => {
      if (row && row.id) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        running += debit - kredit;
        balanceMap[row.id] = running;
      }
    });
    
    return balanceMap;
  }, [paged, saldoAwalPage]);

  // ✅ PAGE VALIDATION: Use the memoized sorted data
  useEffect(() => {
    if (sortedFiltered.length > 0 && itemsPerPage > 0) {
      const totalPagesCalc = Math.ceil(sortedFiltered.length / itemsPerPage);
      if (page > totalPagesCalc && totalPagesCalc > 0) {
        setPage(totalPagesCalc);
      } else if (page < 1) {
        setPage(1);
      }
    } else if (sortedFiltered.length === 0) {
      setPage(1);
    }
  }, [sortedFiltered.length, page, itemsPerPage]);

  // ✅ PRINT FUNCTION
  const handlePrint = () => {
    const selectedCoaName = getSelectedCoaName();
    const printData = [...sortedFiltered];
    let runningBalance = masterSaldoAwal;
    const balancesForPrint = {};
    
    printData.forEach((row) => {
      if (row && row.id) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        runningBalance += debit - kredit;
        balancesForPrint[row.id] = runningBalance;
      }
    });

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Daftar Transaksi - ${selectedCoaName}</title>
        <style>
          @page { margin: 20px; }
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 20px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .subtitle { font-size: 14px; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #333; padding: 6px; text-align: left; }
          th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .saldo-awal { background-color: #fffbf0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Daftar Transaksi</div>
          <div class="subtitle">${selectedCoaName}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Tanggal</th>
              <th>COA Akun Bank</th>
              <th>Kode Akun</th>
              <th>Nama Akun</th>
              <th>Deskripsi</th>
              <th>Debit</th>
              <th>Kredit</th>
              <th>Balance</th>
              <th>Nomor Transaksi</th>
              <th>Project No</th>
              <th>Project Name</th>
            </tr>
          </thead>
          <tbody>
            <tr class="saldo-awal">
              <td class="text-center" colspan="8">Saldo Awal</td>
              <td class="text-right">${masterSaldoAwal.toLocaleString()}</td>
              <td colspan="3"></td>
            </tr>
            ${printData.map((row, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td class="text-center">${formatDateDMY(row.tanggal)}</td>
                <td>${getCoaName(row.coaAkunBank)}</td>
                <td class="text-center">${getAkunTransaksiKode(row.akunTransaksi)}</td>
                <td>${getAkunTransaksiNamaOnly(row.akunTransaksi)}</td>
                <td>${row.deskripsi || ''}</td>
                <td class="text-right">${row.debit && Number(row.debit) > 0 ? Number(row.debit).toLocaleString() : '-'}</td>
                <td class="text-right">${row.kredit && Number(row.kredit) > 0 ? Number(row.kredit).toLocaleString() : '-'}</td>
                <td class="text-right">${balancesForPrint[row.id].toLocaleString()}</td>
                <td class="text-center">${row.noTransaksi || ''}</td>
                <td class="text-center">${row.projectNo || ''}</td>
                <td>${getProjectName(row.projectNo)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    // Buka window baru untuk print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // ✅ EXPORT EXCEL FUNCTION
  const handleExportExcel = () => {
    const selectedCoaName = getSelectedCoaName();
    const exportData = [...sortedFiltered];
    let runningBalance = masterSaldoAwal;
    const balancesForExport = {};
    
    exportData.forEach((row) => {
      if (row && row.id) {
        const debit = row.debit && !isNaN(row.debit) ? Number(row.debit) : 0;
        const kredit = row.kredit && !isNaN(row.kredit) ? Number(row.kredit) : 0;
        runningBalance += debit - kredit;
        balancesForExport[row.id] = runningBalance;
      }
    });

    const excelData = [
      [`Daftar Transaksi - ${selectedCoaName}`],
      [],
      [
        'No',
        'Tanggal',
        'COA Akun Bank', 
        'Kode Akun',
        'Nama Akun',
        'Deskripsi',
        'Debit',
        'Kredit',
        'Balance',
        'Nomor Transaksi',
        'Project No',
        'Project Name'
      ],
      [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'Saldo Awal',
        masterSaldoAwal,
        '',
        '',
        ''
      ],
      ...exportData.map((row, idx) => [
        idx + 1,
        formatDateDMY(row.tanggal),
        getCoaName(row.coaAkunBank),
        getAkunTransaksiKode(row.akunTransaksi),
        getAkunTransaksiNamaOnly(row.akunTransaksi),
        row.deskripsi || '',
        row.debit || 0,
        row.kredit || 0,
        balancesForExport[row.id],
        row.noTransaksi || '',
        row.projectNo || '',
        getProjectName(row.projectNo)
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    const colWidths = [
      { wch: 5 },   // No
      { wch: 12 },  // Tanggal
      { wch: 20 },  // COA Akun Bank
      { wch: 12 },  // Kode Akun
      { wch: 25 },  // Nama Akun
      { wch: 25 },  // Deskripsi
      { wch: 15 },  // Debit
      { wch: 15 },  // Kredit
      { wch: 15 },  // Balance
      { wch: 20 },  // Nomor Transaksi
      { wch: 12 },  // Project No
      { wch: 20 }   // Project Name
    ];
    ws['!cols'] = colWidths;

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 11 } }];

    XLSX.utils.book_append_sheet(wb, ws, 'Daftar Transaksi');

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const fileName = `Daftar_Transaksi_${selectedCoaName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.xlsx`;

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    saveAs(blob, fileName);
  };

  // ...rest of existing code unchanged...

  return (
    <div className="bg-white rounded shadow p-4 mt-8">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-lg font-bold">
          Data Transaksi{selectedCOA ? ` - ${getSelectedCoaName()}` : ""}
        </h2>
        <div className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded">
          💡 Double-click row untuk edit transaksi
        </div>
      </div>

      <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
        Debug Info: 
        selectedCOA: {selectedCOA || 'None'} | 
        queryParam: {getCurrentQueryParam() || 'None'} | 
        refresh: {refresh.toString()} | 
        shouldJump: {shouldJumpToLatest.toString()} | 
        latestData: {latestTransaksiData?.noTransaksi || 'None'} | 
        localRefresh: {localRefresh.toString()} | 
        Raw Data: {data.length} items | 
        Filtered: {filteredData.length} items | {/* ✅ Use memoized filteredData */}
        Sorted: {sortedFiltered.length} items | {/* ✅ Use memoized sortedFiltered */}
        Current Page: {page} of {Math.ceil(sortedFiltered.length / itemsPerPage)} | 
        Items shown: {paged.length}
      </div>
      
      {selectedCOA ? (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-2">
          <input
            type="text"
            placeholder="Cari..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded w-full md:w-64"
          />
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600"
            >
              Print
            </button>
            <button
              onClick={handleExportExcel}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Export Excel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 mb-4 p-4 bg-gray-50 rounded">
          Pilih COA Akun Bank dari form di atas untuk melihat data transaksi
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-indigo-100">
            <tr>
              <th className="p-2 border">No</th>
              <th className="p-2 border">Tanggal</th>
              <th className="p-2 border">COA Akun Bank</th>
              <th className="p-2 border">Akun Transaksi</th>
              <th className="p-2 border">Deskripsi</th>
              <th className="p-2 border">Debit</th>
              <th className="p-2 border">Kredit</th>
              <th className="p-2 border">Balance</th>
              <th className="p-2 border">Nomor Transaksi</th>
              <th className="p-2 border">Project No</th>
              <th className="p-2 border">Project Name</th>
            </tr>
          </thead>
          <tbody>
            {selectedCOA && (
              <tr className="bg-yellow-50 font-semibold sticky top-0 z-10">
                <td className="p-2 border text-center" colSpan={7}>
                  Saldo Awal
                </td>
                <td className="p-2 border text-right">
                  {saldoAwalPage && !isNaN(saldoAwalPage) ? saldoAwalPage.toLocaleString() : '0'}
                </td>
                <td className="p-2 border" colSpan={3}></td>
              </tr>
            )}
            {!selectedCOA ? (
              <tr>
                <td colSpan={11} className="text-center p-8 text-gray-500">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-4xl">📋</div>
                    <div className="font-medium">Pilih COA Akun Bank</div>
                    <div className="text-sm">Silakan pilih COA Akun Bank terlebih dahulu untuk melihat data transaksi</div>
                  </div>
                </td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4 text-gray-400">
                  {data.length === 0 ? (
                    <>
                      <div>Tidak ada data transaksi untuk COA yang dipilih</div>
                      <div className="text-xs mt-2">
                        Raw data: {data.length} | Filtered: {filteredData.length} | Search: "{search}"
                      </div>
                    </>
                  ) : (
                    <>
                      <div>Tidak ada data yang sesuai dengan pencarian "{search}"</div>
                      <div className="text-xs mt-2">
                        Total data: {data.length} | Hasil filter: {filteredData.length}
                      </div>
                    </>
                  )}
                </td>
              </tr>
            ) : (
              paged.map((row, idx) => {
                const globalIndex = sortedFiltered.findIndex(item => item.id === row.id);
                const globalNo = globalIndex + 1;
                
                return (
                <tr 
                  key={row.id} 
                  className="hover:bg-indigo-50 cursor-pointer transition-colors"
                  onDoubleClick={() => {
                    if (onRowDoubleClick) {
                      onRowDoubleClick(row);
                    }
                  }}
                  title="Double-click untuk edit transaksi"
                >
                  <td className="p-2 border">{globalNo}</td>
                  <td className="p-2 border">{formatDateDMY(row.tanggal)}</td>
                  <td className="p-2 border">{getCoaName(row.coaAkunBank)}</td>
                  <td className="p-2 border">{getAkunTransaksiName(row.akunTransaksi)}</td>
                  <td className="p-2 border">{row.deskripsi}</td>
                  <td className="p-2 border text-right">
                    {row.debit && !isNaN(row.debit) && Number(row.debit) > 0 ? Number(row.debit).toLocaleString() : '-'}
                  </td>
                  <td className="p-2 border text-right">
                    {row.kredit && !isNaN(row.kredit) && Number(row.kredit) > 0 ? Number(row.kredit).toLocaleString() : '-'}
                  </td>
                  <td className="p-2 border text-right">{calculateBalances[row.id] && !isNaN(calculateBalances[row.id]) ? calculateBalances[row.id].toLocaleString() : '0'}</td>
                  <td className="p-2 border">{row.noTransaksi}</td>
                  <td className="p-2 border">{row.projectNo}</td>
                  <td className="p-2 border">{getProjectName(row.projectNo)}</td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedCOA && paged.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages || 1}
          </span>
          <div className="space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-3 py-1 rounded border bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
