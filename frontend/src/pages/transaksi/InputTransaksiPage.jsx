import React, { useState, useCallback, useRef, useEffect } from "react";
import InputTransaksiForm from "./InputTransaksiForm";
import InputTransaksiTable from "./InputTransaksiTable";
import InputTransaksiLayout from "../../layout/InputTransaksiLayout";

export default function InputTransaksiPage() {
  const [selectedCOA, setSelectedCOA] = useState("");
  const [refreshTable, setRefreshTable] = useState(false);
  const [shouldJumpToLatest, setShouldJumpToLatest] = useState(false);
  const [latestTransaksiData, setLatestTransaksiData] = useState(null); // ✅ ADD: Store latest data untuk jump
  const formRef = useRef();

  // ✅ ADD: Debug state changes
  useEffect(() => {
    console.log("🔍 InputTransaksiPage - selectedCOA changed:", selectedCOA);
    console.log("🔍 InputTransaksiPage - selectedCOA type:", typeof selectedCOA);
    console.log("🔍 InputTransaksiPage - selectedCOA truthy:", !!selectedCOA);
  }, [selectedCOA]);

  useEffect(() => {
    console.log("🔍 InputTransaksiPage - refreshTable changed:", refreshTable);
  }, [refreshTable]);

  // ✅ ENHANCED: handleAfterSubmit dengan data context
  const handleAfterSubmit = useCallback((coaId, transaksiData = null) => {
    console.log("🔍 InputTransaksiPage - handleAfterSubmit called");
    console.log("🔍 Latest transaksi data:", transaksiData);
    
    // ✅ Store data transaksi yang baru disimpan
    if (transaksiData) {
      setLatestTransaksiData(transaksiData);
    }
    
    // ✅ Set flag untuk jump ke data terbaru
    setShouldJumpToLatest(true);
    
    // ✅ Trigger refresh data
    setRefreshTable((r) => {
      console.log("🔍 InputTransaksiPage - refreshTable toggle:", !r);
      return !r;
    });
  }, []);

  // ✅ ADD: Reset jump flag setelah table handle
  const handleJumpCompleted = useCallback(() => {
    setShouldJumpToLatest(false);
    setLatestTransaksiData(null);
  }, []);

  const handleCOAChange = useCallback((coaId) => {
    console.log("🔍 InputTransaksiPage - handleCOAChange called with:", coaId);
    console.log("🔍 InputTransaksiPage - coaId type:", typeof coaId);
    console.log("🔍 InputTransaksiPage - coaId value:", coaId);
    
    // ✅ ENHANCED: Validate coaId before setting
    if (coaId && coaId !== "") {
      console.log("🔍 InputTransaksiPage - Setting selectedCOA to:", coaId);
      setSelectedCOA(coaId);
    } else {
      console.log("🔍 InputTransaksiPage - Clearing selectedCOA (empty value)");
      setSelectedCOA("");
    }
  }, []);

  const handleRowDoubleClick = useCallback((transaksi) => {
    console.log("🔍 InputTransaksiPage - handleRowDoubleClick called with:", transaksi);
    console.log("🔍 InputTransaksiPage - formRef.current:", formRef.current);
    
    if (formRef.current && formRef.current.handleEdit) {
      console.log("🔍 InputTransaksiPage - Calling formRef.current.handleEdit");
      formRef.current.handleEdit(transaksi);
    } else {
      console.error("❌ InputTransaksiPage - formRef.current.handleEdit is not available");
      console.error("❌ InputTransaksiPage - formRef.current available methods:", formRef.current ? Object.keys(formRef.current) : "No ref");
    }
  }, []);

  // ✅ ADD: Component mount debug
  useEffect(() => {
    console.log("🎯 InputTransaksiPage mounted");
    console.log("🔍 Initial state:", {
      selectedCOA,
      refreshTable,
      formRef: formRef.current
    });

    return () => {
      console.log("🎯 InputTransaksiPage unmounted");
    };
  }, []);

  return (
    <InputTransaksiLayout>
      {/* ✅ ADD: Debug info di UI */}
      <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-4 text-xs">
        <strong>Debug Info:</strong> selectedCOA = "{selectedCOA}" | refreshTable = {refreshTable.toString()} | shouldJump = {shouldJumpToLatest.toString()} | latestData = {latestTransaksiData?.noTransaksi || 'none'}
      </div>
      
      <InputTransaksiForm 
        ref={formRef}
        onCOAChange={handleCOAChange}
        afterSubmit={handleAfterSubmit}
      />
      <InputTransaksiTable 
        selectedCOA={selectedCOA}
        refresh={refreshTable} 
        shouldJumpToLatest={shouldJumpToLatest}
        latestTransaksiData={latestTransaksiData} // ✅ ADD: Pass latest data
        onJumpCompleted={handleJumpCompleted}
        onRowDoubleClick={handleRowDoubleClick}
      />
    </InputTransaksiLayout>
  );
}