import { useEffect, useState } from "react";

export default function useFetch(fn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setErr(null);
    fn()
      .then((res) => mounted && setData(res.data))
      .catch((e) => mounted && setErr(e))
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, err };
}
