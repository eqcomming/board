import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { VehicleType } from "@/lib/types";

export default function AddVehicleForm({ onAdded }: { onAdded: () => void }) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [vehicleType, setVehicleType] = useState<VehicleType>("TRUCK");
  const [plate, setPlate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!plate.trim() || !reason.trim()) {
      setError("Registracija i razlog dolaska su obavezni.");
      return;
    }

    setSaving(true);
    const { error: insertError } = await supabase.from("vehicles").insert({
      vehicle_type: vehicleType,
      plate: plate.trim().toUpperCase(),
      reason: reason.trim(),
      status: "ARRIVED",
      created_by: session?.user.id,
    });
    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setPlate("");
    setReason("");
    setVehicleType("TRUCK");
    setOpen(false);
    onAdded();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg px-4 py-2"
      >
        + Prijavi dolazak vozila
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-4"
    >
      <h2 className="text-sm font-semibold text-slate-900">Novo vozilo</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Tip *
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value as VehicleType)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="TRUCK">Kamion</option>
            <option value="TRAILER">Prikolica</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Registracija *
          </label>
          <input
            required
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="npr. BG-123-AB"
          />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Razlog dolaska *
          </label>
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            placeholder="npr. Popravka kočnica"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-4 py-2"
        >
          {saving ? "Čuvanje..." : "Sačuvaj"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-600 text-sm font-medium rounded-lg px-4 py-2 border border-slate-300"
        >
          Otkaži
        </button>
      </div>
    </form>
  );
}
