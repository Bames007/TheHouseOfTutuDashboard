// app/hooks/useApi.ts
"use client";
import { useEffect, useState, useCallback } from "react";

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function useApi<T>(
  path: string | null,
  options: { skip?: boolean } = {},
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!options.skip && !!path);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (options.skip || !path) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    fetch(path, { signal: controller.signal, credentials: "same-origin" })
      .then(async (r) => {
        const body = (await r.json()) as ApiEnvelope<T>;
        if (!body.success) throw new Error(body.error);
        return body.data;
      })
      .then((d) => !controller.signal.aborted && setData(d))
      .catch((e) => {
        if (e.name === "AbortError") return;
        setError(e.message || "Request failed");
      })
      .finally(() => !controller.signal.aborted && setLoading(false));

    return () => controller.abort();
  }, [path, options.skip, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { data, loading, error, refresh };
}
