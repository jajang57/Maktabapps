import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./layout/Layout";
import Dashboard from "./pages/Dashboard";
import MasterItem from "./pages/master-data/MasterItem";
import MasterCOA from "./pages/master-data/MasterCOA";
import MasterCategoryCOA from "./pages/master-data/MasterCategoryCOA";
import Setting from "./pages/Setting";
import Transaksi from "./pages/Transaksi";
import JurnalUmum from "./pages/transaksi/JurnalUmum";
import Pembelian from "./pages/transaksi/Pembelian";
import Penjualan from "./pages/transaksi/Penjualan";
import InputTransaksi from "./pages/InputTransaksi";

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/master-data/item" element={<MasterItem />} />
          <Route path="/master-data/coa" element={<MasterCOA />} />
          <Route path="/master-data/mastercatcoa" element={<MasterCategoryCOA />} />
          <Route path="/setting" element={<Setting />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/transaksi/jurnal-umum" element={<JurnalUmum />} />
          <Route path="/transaksi/pembelian" element={<Pembelian />} />
          <Route path="/transaksi/penjualan" element={<Penjualan />} />
          <Route path="/input-transaksi" element={<InputTransaksi />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}