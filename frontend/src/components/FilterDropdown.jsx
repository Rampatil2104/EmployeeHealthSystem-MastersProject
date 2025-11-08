export default function FilterDropdown({ label, value, onChange, options }) {
  return (
    <label className="text-sm text-gray-600 dark:text-gray-300">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="ml-2 px-2 py-1 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}
