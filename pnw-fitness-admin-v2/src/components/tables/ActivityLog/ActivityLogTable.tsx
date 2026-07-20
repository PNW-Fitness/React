import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../ui/table";
import { supabase } from "../../../lib/supabaseClient";

interface SignInEntry {
  id: string;
  email: string | null;
  signed_in_at: string;
}

function formatTs(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ActivityLogTable() {
  const [entries, setEntries] = useState<SignInEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("sign_in_log")
      .select("*")
      .order("signed_in_at", { ascending: false })
      .limit(100)
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setEntries(data ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>;
  if (error) return <p className="text-sm text-error-600 dark:text-error-400">{error}</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Email
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Signed in
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {entries.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-800 dark:text-white/90">
                  {e.email}
                </TableCell>
                <TableCell className="px-5 py-4 text-start text-theme-sm text-gray-500 dark:text-gray-400">
                  {formatTs(e.signed_in_at)}
                </TableCell>
              </TableRow>
            ))}
            {entries.length === 0 && (
              <tr>
                <td className="px-5 py-6 text-center text-gray-400" colSpan={2}>
                  No sign-in events recorded yet.
                </td>
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
