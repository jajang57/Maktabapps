import React, { useState } from "react";
import InputTransaksiForm from "../components/InputTransaksiForm";
import InputTransaksiTable from "../components/InputTransaksiTable";

export default function InputTransaksiPage() {
  const [selectedCOA, setSelectedCOA] = useState("");
  const [refreshTable, setRefreshTable] = useState(false);

  const handleAfterSubmit = () => {
    setRefreshTable((r) => !r); // toggle untuk trigger useEffect di tabel
  };

  return (
    <>
      <InputTransaksiForm afterSubmit={handleAfterSubmit} />
      <InputTransaksiTable refresh={refreshTable} />
    </>
  );
}