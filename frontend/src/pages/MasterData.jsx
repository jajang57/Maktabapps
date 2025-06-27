import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function MasterData() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Master Data</h1>
        <Button>+ Tambah Data</Button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm border rounded-lg overflow-hidden">
          <thead className="bg-gray-100 dark:bg-gray-800">
            <tr>
              <th className="text-left px-4 py-2">Kode</th>
              <th className="text-left px-4 py-2">Nama</th>
              <th className="text-left px-4 py-2">Kategori</th>
              <th className="text-left px-4 py-2">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {[
              { kode: "001", nama: "Kas", kategori: "Aktiva" },
              { kode: "002", nama: "Bank BCA", kategori: "Aktiva" },
              { kode: "101", nama: "Penjualan", kategori: "Pendapatan" },
            ].map((item, i) => (
              <tr key={i} className="border-t dark:border-gray-700">
                <td className="px-4 py-2">{item.kode}</td>
                <td className="px-4 py-2">{item.nama}</td>
                <td className="px-4 py-2">{item.kategori}</td>
                <td className="px-4 py-2">
                  <Button size="sm" variant="outline" className="mr-2">Edit</Button>
                  <Button size="sm" variant="destructive">Hapus</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}