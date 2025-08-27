import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import SingleDeviceAlert from "./components/SingleDeviceAlert";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MasterItem from "./pages/master-data/MasterItem";
import MasterCOA from "./pages/master-data/MasterCOA";
import MasterCategoryCOA from "./pages/master-data/MasterCategoryCOA";
import MasterPemasok from "./pages/master-data/MasterPemasok";
import MasterPembeli from "./pages/master-data/MasterPembeli";
import MasterKaryawan from "./pages/master-data/MasterKaryawan";
import MasterProject from "./pages/master-data/MasterProject";
import MasterBarangJasa from "./pages/master-data/MasterBarangJasa";
import MasterGudang from "./pages/master-data/MasterGudang";
import Setting from "./pages/Setting";
import TrialBalance from "./pages/laporan/TrialBalance";
import BukuBesar from "./pages/laporan/BukuBesar";
import Transaksi from "./pages/Transaksi";
import AJE from "./pages/transaksi/AJE";
import Pembelian from "./pages/transaksi/Pembelian";
import Penjualan from "./pages/transaksi/Penjualan";
import InputTransaksiPage from "./pages/transaksi/InputTransaksiPage";
import TransaksiGL from "./pages/transaksi/AgGridTransaksiGL";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SingleDeviceAlert />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/item" element={
              <ProtectedRoute>
                <Layout>
                  <MasterItem />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/coa" element={
              <ProtectedRoute>
                <Layout>
                  <MasterCOA />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/mastercatcoa" element={
              <ProtectedRoute>
                <Layout>
                  <MasterCategoryCOA />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/pemasok" element={
              <ProtectedRoute>
                <Layout>
                  <MasterPemasok />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/pembeli" element={
              <ProtectedRoute>
                <Layout>
                  <MasterPembeli />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/project" element={
              <ProtectedRoute>
                <Layout>
                  <MasterProject />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/karyawan" element={
              <ProtectedRoute>
                <Layout>
                  <MasterKaryawan />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/barang-jasa" element={
              <ProtectedRoute>
                <Layout>
                  <MasterBarangJasa />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/setting" element={
              <ProtectedRoute>
                <Layout>
                  <Setting />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transaksi" element={
              <ProtectedRoute>
                <Layout>
                  <Transaksi />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transaksi/AJE" element={
              <ProtectedRoute>
                <Layout>
                  <AJE />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transaksi/pembelian" element={
              <ProtectedRoute>
                <Layout>
                  <Pembelian />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transaksi/penjualan" element={
              <ProtectedRoute>
                <Layout>
                  <Penjualan />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/input-transaksi" element={
              <ProtectedRoute>
                <Layout>
                  <InputTransaksiPage />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/transaksi/gl" element={
              <ProtectedRoute>
                <Layout>
                  <TransaksiGL />
                </Layout>
              </ProtectedRoute>
            } />
              <Route path="/laporan/trial-balance" element={
              <ProtectedRoute>
                <Layout>
                  <TrialBalance />
                </Layout>
              </ProtectedRoute>
            } />
              <Route path="/laporan/Buku-Besar" element={
              <ProtectedRoute>
                <Layout>
                  <BukuBesar />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/master-data/gudang" element={
              <ProtectedRoute>
                <Layout>
                  <MasterGudang />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Catch all route - redirect to login if not authenticated */}
            <Route path="*" element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}