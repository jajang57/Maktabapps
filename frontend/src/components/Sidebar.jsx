import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-gray-800 text-white p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Menu</h2>
      <nav className="flex flex-col space-y-2">
        <Link to="/dashboard" className="hover:bg-gray-700 px-3 py-2 rounded">Dashboard</Link>
        <Link to="/master-data" className="hover:bg-gray-700 px-3 py-2 rounded">Master Data</Link>
        <Link to="/setting" className="hover:bg-gray-700 px-3 py-2 rounded">Setting</Link>
      </nav>
    </div>
  );
}