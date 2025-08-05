import { useTheme } from "../context/ThemeContext";

export default function MasterCard({ children, className = "", ...props }) {
  const { theme } = useTheme();
  return (
    <div
      className={`rounded-xl shadow p-4 ${className}`}
      style={{ background: theme.cardColor }}
      {...props}
    >
      {children}
    </div>
  );
}