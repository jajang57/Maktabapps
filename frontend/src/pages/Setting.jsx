import { useState, useEffect } from "react";
import MasterButton from "../master_fn/MasterButton";

const defaultTheme = {
  buttonSimpan: "#22c55e",
  buttonHapus: "#ef4444",
  buttonUpdate: "#f59e42",
  buttonRefresh: "#6366f1",
  cardColor: "#ffffff",
  dropdownColor: "#f3f4f6",
  backgroundColor: "#f9fafb",
  menuPosition: "top",
  tableHeaderColor: "#e0e7ff",
  buttonShape: "default", // tambahkan default shape
  fontFamily: "Inter, Arial, sans-serif",
  fontColor: "#222222",
  formColor: "#ffffff", // Tambahkan warna form
};

const fontOptions = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Poppins", value: "Poppins, Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

export default function Setting() {
  const [theme, setTheme] = useState(defaultTheme);

  // Load setting dari backend saat komponen mount
  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/user-theme-setting`, {
          credentials: "include",
        });
        const data = await res.json();
        if (data.theme) {
          setTheme((prev) => ({
            ...prev,
            ...data.theme,
          }));
        }
      } catch (err) {
        // Optional: tampilkan error jika perlu
      }
    };
    fetchTheme();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTheme((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/user-theme-setting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(theme),
      });
      if (res.ok) {
        alert("Pengaturan berhasil disimpan!");
      } else {
        alert("Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      alert("Terjadi error saat menyimpan pengaturan.");
    }
  };

  // Preview bentuk button
  const buttonShapes = [
    { label: "Default", value: "default" },
    { label: "Rounded", value: "rounded" },
    { label: "Outline", value: "outline" },
    { label: "Block", value: "block" },
  ];

  return (
    <div className="max-w-10xl mx-auto py-10 px-2 w-full">
      {/* Card Pengaturan */}
      <div
        className="rounded-xl shadow-lg border p-8 mb-8 w-full"
        style={{
          background: theme.cardColor,
          fontFamily: theme.fontFamily,
          color: theme.fontColor,
        }}
      >
        {/* Grid 3 kolom: Button | Font & Menu | Warna */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Grid 1: Warna Button */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold text-gray-700 mb-3">Warna Button</div>
            {[
              { label: "Button Simpan", name: "buttonSimpan" },
              { label: "Button Edit", name: "buttonUpdate" },
              { label: "Button Hapus", name: "buttonHapus" },
              { label: "Button Refresh", name: "buttonRefresh" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 mb-3">
                <label className="w-24 font-medium text-gray-600">{item.label}</label>
                <input
                  type="color"
                  name={item.name}
                  value={theme[item.name]}
                  onChange={handleChange}
                  className="w-8 h-8 rounded border-2 border-gray-200 shadow"
                />
                <span
                  className="inline-block w-10 h-6 rounded border"
                  style={{ background: theme[item.name], borderColor: "#e5e7eb" }}
                />
                <span className="ml-2 text-xs text-gray-500">{theme[item.name]}</span>
              </div>
            ))}
          </div>
          {/* Grid 2: Bentuk & Preview Button */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold text-gray-700 mb-3">Bentuk & Preview Button</div>
            <div className="flex gap-3 flex-wrap mb-4">
              {buttonShapes.map((shape) => (
                <label key={shape.value} className="flex flex-col items-center cursor-pointer">
                  <MasterButton
                    type="simpan"
                    variant={shape.value === "outline" ? "outline" : "solid"}
                    shape={shape.value}
                    size="md"
                    className={theme.buttonShape === shape.value ? "ring-2 ring-blue-400" : ""}
                    style={{ marginBottom: 4 }}
                  >
                    {shape.label}
                  </MasterButton>
                  <input
                    type="radio"
                    name="buttonShape"
                    value={shape.value}
                    checked={theme.buttonShape === shape.value}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <MasterButton type="simpan" shape={theme.buttonShape} style={{ background: theme.buttonSimpan, color: "#fff" }}>Simpan</MasterButton>
              <MasterButton type="edit" shape={theme.buttonShape} style={{ background: theme.buttonUpdate, color: "#fff" }}>Edit</MasterButton>
              <MasterButton type="hapus" shape={theme.buttonShape} style={{ background: theme.buttonHapus, color: "#fff" }}>Hapus</MasterButton>
              <MasterButton type="refresh" shape={theme.buttonShape} style={{ background: theme.buttonRefresh, color: "#fff" }}>Refresh</MasterButton>
            </div>
          </div>
          {/* Grid 3: Font & Menu */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold text-gray-700 mb-3">Font & Menu</div>
            <div className="flex items-center gap-3 mb-4">
              <label className="w-28 font-medium text-gray-600">Bentuk Font</label>
              <select
                name="fontFamily"
                value={theme.fontFamily}
                onChange={handleChange}
                className="border rounded px-3 py-2 bg-gray-50"
                style={{ fontFamily: theme.fontFamily }}
              >
                {fontOptions.map((font) => (
                  <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <label className="w-28 font-medium text-gray-600">Warna Font</label>
              <input
                type="color"
                name="fontColor"
                value={theme.fontColor}
                onChange={handleChange}
                className="w-8 h-8 rounded border-2 border-gray-200 shadow"
              />
              <span
                className="inline-block w-10 h-6 rounded border"
                style={{ background: theme.fontColor, borderColor: "#e5e7eb" }}
              />
              <span className="ml-2 text-xs text-gray-500">{theme.fontColor}</span>
            </div>
            <div className="flex items-center gap-3">
              <label className="w-28 font-medium text-gray-600">Posisi Menu</label>
              <select
                name="menuPosition"
                value={theme.menuPosition}
                onChange={handleChange}
                className="border rounded px-3 py-2 bg-gray-50"
              >
                <option value="top">Top Navbar</option>
                <option value="side">Side Navbar</option>
              </select>
            </div>
          </div>
          {/* Grid 4: Warna Tampilan */}
          <div className="border rounded-lg p-4">
            <div className="font-semibold text-gray-700 mb-3">Warna Tampilan</div>
            {[
              { label: "Card", name: "cardColor" },
              { label: "Background", name: "backgroundColor" },
              { label: "Form", name: "formColor" },
              { label: "Dropdown", name: "dropdownColor" },
              { label: "Header Tabel", name: "tableHeaderColor" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-3 mb-3">
                <label className="w-24 font-medium text-gray-600">{item.label}</label>
                <input
                  type="color"
                  name={item.name}
                  value={theme[item.name]}
                  onChange={handleChange}
                  className="w-8 h-8 rounded border-2 border-gray-200 shadow"
                />
                <span
                  className="inline-block w-10 h-6 rounded border"
                  style={{ background: theme[item.name], borderColor: "#e5e7eb" }}
                />
                <span className="ml-2 text-xs text-gray-500">{theme[item.name]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end pt-6">
          <MasterButton
            type="simpan"
            shape={theme.buttonShape}
            onClick={handleSave}
          >
            Simpan Pengaturan
          </MasterButton>
        </div>
      </div>
      {/* Card Preview Miniatur */}
      <div
        className="rounded-xl shadow-lg border p-6 flex flex-col items-center"
        style={{
          background: theme.cardColor,
          fontFamily: theme.fontFamily,
          color: theme.fontColor,
        }}
      >
        <div className="mb-4 font-semibold text-gray-600 text-center">Preview Miniatur</div>
        <div
          className="rounded-lg shadow border overflow-hidden w-full"
          style={{
            background: theme.backgroundColor,
            fontFamily: theme.fontFamily,
            color: theme.fontColor,
            minHeight: 220,
            maxWidth: 520,
            margin: "auto"
          }}
        >
          {theme.menuPosition === "side" ? (
            // Side Navbar
            <div className="flex h-full">
              {/* Sidebar */}
              <div
                className="flex flex-col items-center py-6 px-2"
                style={{
                  background: theme.cardColor,
                  borderRight: `1px solid ${theme.dropdownColor}`,
                  minWidth: 80,
                  minHeight: 220,
                }}
              >
                <span className="font-bold text-lg tracking-tight mb-4">Temui</span>
                <button
                  className="rounded-full p-1 mb-2"
                  style={{ background: theme.buttonRefresh }}
                  title="Refresh"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 1 19 5.635" />
                  </svg>
                </button>
                <button
                  className="rounded-full p-1"
                  style={{ background: theme.buttonHapus }}
                  title="Delete"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Main Content */}
              <div className="flex-1">
                {/* Card */}
                <div
                  className="m-4 rounded-lg shadow p-4"
                  style={{ background: theme.cardColor }}
                >
                  <div className="font-semibold mb-2" style={{ color: theme.fontColor }}>Judul Card</div>
                  <div className="mb-3 text-sm" style={{ color: theme.fontColor }}>Ini contoh isi card preview.</div>
                </div>
                {/* Button Preview */}
                <div className="flex gap-2 px-4 pb-2">
                  <button
                    className={`px-3 py-1 font-semibold text-white`}
                    style={{
                      background: theme.buttonSimpan,
                      borderRadius: theme.buttonShape === "rounded" ? 999 : 6,
                      border: theme.buttonShape === "outline" ? `2px solid ${theme.buttonSimpan}` : "none",
                      color: theme.buttonShape === "outline" ? theme.buttonSimpan : "#fff",
                      width: theme.buttonShape === "block" ? "100%" : undefined,
                    }}
                  >
                    Simpan
                  </button>
                  <button
                    className={`px-3 py-1 font-semibold text-white`}
                    style={{
                      background: theme.buttonUpdate,
                      borderRadius: theme.buttonShape === "rounded" ? 999 : 6,
                      border: theme.buttonShape === "outline" ? `2px solid ${theme.buttonUpdate}` : "none",
                      color: theme.buttonShape === "outline" ? theme.buttonUpdate : "#fff",
                      width: theme.buttonShape === "block" ? "100%" : undefined,
                    }}
                  >
                    Edit
                  </button>
                </div>
                {/* Label */}
                <div className="px-4 pb-4">
                  <label
                    className="block font-medium mb-1"
                    style={{ color: theme.fontColor }}
                  >
                    Label Form
                  </label>
                  <input
                    type="text"
                    className="w-full px-2 py-1 rounded border"
                    style={{
                      background: theme.formColor,
                      color: theme.fontColor,
                      borderColor: theme.dropdownColor,
                      fontFamily: theme.fontFamily,
                    }}
                    placeholder="Input preview"
                    disabled
                  />
                </div>
              </div>
            </div>
          ) : (
            // Top Navbar (default)
            <>
              {/* Header/Navbar */}
              <div
                className="flex items-center justify-between px-4 py-2"
                style={{
                  background: theme.cardColor,
                  borderBottom: `1px solid ${theme.dropdownColor}`,
                }}
              >
                <span className="font-bold text-lg tracking-tight">Temui</span>
                <div className="flex gap-2">
                  <button
                    className="rounded-full p-1"
                    style={{ background: theme.buttonRefresh }}
                    title="Refresh"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19A9 9 0 1 1 19 5.635" />
                    </svg>
                  </button>
                  <button
                    className="rounded-full p-1"
                    style={{ background: theme.buttonHapus }}
                    title="Delete"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              {/* Card */}
              <div
                className="m-4 rounded-lg shadow p-4"
                style={{ background: theme.cardColor }}
              >
                <div className="font-semibold mb-2" style={{ color: theme.fontColor }}>Judul Card</div>
                <div className="mb-3 text-sm" style={{ color: theme.fontColor }}>Ini contoh isi card preview.</div>
              </div>
              {/* Button Preview */}
              <div className="flex gap-2 px-4 pb-2">
                <button
                  className={`px-3 py-1 font-semibold text-white`}
                  style={{
                    background: theme.buttonSimpan,
                    borderRadius: theme.buttonShape === "rounded" ? 999 : 6,
                    border: theme.buttonShape === "outline" ? `2px solid ${theme.buttonSimpan}` : "none",
                    color: theme.buttonShape === "outline" ? theme.buttonSimpan : "#fff",
                    width: theme.buttonShape === "block" ? "100%" : undefined,
                  }}
                >
                  Simpan
                </button>
                <button
                  className={`px-3 py-1 font-semibold text-white`}
                  style={{
                    background: theme.buttonUpdate,
                    borderRadius: theme.buttonShape === "rounded" ? 999 : 6,
                    border: theme.buttonShape === "outline" ? `2px solid ${theme.buttonUpdate}` : "none",
                    color: theme.buttonShape === "outline" ? theme.buttonUpdate : "#fff",
                    width: theme.buttonShape === "block" ? "100%" : undefined,
                  }}
                >
                  Edit
                </button>
              </div>
              {/* Label */}
              <div className="px-4 pb-4">
                <label
                  className="block font-medium mb-1"
                  style={{ color: theme.fontColor }}
                >
                  Label Form
                </label>
                <input
                  type="text"
                  className="w-full px-2 py-1 rounded border"
                  style={{
                    background: theme.formColor,
                    color: theme.fontColor,
                    borderColor: theme.dropdownColor,
                    fontFamily: theme.fontFamily,
                  }}
                  placeholder="Input preview"
                  disabled
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}