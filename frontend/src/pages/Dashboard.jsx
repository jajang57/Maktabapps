import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { motion } from "framer-motion";
import MasterCard from "../master_fn/MasterCard";

const chartData = [
  { month: "Jan", income: 17000, expense: 15000 },
  { month: "Feb", income: 18000, expense: 16000 },
  { month: "Mar", income: 17500, expense: 17000 },
  { month: "Apr", income: 18500, expense: 16500 },
  { month: "May", income: 19000, expense: 18000 },
  { month: "Jun", income: 17000, expense: 19500 },
  { month: "Jul", income: 16000, expense: 17000 },
  { month: "Aug", income: 17500, expense: 18000 },
  { month: "Sep", income: 18500, expense: 17500 },
  { month: "Oct", income: 19000, expense: 18500 },
  { month: "Nov", income: 18000, expense: 19000 },
  { month: "Dec", income: 20000, expense: 19500 },
];

const pieData = [
  { name: "Apparel", value: 800, color: "#7C3AED" },
  { name: "Sports", value: 700, color: "#F59E42" },
  { name: "Others", value: 492, color: "#F43F5E" },
];

const summaryData = [
  { label: "Income", value: 92600, color: "#7C3AED" },
  { label: "Profit", value: 37615, color: "#22C55E" },
  { label: "Expenses", value: 65085, color: "#F43F5E" },
];

const recentActivities = [
  { text: "Updated Server Logs", color: "#6366F1", time: "Just Now" },
  { text: "Send Mail to HR and Admin", color: "#22C55E", time: "2 min ago" },
  { text: "Backup Files EOD", color: "#F59E42", time: "14:00" },
  { text: "Collect documents from Sara", color: "#6366F1", time: "18:00" },
  { text: "Conference call with Marketing Manager.", color: "#F59E42", time: "17:00" },
  { text: "Rebooted Server", color: "#6366F1", time: "18:00" },
  { text: "Send contract details to Freelancer", color: "#6366F1", time: "17:00" },
];

const transactions = [
  { name: "StarCode Kh", date: "10 Jan 1:00PM", amount: "+$36.11", color: "#22C55E" },
  { name: "Cash withdrawal", date: "04 Jan 1:00PM", amount: "-$16.44", color: "#F43F5E" },
  { name: "Amy Diaz", date: "10 Jan 1:00PM", amount: "+$66.44", color: "#22C55E" },
  { name: "Netflix", date: "10 Jan 1:00PM", amount: "-$32.00", color: "#F43F5E" },
  { name: "Daisy Anderson", date: "10 Jan 1:00PM", amount: "+$10.08", color: "#22C55E" },
];

export default function Dashboard() {
  // Pie chart color
  const COLORS = useMemo(() => pieData.map(d => d.color), []);

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold tracking-tight">Dashboard Keuangan</h1>

      {/* Top Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          <h2 className="font-semibold text-lg mb-1">Revenue</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-gray-500">Total Profit</span>
            <span className="text-indigo-600 font-semibold">$10,840</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#6366F1" strokeWidth={2} dot={false} name="Income" />
              <Line type="monotone" dataKey="expense" stroke="#F43F5E" strokeWidth={2} dot={false} name="Expenses" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {/* Sales By Category */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center justify-center">
          <h2 className="font-semibold text-lg mb-2">Sales By Category</h2>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center mt-2">
            <span className="text-2xl font-bold">1992</span>
            <div className="text-xs text-gray-500">Total</div>
          </div>
        </div>
      </div>

      {/* Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Sales */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Daily Sales</span>
            <span className="bg-yellow-100 text-yellow-600 rounded-full px-2 py-1 text-xs flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              $
            </span>
          </div>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData.slice(0, 7)}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="income" stroke="#F59E42" strokeWidth={6} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-400 mt-1">Go to columns for details.</div>
        </div>
        {/* Summary */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col justify-between">
          <span className="font-semibold mb-2">Summary</span>
          <div className="space-y-2">
            {summaryData.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-sm font-medium w-20">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded h-3 mx-2 overflow-hidden">
                  <div
                    className="h-3 rounded"
                    style={{
                      width: `${Math.min(item.value / 1000, 100)}%`,
                      background: item.color,
                      transition: "width 1s"
                    }}
                  />
                </div>
                <span className="text-xs font-bold">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Orders Chart */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold">Orders</span>
            <span className="text-indigo-600 font-bold text-lg">3,192</span>
          </div>
          <ResponsiveContainer width="100%" height={60}>
            <LineChart data={chartData.slice(0, 7)}>
              <XAxis dataKey="month" hide />
              <YAxis hide />
              <Tooltip />
              <Line type="monotone" dataKey="expense" stroke="#6366F1" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
          <div className="text-xs text-gray-400 mt-1">Total Orders</div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-4">
          <span className="font-semibold mb-2 block">Recent Activities</span>
          <ul className="text-xs space-y-2">
            {recentActivities.map((act, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: act.color }} />
                <span>{act.text}</span>
                <span className="ml-auto text-gray-400">{act.time}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Transactions */}
        <div className="bg-white rounded-lg shadow p-4">
          <span className="font-semibold mb-2 block">Transactions</span>
          <ul className="text-xs space-y-2">
            {transactions.map((trx, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-indigo-600">{trx.name[0]}</span>
                <span className="flex-1">{trx.name}</span>
                <span className="text-gray-400">{trx.date}</span>
                <span className="font-bold" style={{ color: trx.color }}>{trx.amount}</span>
              </li>
            ))}
          </ul>
        </div>
        {/* Wallet Balance */}
        <div className="bg-gradient-to-r from-indigo-500 to-blue-400 rounded-lg shadow p-4 text-white flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-700 font-bold">SC</span>
            <span className="font-semibold">StarCode Kh</span>
          </div>
          <div className="text-lg font-bold">Wallet Balance</div>
          <div className="text-2xl font-bold mb-2">$2953</div>
          <div className="flex gap-2">
            <div className="flex-1 bg-white bg-opacity-20 rounded p-2">
              <div className="text-xs">Received</div>
              <div className="font-bold">$97.99</div>
            </div>
            <div className="flex-1 bg-white bg-opacity-20 rounded p-2">
              <div className="text-xs">Spent</div>
              <div className="font-bold">$53.00</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}