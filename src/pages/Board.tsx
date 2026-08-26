import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { VEHICLE_TYPE_LABELS, type Vehicle } from "@/lib/types";

function Column({
  title,
  color,
  vehicles,
}: {
  title: string;
  color: string;
  vehicles: Vehicle[];
}) {
  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className={`rounded-t-2xl px-6 py-4 ${color}`}>
        <h2 className="text-3xl font-bold text-white tracking-wide">
          {title}
        </h2>
      </div>
      <div className="flex-1 bg-slate-900/40 rounded-b-2xl p-4 space-y-3 overflow-y-auto">
        {vehicles.length === 0 && (
          <p className="text-slate-500 text-xl text-center py-10">— nema vozila —</p>
        )}
        {vehicles.map((v) => (
          <div
            key={v.id}
            className="bg-slate-800 rounded-xl px-5 py-4 flex items-center justify-between"
          >
            <div>
              <div className="text-2xl font-bold text-white tracking-wide">
                {v.plate}
              </div>
              <div className="text-slate-400 text-lg">
                {VEHICLE_TYPE_LABELS[v.vehicle_type]} · {v.reason}
              </div>
            </div>
            <div className="text-slate-400 text-lg tabular-nums">
              {new Date(v.created_at).toLocaleTimeString("sr-RS", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Board() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [now, setNow] = useState(new Date());

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("vehicles")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setVehicles(data as Vehicle[]);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("board-vehicles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vehicles" },
        () => load()
      )
      .subscribe();

    // Rezervna mreža za slučaj da realtime konekcija ispadne (npr. TV ostavljen preko noći)
    const poll = setInterval(load, 30000);
    const clock = setInterval(() => setNow(new Date()), 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [load]);

  const arrived = vehicles.filter((v) => v.status === "ARRIVED");
  const ready = vehicles.filter((v) => v.status === "READY");

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-4xl font-bold text-white">Equipment Coming</h1>
        <div className="text-2xl text-slate-400 tabular-nums">
          {now.toLocaleTimeString("sr-RS")}
        </div>
      </div>
      <div className="flex-1 flex gap-6 min-h-0">
        <Column title="ARRIVED" color="bg-amber-600" vehicles={arrived} />
        <Column title="READY" color="bg-green-600" vehicles={ready} />
      </div>
    </div>
  );
}
