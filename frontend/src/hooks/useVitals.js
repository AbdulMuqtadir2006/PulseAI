import { useEffect, useState } from "react";
import { getLatestVitals, getVitalsHistory } from "../lib/api";

export function useLatestVitals(refreshKey = 0) {
  const [reading, setReading] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getLatestVitals()
      .then((r) => alive && setReading(r))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return { reading, loading, error };
}

export function useVitalsHistory(hours = 24, refreshKey = 0) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getVitalsHistory(hours)
      .then((h) => alive && setHistory(h))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [hours, refreshKey]);

  return { history, loading };
}
