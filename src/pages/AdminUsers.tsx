import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import Nav from "@/components/Nav";
import { ROLE_LABELS, type Profile, type Role } from "@/lib/types";

const emptyForm = {
  full_name: "",
  email: "",
  password: "",
  role: "FLEET" as Role,
};

export default function AdminUsers() {
  const { session, profile: myProfile } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) setUsers(data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function callFunction(method: "POST" | "DELETE", body: unknown) {
    const res = await fetch("/.netlify/functions/admin-users", {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Greška");
    }
    return data;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await callFunction("POST", form);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Greška prilikom čuvanja");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(id: string, role: Role) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    await supabase.from("profiles").update({ role }).eq("id", id);
  }

  async function handleDelete(id: string) {
    if (!confirm("Da li sigurno želiš da obrišeš ovaj nalog?")) return;
    try {
      await callFunction("DELETE", { user_id: id });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Greška pri brisanju");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Nav />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Korisnici</h1>
        <p className="text-sm text-slate-500 mb-6">
          Dodaj Maintenance i Fleet naloge koji mogu da pristupe aplikaciji.
        </p>

        <div className="space-y-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              Dodaj novi nalog
            </h2>
            <form
              onSubmit={handleCreate}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <input
                required
                placeholder="Ime i prezime"
                value={form.full_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, full_name: e.target.value }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <input
                required
                type="password"
                placeholder="Lozinka (min. 6 karaktera)"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={form.role}
                onChange={(e) =>
                  setForm((f) => ({ ...f, role: e.target.value as Role }))
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>

              {error && (
                <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg px-5 py-2.5"
                >
                  {saving ? "Čuvanje..." : "Dodaj korisnika"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Ime</th>
                  <th className="px-4 py-3 font-medium">Uloga</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500">
                      Učitavanje...
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {u.full_name} {u.id === myProfile?.id && "(ti)"}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleRoleChange(u.id, e.target.value as Role)
                          }
                          disabled={u.id === myProfile?.id}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs disabled:opacity-50"
                        >
                          {Object.entries(ROLE_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.id !== myProfile?.id && (
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="text-red-500 hover:underline text-xs font-medium"
                          >
                            Obriši
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
