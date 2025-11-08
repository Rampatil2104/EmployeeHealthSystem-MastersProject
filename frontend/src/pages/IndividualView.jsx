import { useEffect, useState } from "react";
import ChartCard from "../components/ChartCard";
import Loader from "../components/Loader";
import ErrorBox from "../components/ErrorBox";

import { getEmployees, postPredict } from "../services/api";

import VitalsMini from "../charts/individual/VitalsMini";
import SleepMini from "../charts/individual/SleepMini";
import ActivityMini from "../charts/individual/ActivityMini";

export default function IndividualView() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(null);

  const [predLoading, setPredLoading] = useState(false);
  const [pred, setPred] = useState(null); // { mental, physical, riskLabel, riskProbs }
  const [err, setErr] = useState(null);

  // fetch employees (searchable)
  useEffect(() => {
    setLoading(true);
    setErr(null);
    getEmployees({ limit: 20, q: query || undefined })
      .then((r) => setList(r.data.items || []))
      .catch(setErr)
      .finally(() => setLoading(false));
  }, [query]);

  // call FastAPI for prediction
  const onPredict = async () => {
    if (!picked) return;
    setPred(null);
    setErr(null);
    setPredLoading(true);
    try {
      // FastAPI back-compat wrapper; expects { employeeId } or { features }
      const r = await postPredict({ employeeId: picked.EmployeeID });

      // Normalize response shapes
      const riskLabel = num(getDeep(r.data, ["risk", "0", "0"]));
      const riskProbs = (getDeep(r.data, ["risk", "1", "0"]) || []).map((x) => Number(x));
      const mental = num(getDeep(r.data, ["mental", "0", "0", "0"]));
      const physical = num(getDeep(r.data, ["physical", "0", "0", "0"]));

      setPred({ riskLabel, riskProbs, mental, physical });
    } catch (e) {
      setErr(e);
    } finally {
      setPredLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* search */}
      <div className="flex items-center gap-3">
        <input
          className="px-3 py-2 rounded-md border w-80 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          placeholder="Search employee by ID / role / dept…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* top row: picker + profile/pred */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Pick an Employee">
          {loading ? (
            <Loader />
          ) : err ? (
            <ErrorBox error={err} />
          ) : (
            <div className="overflow-auto h-full">
              <table className="w-full text-sm">
                <thead className="text-left text-gray-500">
                  <tr>
                    <th className="py-2">ID</th>
                    <th>Dept</th>
                    <th>Role</th>
                    <th>Risk</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr
                      key={row._id}
                      className="border-t border-gray-100 dark:border-gray-700"
                    >
                      <td className="py-2">{row.EmployeeID}</td>
                      <td>{row.Department}</td>
                      <td>{row.JobRole}</td>
                      <td>{row.RiskCategory2}</td>
                      <td>
                        <button
                          className="text-blue-600 underline"
                          onClick={() => {
                            setPicked(row);
                            setPred(null);
                            setErr(null);
                          }}
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Profile & Prediction">
          {!picked ? (
            <div className="h-full grid place-content-center text-gray-500">
              Select a row →
            </div>
          ) : (
            <div className="space-y-4 h-full">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Item label="EmployeeID" value={picked.EmployeeID} />
                <Item label="Dept" value={picked.Department} />
                <Item label="Role" value={picked.JobRole} />
                <Item label="Risk (current)" value={picked.RiskCategory2} />
              </div>

              <button
                className="px-3 py-2 rounded-md bg-blue-600 text-white disabled:opacity-60"
                disabled={predLoading}
                onClick={onPredict}
              >
                {predLoading ? "Predicting..." : "Predict Health"}
              </button>

              {err && <ErrorBox error={err} />}

              {pred && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat
                      label="Mental"
                      value={isNum(pred.mental) ? pred.mental.toFixed(1) : "-"}
                    />
                    <Stat
                      label="Physical"
                      value={isNum(pred.physical) ? pred.physical.toFixed(1) : "-"}
                    />
                    <Stat label="Risk Label" value={isNum(pred.riskLabel) ? pred.riskLabel : "-"} />
                  </div>
                  {Array.isArray(pred.riskProbs) && pred.riskProbs.length > 0 && (
                    <div className="text-xs text-gray-500">
                      Risk probs:{" "}
                      {pred.riskProbs.map((p) =>
                        isNum(p) ? p.toFixed(3) : "-"
                      ).join(" / ")}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </ChartCard>
      </div>

      {/* bottom mini-cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <VitalsMini emp={picked} />
        <SleepMini emp={picked} />
        <ActivityMini emp={picked} />
      </div>
    </div>
  );
}

/* ---------- small helpers ---------- */
function getDeep(obj, pathArr) {
  return pathArr.reduce((a, k) => (a && a[k] != null ? a[k] : null), obj);
}
function num(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function isNum(x) {
  return typeof x === "number" && Number.isFinite(x);
}

function Item({ label, value }) {
  return (
    <div>
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="font-medium">{value ?? "-"}</div>
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div className="rounded-xl border p-3 dark:border-gray-700">
      <div className="text-gray-500 text-xs">{label}</div>
      <div className="text-2xl font-semibold">{value ?? "-"}</div>
    </div>
  );
}
