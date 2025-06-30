import React, { useState } from "react";
import InputTransaksiForm from "./InputTransaksiForm";
import InputTransaksiTable from "./InputTransaksiTable";
import InputTransaksiLayout from "../../layout/InputTransaksiLayout";

export default function InputTransaksi() {
  const [selectedCOA, setSelectedCOA] = useState("");
  const [refreshTable, setRefreshTable] = useState(false);

  // Fungsi ini dipanggil setelah simpan data di form
  const handleAfterSubmit = () => {
    setRefreshTable((r) => !r); // toggle untuk trigger refresh di tabel
  };

  return (
    <InputTransaksiLayout>
      <InputTransaksiForm
        onCOAChange={setSelectedCOA}
        afterSubmit={handleAfterSubmit}
      />
      <InputTransaksiTable selectedCOA={selectedCOA} refresh={refreshTable} />
    </InputTransaksiLayout>
  );
}
