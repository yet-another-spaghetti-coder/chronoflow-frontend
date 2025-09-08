import { useEffect, useState } from "react";
import { http } from "@/lib/http";

export default function AuthListChecker() {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    http
      .get("/system/auth/list")
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="p-4 border rounded-md bg-gray-50">
      <h2 className="font-bold mb-2">Backend /system/auth/list check</h2>
      {error && <p className="text-red-600">Error: {error}</p>}
      {data ? (
        <pre className="text-sm bg-white p-2 rounded border overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      ) : (
        !error && <p>Loading…</p>
      )}
    </div>
  );
}
