import { useTheme } from "../context/ThemeContext";
import clsx from "clsx"; // gunakan clsx untuk kombinasi class (install: npm i clsx)

export default function MasterButton({
  type = "simpan",
  variant = "solid", // solid | outline
  shape = "default", // default | rounded | block
  size = "md",       // sm | md | lg
  icon = null,
  children,
  className = "",
  ...props
}) {
  const { theme } = useTheme();

  // Mapping warna sesuai type
  const colorMap = {
    simpan: theme.buttonSimpan,
    hapus: theme.buttonHapus,
    update: theme.buttonUpdate,
    refresh: theme.buttonRefresh,
    primary: theme.buttonSimpan,
    danger: theme.buttonHapus,
    warning: theme.buttonUpdate,
    info: theme.buttonRefresh,
  };
  const bgColor = colorMap[type] || theme.buttonSimpan;

  // Style dinamis
  const base =
    "font-semibold transition-all focus:outline-none flex items-center justify-center";
  const sizeMap = {
    sm: "px-3 py-1 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  const rounded = shape === "rounded" ? "rounded-full" : "rounded";
  const block = shape === "block" ? "w-full" : "";
  const solid =
    variant === "solid"
      ? `text-white shadow ${block} ${rounded}`
      : "";
  const outline =
    variant === "outline"
      ? `border-2 border-[${bgColor}] text-[${bgColor}] bg-transparent ${block} ${rounded}`
      : "";
  const style =
    variant === "solid"
      ? { background: bgColor }
      : variant === "outline"
      ? { borderColor: bgColor, color: bgColor }
      : {};

  return (
    <button
      className={clsx(
        base,
        sizeMap[size],
        solid,
        outline,
        block,
        className
      )}
      style={style}
      {...props}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
}