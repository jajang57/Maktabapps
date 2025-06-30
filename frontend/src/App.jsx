import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MasterItem from "./pages/master-data/MasterItem";
import MasterCOA from "./pages/master-data/MasterCOA";
import MasterCategoryCOA from "./pages/master-data/MasterCategoryCOA";
import Setting from "./pages/Setting";
import Transaksi from "./pages/Transaksi";
import JurnalUmum from "./pages/transaksi/JurnalUmum";
import Pembelian from "./pages/transaksi/Pembelian";
import Penjualan from "./pages/transaksi/Penjualan";
import InputTransaksiPage from "./pages/transaksi/InputTransaksiPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
          <Route path="/transaksi/jurnal-umum" element={
            <ProtectedRoute>
              <Layout>
                <JurnalUmum />
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
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}