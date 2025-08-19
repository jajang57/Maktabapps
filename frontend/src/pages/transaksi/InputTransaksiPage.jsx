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
  useEffect(() => { }, [selectedCOA]);

  useEffect(() => {
   
  }, [refreshTable]);

  // ✅ ENHANCED: handleAfterSubmit dengan data context
  const handleAfterSubmit = useCallback((coaId, transaksiData = null, deletedData = null) => {
    console.log("🔍 TEMP DEBUG - handleAfterSubmit called with:", { coaId, transaksiData, deletedData });
    
    if (deletedData) {
      // Handle delete case
      console.log("🗑️ Transaction deleted:", deletedData);
      // Tidak perlu set latestTransaksiData untuk delete
      setLatestTransaksiData(null);
      setShouldJumpToLatest(false);
    } else if (transaksiData) {
      // Handle create/update case
      console.log("💾 Transaction saved:", transaksiData);
      console.log("🔍 TEMP DEBUG - Setting latestTransaksiData to:", transaksiData);
      setLatestTransaksiData(transaksiData);
      setShouldJumpToLatest(true);
    }
    
    // Trigger refresh table
    console.log("🔄 TEMP DEBUG - Triggering table refresh, current refreshTable:", refreshTable);
    setRefreshTable((r) => {
      console.log("🔄 TEMP DEBUG - refreshTable changing from", r, "to", !r);
      return !r;
    });
    
  }, []);

  // ✅ ADD: Reset jump flag setelah table handle
  const handleJumpCompleted = useCallback(() => {
    setShouldJumpToLatest(false);
    setLatestTransaksiData(null);
  }, []);

  const handleCOAChange = useCallback((coaId) => {
 
    
    // ✅ ENHANCED: Validate coaId before setting
    if (coaId && coaId !== "") {
      
      setSelectedCOA(coaId);
    } else {
      
      setSelectedCOA("");
    }
  }, []);

  const handleRowDoubleClick = useCallback((transaksi) => {
    if (formRef.current && formRef.current.handleEdit) {
       formRef.current.handleEdit(transaksi);
    } else { }
  }, []);

  // ✅ ADD: Component mount debug
  useEffect(() => {
   
    return () => {
    };
  }, []);

  return (
    <InputTransaksiLayout>
      {/* ✅ ADD: Debug info di UI */}
      {/* <div className="bg-yellow-50 border border-yellow-200 p-2 rounded mb-4 text-xs">
        <strong>Debug Info:</strong> selectedCOA = "{selectedCOA}" | refreshTable = {refreshTable.toString()} | shouldJump = {shouldJumpToLatest.toString()} | latestData = {latestTransaksiData?.noTransaksi || 'none'}
      </div> */}
      
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