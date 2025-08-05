import { createContext, useContext, useState, useEffect } from "react";

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
  formColor: "#ffffff",
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(defaultTheme);

  // Load theme dari backend saat mount (sekali saja)
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
        // Optional: handle error
      }
    };
    fetchTheme();
  }, []);

  // Fungsi untuk update theme (misal setelah simpan di Setting)
  const updateTheme = (newTheme) => {
    setTheme((prev) => ({
      ...prev,
      ...newTheme,
    }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme: updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}