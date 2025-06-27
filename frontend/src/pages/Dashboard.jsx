import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Pemasukan</p>
            <p className="text-xl font-semibold text-green-600">Rp 10.000.000</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
            <p className="text-xl font-semibold text-red-500">Rp 4.000.000</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Transaksi</p>
            <p className="text-xl font-semibold">245</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Saldo Bersih</p>
            <p className="text-xl font-semibold">Rp 6.000.000</p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow">
        <p className="text-sm text-muted-foreground mb-2">Grafik Ringkasan (Dummy)</p>
        <div className="h-40 bg-gradient-to-r from-indigo-400 to-purple-600 rounded" />
      </div>
    </div>
  );
}