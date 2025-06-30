import React, { useState, useCallback, useRef } from "react";
import InputTransaksiForm from "./InputTransaksiForm";
import InputTransaksiTable from "./InputTransaksiTable";
import InputTransaksiLayout from "../../layout/InputTransaksiLayout";

export default function InputTransaksiPage() {
  const [selectedCOA, setSelectedCOA] = useState("");
  const [refreshTable, setRefreshTable] = useState(false);
  const formRef = useRef();

  const handleAfterSubmit = useCallback(() => {
    setRefreshTable((r) => !r); // toggle untuk trigger useEffect di tabel
  }, []);

  const handleCOAChange = useCallback((coaId) => {
    setSelectedCOA(coaId);
  }, []);

  const handleRowDoubleClick = useCallback((transaksi) => {
    console.log("InputTransaksiPage - handleRowDoubleClick called with:", transaksi);
    console.log("InputTransaksiPage - formRef.current:", formRef.current);
    if (formRef.current && formRef.current.handleEdit) {
      console.log("InputTransaksiPage - Calling formRef.current.handleEdit");
      formRef.current.handleEdit(transaksi);
    } else {
      console.error("InputTransaksiPage - formRef.current.handleEdit is not available");
    }
  }, []);

  return (
    <InputTransaksiLayout>
      <InputTransaksiForm 
        ref={formRef}
        onCOAChange={handleCOAChange}
        afterSubmit={handleAfterSubmit}
      />
      <InputTransaksiTable 
        selectedCOA={selectedCOA}
        refresh={refreshTable} 
        onRowDoubleClick={handleRowDoubleClick}
      />
    </InputTransaksiLayout>
  );
}