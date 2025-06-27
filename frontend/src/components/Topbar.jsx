export default function Topbar({ onToggleTheme }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 shadow flex justify-end">
      <button onClick={onToggleTheme} className="bg-indigo-500 text-white px-4 py-2 rounded">
        Toggle Theme
      </button>
    </div>
  );
}