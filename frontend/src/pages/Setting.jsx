import { useState, useEffect } from "react";
import MasterButton from "../master_fn/MasterButton";

const defaultThemeDark = {
  themeMode: "dark",
  buttonSimpan: "#4361ee",
  buttonHapus: "#e60505",
  buttonUpdate: "#0d0de3",
  buttonRefresh: "#2d2d2e",
  cardColor: "#182439",
  dropdownColor: "#fafcff",
  backgroundColor: "#14172a",
  menuPosition: "side",
  tableHeaderColor: "#4159af",
  tableBodyColor: "#283a5c",
  tableFontFamily: "Inter, Arial, sans-serif",
  tableFontColor: "#dedede",
  buttonShape: "default",
  fontFamily: "Inter, Arial, sans-serif",
  fontColor: "#f8f7f7",
  formColor: "#28394d",
  fieldColor: "#2b394d",
  appHeaderColor: "#121e32",
  headerIconBgColor: "#24395c",
};

const defaultThemeLight = {
  themeMode: "light",
  buttonSimpan: "#22c55e",
  buttonHapus: "#ef4444",
  buttonUpdate: "#f59e42",
  buttonRefresh: "#6366f1",
  cardColor: "#ffffff",
  dropdownColor: "#f3f4f6",
  backgroundColor: "#f9fafb",
  menuPosition: "side",
  tableHeaderColor: "#e0e7ff",
  tableBodyColor: "#ffffff",
  tableFontFamily: "Inter, Arial, sans-serif",
  tableFontColor: "#222222",
  buttonShape: "default",
  fontFamily: "Inter, Arial, sans-serif",
  fontColor: "#222222",
  formColor: "#ffffff",
  fieldColor: "#f3f4f6",
  appHeaderColor: "#ece9b7",
  headerIconBgColor: "#ffffff",
};

const fontOptions = [
  { label: "Inter", value: "Inter, Arial, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Poppins", value: "Poppins, Arial, sans-serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" },
];

const tableFontOptions = fontOptions; // gunakan fontOptions untuk tabel

export default function Setting() {
  const [theme, setTheme] = useState(defaultThemeDark);

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

  // Handler untuk ganti mode theme
  const handleThemeModeChange = (e) => {
    const mode = e.target.value;
    setTheme(mode === "dark" ? defaultThemeDark : defaultThemeLight);
  };

  // Preview bentuk button
  const buttonShapes = [
    { label: "Default", value: "default" },
    { label: "Rounded", value: "rounded" },
    { label: "Outline", value: "outline" },
    { label: "Block", value: "block" },
  ];

  return (
    <div className="max-w-7xl mx-auto py-10 px-2 w-full h-full">
      <div className="mb-6 flex gap-4 items-center">
        <label className="font-semibold" style={{ color: theme.fontColor }}>Mode Theme</label>
        <select
          name="themeMode"
          value={theme.themeMode}
          onChange={handleThemeModeChange}
          className="border rounded px-3 py-2"
          style={{ background: theme.cardColor, color: theme.fontColor, fontFamily: theme.fontFamily }}
        >
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>
      <div
        className="
          grid
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
          gap-6
        "
      >
        {/* Card Warna Button */}
        <div className="border rounded-lg p-4" style={{ background: theme.cardColor }}>
          <div className="font-semibold text-gray-700 mb-3" style={{ color: theme.fontColor }}>Warna Button</div>
          {[
            { label: "Button Simpan", name: "buttonSimpan" },
            { label: "Button Edit", name: "buttonUpdate" },
            { label: "Button Hapus", name: "buttonHapus" },
            { label: "Button Refresh", name: "buttonRefresh" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-3 mb-3">
              <label
                className="w-24 font-medium text-gray-600"
                style={{ color: theme.fontColor }}
              >
                {item.label}
              </label>
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
        {/* Card Bentuk & Preview Button */}
        <div className="border rounded-lg p-4" style={{ background: theme.cardColor }}>
          <div className="font-semibold text-gray-700 mb-3" style={{ color: theme.fontColor }}>Bentuk & Preview Button</div>
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
        {/* Card Font & Menu */}
        <div className="border rounded-lg p-4" style={{ background: theme.cardColor }}>
          <div className="font-semibold text-gray-700 mb-3" style={{ color: theme.fontColor }}>Font & Menu</div>
          <div className="flex items-center gap-3 mb-4" >
            <label
             className="w-full sm:w-auto"
            style={{ color: theme.fontColor }}
          >
            Bentuk Font
          </label>
          <select
            name="fontFamily"
            value={theme.fontFamily}
            onChange={handleChange}
             className="w-full sm:w-auto"
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
          <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Warna Font</label>
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
          <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Posisi Menu</label>
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
        {/* Card Warna Tampilan */}
        <div className="border rounded-lg p-4" style={{ background: theme.cardColor }}>
          <div className="font-semibold text-gray-700 mb-3" style={{ color: theme.fontColor }}>Warna Tampilan</div>
          {[
            { label: "Card", name: "cardColor" },
            { label: "Background", name: "backgroundColor" },
            { label: "Form", name: "formColor" },
            { label: "Field", name: "fieldColor" }, // baru
            { label: "Dropdown", name: "dropdownColor" },
            { label: "Header Tabel", name: "tableHeaderColor" },
          ].map((item) => (
            <div key={item.name} className="flex items-center gap-3 mb-3" >
              <label className="w-24 font-medium text-gray-600" style={{ color: theme.fontColor }}>{item.label}</label>
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
        {/* Card Pengaturan Tabel */}
        <div className="border rounded-lg p-4" style={{ background: theme.cardColor }}>
          <div className="font-semibold text-gray-700 mb-3" style={{ color: theme.fontColor }}>Pengaturan Tabel</div>
          <div className="flex items-center gap-3 mb-4" >
            <label
              className="w-28 font-medium text-gray-600"
              style={{ color: theme.fontColor }}
            >
              Font Tabel
            </label>
            <select
              name="tableFontFamily"
              value={theme.tableFontFamily}
              onChange={handleChange}
              className="border rounded px-3 py-2 bg-gray-50"
              style={{ fontFamily: theme.tableFontFamily }}
            >
              {tableFontOptions.map((font) => (
                <option key={font.value} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Warna Font Tabel</label>
            <input
              type="color"
              name="tableFontColor"
              value={theme.tableFontColor}
              onChange={handleChange}
              className="w-8 h-8 rounded border-2 border-gray-200 shadow"
            />
            <span
              className="inline-block w-10 h-6 rounded border"
              style={{ background: theme.tableFontColor, borderColor: "#e5e7eb" }}
            />
            <span className="ml-2 text-xs text-gray-500">{theme.tableFontColor}</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Header Kolom</label>
            <input
              type="color"
              name="tableHeaderColor"
              value={theme.tableHeaderColor}
              onChange={handleChange}
              className="w-8 h-8 rounded border-2 border-gray-200 shadow"
            />
            <span
              className="inline-block w-10 h-6 rounded border"
              style={{ background: theme.tableHeaderColor, borderColor: "#e5e7eb" }}
            />
            <span className="ml-2 text-xs text-gray-500">{theme.tableHeaderColor}</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Body Kolom</label>
            <input
              type="color"
              name="tableBodyColor"
              value={theme.tableBodyColor}
              onChange={handleChange}
              className="w-8 h-8 rounded border-2 border-gray-200 shadow"
            />
            <span
              className="inline-block w-10 h-6 rounded border"
              style={{ background: theme.tableBodyColor, borderColor: "#e5e7eb" }}
            />
            <span className="ml-2 text-xs text-gray-500">{theme.tableBodyColor}</span>
          </div>
        </div>
        {/* Card Header Software */}
        <div className="border rounded-lg p-4" style={{ background: theme.cardColor }}>
          <div className="font-semibold text-gray-700 mb-3" style={{ color: theme.fontColor }}>Warna Header Software</div>
          <div className="flex items-center gap-3 mb-3">
            <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Header</label>
            <input
              type="color"
              name="appHeaderColor"
              value={theme.appHeaderColor}
              onChange={handleChange}
              className="w-8 h-8 rounded border-2 border-gray-200 shadow"
            />
            <span
              className="inline-block w-10 h-6 rounded border"
              style={{ background: theme.appHeaderColor, borderColor: "#e5e7eb" }}
            />
            <span className="ml-2 text-xs text-gray-500">{theme.appHeaderColor}</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="w-28 font-medium text-gray-600" style={{ color: theme.fontColor }}>Background Icon</label>
            <input
              type="color"
              name="headerIconBgColor"
              value={theme.headerIconBgColor}
              onChange={handleChange}
              className="w-8 h-8 rounded border-2 border-gray-200 shadow"
            />
            <span
              className="inline-block w-10 h-6 rounded border"
              style={{ background: theme.headerIconBgColor, borderColor: "#e5e7eb" }}
            />
            <span className="ml-2 text-xs text-gray-500">{theme.headerIconBgColor}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-end pt-6">
        <MasterButton
          type="simpan"
          shape={theme.buttonShape}
          onClick={handleSave}
          className="w-full sm:w-auto"
        >
          Simpan Pengaturan
        </MasterButton>
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
        {/* Preview Header Software */}
        <div
          className="w-full flex items-center justify-between px-6 py-3 rounded-t-lg"
          style={{
            background: theme.appHeaderColor,
            minHeight: 48,
            marginBottom: 8,
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: theme.headerIconBgColor }}>
              <svg width="22" height="22" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="4" y="7" width="16" height="2" rx="1" />
                <rect x="4" y="11" width="16" height="2" rx="1" />
                <rect x="4" y="15" width="16" height="2" rx="1" />
              </svg>
            </div>
            <span className="font-bold text-lg" style={{ color: "#555" }}>Temui</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: theme.headerIconBgColor }}>
              <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="6" y="7" width="12" height="10" rx="2" />
                <path d="M9 3v4" />
                <path d="M15 3v4" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: theme.headerIconBgColor }}>
              <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="6" y="7" width="12" height="10" rx="2" />
                <path d="M9 3v4" />
                <path d="M15 3v4" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: theme.headerIconBgColor }}>
              <svg width="20" height="20" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold">
              T
            </div>
          </div>
        </div>
        {/* Preview bentuk button dan card */}
        <div className="w-full flex flex-col items-center">
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
        {/* Preview Tabel Data */}
        <div className="w-full max-w-xl mt-8">
          <div className="font-semibold mb-2" style={{ color: theme.tableFontColor, fontFamily: theme.tableFontFamily }}>
            Preview Tabel Data
          </div>
          <table className="w-full rounded-lg overflow-hidden shadow border" style={{ fontFamily: theme.tableFontFamily }}>
            <thead>
              <tr style={{ background: theme.tableHeaderColor, color: theme.tableFontColor }}>
                <th className="py-2 px-4 text-left">Nama</th>
                <th className="py-2 px-4 text-left">Kelas</th>
                <th className="py-2 px-4 text-left">Nilai</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                <td className="py-2 px-4">Andi</td>
                <td className="py-2 px-4">XI IPA</td>
                <td className="py-2 px-4">90</td>
              </tr>
              <tr style={{ background: theme.tableBodyColor, color: theme.tableFontColor }}>
                <td className="py-2 px-4">Budi</td>
                <td className="py-2 px-4">XI IPS</td>
                <td className="py-2 px-4">85</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}