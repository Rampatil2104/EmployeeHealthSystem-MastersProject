import { useEffect, useMemo, useState } from "react";
import ChartCard from "../components/ChartCard";
import Loader from "../components/Loader";
import ErrorBox from "../components/ErrorBox";
import { getEmployees, postPredict } from "../services/api";

// New charts
import WellnessRadar from "../charts/individual/WellnessRadar";
import DriversBar from "../charts/individual/DriversDeltaBar";
import Cohort3DScatter from "../charts/individual/Cohort3DScatter";
import True3DScatter from "../charts/individual/True3DScatter";
import DriversDeltaBar from "../charts/individual/DriversDeltaBar";

export default function IndividualView() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [picked, setPicked] = useState(null);

  const [predLoading, setPredLoading] = useState(false);
  const [pred, setPred] = useState(null); // { mental, physical }

  // fetch employees
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await getEmployees({ limit: 20, q: query || undefined });
        if (!cancelled) setList(Array.isArray(res?.data?.items) ? res.data.items : []);
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query]);

  // predict mental/physical
  const onPredict = async () => {
    if (!picked) return;
    setPred(null);
    setErr(null);
    setPredLoading(true);
    try {
      const r = await postPredict({ employeeId: picked.EmployeeID });
      const mental = toNum(deep(r.data, ["mental", 0, 0, 0])) ?? toNum(r.data?.mental);
      const physical = toNum(deep(r.data, ["physical", 0, 0, 0])) ?? toNum(r.data?.physical);
      setPred({ mental, physical });
    } catch (e) {
      setErr(e);
    } finally {
      setPredLoading(false);
    }
  };

  const cohort = useMemo(() => (Array.isArray(list) ? list : []), [list]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          className="px-3 py-2 rounded-md border w-80 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100"
          placeholder="Search employee by ID / role / dept…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Picker + Profile */}
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
                  {cohort.map((row) => (
                    <tr key={row._id ?? row.EmployeeID} className="border-t border-gray-100 dark:border-gray-700">
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
                  {cohort.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-400">
                        No results
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Profile & Prediction">
          {!picked ? (
            <div className="h-full grid place-content-center text-gray-500">Select a row →</div>
          ) : (
            <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-3">
                  <Stat label="Mental" value={isNum(pred.mental) ? pred.mental.toFixed(1) : "-"} />
                  <Stat label="Physical" value={isNum(pred.physical) ? pred.physical.toFixed(1) : "-"} />
                </div>
              )}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Individual visual block row */}
      <div className="grid md:grid-cols-3 gap-6">
        <ChartCard title="Wellness Radar (individual)">
          <SafeMount ready={!!picked}>
            <WellnessRadar employee={picked} />
          </SafeMount>
        </ChartCard>

        <ChartCard title="Top Drivers vs Cohort">
          <SafeMount ready={!!picked && cohort.length > 0}>
            <DriversDeltaBar employee={picked} cohort={cohort} />
          </SafeMount>
        </ChartCard>

        <ChartCard title="3D Cohort">
          <SafeMount ready={!!picked && cohort.length > 0}>
            <True3DScatter employee={picked} cohort={cohort} />
          </SafeMount>
        </ChartCard>
      </div>
    </div>
  );
}

/* helpers */
function deep(obj, path) {
  try { return path.reduce((a, k) => (a == null ? a : a[k]), obj); } catch { return undefined; }
}
function toNum(x) {
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}
function isNum(x) { return typeof x === "number" && Number.isFinite(x); }

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
function SafeMount({ ready, children }) {
  if (!ready) {
    return <div className="h-[260px] grid place-content-center text-gray-400">Select a row →</div>;
  }
  return <div className="h-[260px]">{children}</div>;
}
