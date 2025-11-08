import useDarkMode from "../hooks/useDarkMode";

export default function DarkModeToggle() {
  const { dark, setDark } = useDarkMode();
  return (
    <button
      onClick={() => setDark(!dark)}
      className="px-3 py-1 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-gray-100"
      title="Toggle theme"
    >
      {dark ? "Light Mode" : "Dark Mode"}
    </button>
  );
}
