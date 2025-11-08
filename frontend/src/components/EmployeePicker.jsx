import { useEffect, useState } from "react";
import { getEmployees } from "../services/api";

export default function EmployeePicker({ onSelect }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    getEmployees({ q, limit: 10 }).then(({ data }) => setRows(data.items || []));
  }, [q]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow p-4">
      <div className="mb-3">
        <input
          className="w-full rounded-md border px-3 py-2 dark:bg-slate-800"
          placeholder="Search by ID / role / department…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="divide-y">
        {rows.map((r) => (
          <div key={r._id} className="flex items-center justify-between py-2">
            <div className="text-sm">
              <div className="font-semibold">{r.EmployeeID}</div>
              <div className="text-slate-500">{r.Department} · {r.JobRole}</div>
            </div>
            <button
              className="text-blue-600 hover:underline"
              onClick={() => onSelect(r)}
            >
              Select
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
