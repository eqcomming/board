import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Nav from "@/components/Nav";
import AddVehicleForm from "@/components/AddVehicleForm";
import {
  VEHICLE_TYPE_LABELS,
  STATUS_LABELS,
  type Vehicle,
  type VehicleStatus,
} from "@/lib/types";

export default function Dashboard() {
  const { profile } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"" | VehicleStatus>("");
  const [q, setQ] = useState("");

  const canAdd = profile?.role === "MAINTENANCE" || profile?.role === "ADMIN";
  const canChangeStatus = profile?.role === "FLEET" || profile?.role === "ADMIN";
  const canDelete = profile?.role === "ADMIN";

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter) query = query.eq("status", statusFilter);

    const { data, error } = await query;
    if (!error && data) {
      setVehicles(data as Vehicle[]);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("dashboard-vehicles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  const filtered = vehicles.filter((v) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      v.plate.toLowerCase().includes(needle) ||
      v.reason.toLowerCase().includes(needle)
    );
  });

  async function toggleStatus(v: Vehicle) {
    const newStatus: VehicleStatus = v.status === "ARRIVED" ? "READY" : "ARRIVED";
    setVehicles((prev) =>
      prev.map((x) => (x.id === v.id ? { ...x, status: newStatus } : x))
    );
    await supabase.from("vehicles").update({ status: newStatus }).eq("id", v.id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Da li sigurno želiš da obrišeš ovo vozilo?")) return;
    const { error } = await supabase.from("vehicles").delete().eq("id", id);
    if (!error) {
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } else {
      alert(error.message);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-slate-900">
            Vozila u radionici
          </h1>
          {canAdd && <AddVehicleForm onAdded={load} />}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Pretraga (registracija, razlog)..."
            className="flex-1 min-w-[200px] rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "" | VehicleStatus)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Svi statusi</option>
            <option value="ARRIVED">Arrived</option>
            <option value="READY">Ready</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500 py-8 text-center">Učitavanje...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-slate-500 py-8 text-center">
            Nema vozila koja odgovaraju pretrazi.
          </p>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-500 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Registracija</th>
                    <th className="px-4 py-3 font-medium">Tip</th>
                    <th className="px-4 py-3 font-medium">Razlog dolaska</th>
                    <th className="px-4 py-3 font-medium">Prijem</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {v.plate}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {VEHICLE_TYPE_LABELS[v.vehicle_type]}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{v.reason}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(v.created_at).toLocaleString("sr-RS")}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium rounded-full px-2.5 py-1 ${
                            v.status === "ARRIVED"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {STATUS_LABELS[v.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        {canChangeStatus && (
                          <button
                            onClick={() => toggleStatus(v)}
                            className="text-brand-600 hover:underline text-xs font-medium mr-3"
                          >
                            Označi kao {v.status === "ARRIVED" ? "Ready" : "Arrived"}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Obriši
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
