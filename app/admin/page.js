"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MercurioLogo from "../components/MercurioLogo";

const ATTENDANCE_BADGES = {
  asistire: {
    label: "Asistiré",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  no_asistire: {
    label: "No asistiré",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
  no_lo_se: {
    label: "Aún no lo sé",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
};

export default function AdminPage() {
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAttendance, setFilterAttendance] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const fetchRsvps = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/rsvp");
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      setRsvps(Array.isArray(data) ? data : []);
    } catch {
      setRsvps([]);
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie =
      "sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    router.push("/login");
    router.refresh();
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`¿Seguro que querés eliminar la confirmación de ${name}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/rsvp?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setRsvps((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error al eliminar:", err);
    }
  };

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      } else {
        document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${
          60 * 60 * 24 * 7
        }; SameSite=Lax`;
        fetchRsvps();
      }
    };
    checkSession();
  }, [fetchRsvps, router]);

  const stats = useMemo(() => {
    const total = rsvps.length;
    const asistire = rsvps.filter((r) => r.attendance === "asistire").length;
    const noAsistire = rsvps.filter((r) => r.attendance === "no_asistire").length;
    const noLoSe = rsvps.filter((r) => r.attendance === "no_lo_se").length;
    const celiac = rsvps.filter(
      (r) => r.attendance !== "no_asistire" && r.is_celiac
    ).length;
    const vegetarian = rsvps.filter(
      (r) => r.attendance !== "no_asistire" && r.is_vegetarian
    ).length;
    const allergic = rsvps.filter(
      (r) => r.attendance !== "no_asistire" && r.is_allergic
    ).length;

    return {
      total,
      asistire,
      noAsistire,
      noLoSe,
      celiac,
      vegetarian,
      allergic,
    };
  }, [rsvps]);

  const filteredRsvps = useMemo(() => {
    return rsvps.filter((item) => {
      const matchesName = item.full_name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

      if (!matchesName) return false;

      if (filterAttendance === "all") return true;
      if (filterAttendance === "dietary") {
        return (
          item.is_celiac ||
          item.is_vegetarian ||
          item.is_allergic ||
          Boolean(item.dietary_notes)
        );
      }
      return item.attendance === filterAttendance;
    });
  }, [rsvps, filterAttendance, searchTerm]);

  const exportToCSV = () => {
    const headers = [
      "Nombre y Apellido",
      "Asistencia",
      "Celíaco",
      "Vegetariano",
      "Alérgico",
      "Detalle / Notas",
      "Fecha de Registro",
    ];

    const rows = filteredRsvps.map((r) => [
      `"${(r.full_name || "").replace(/"/g, '""')}"`,
      `"${ATTENDANCE_BADGES[r.attendance]?.label || r.attendance}"`,
      r.is_celiac ? "Sí" : "No",
      r.is_vegetarian ? "Sí" : "No",
      r.is_allergic ? "Sí" : "No",
      `"${(r.dietary_notes || "").replace(/"/g, '""')}"`,
      `"${new Date(r.created_at).toLocaleString("es-AR")}"`,
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(";"), ...rows.map((e) => e.join(";"))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "confirmaciones_fiesta_mercurio.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header estilo Promociones */}
      <header className="glass-nav h-20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-40">
        <Link href="/" className="flex items-center gap-3">
          <MercurioLogo className="h-11 w-auto" />
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-widest text-white/80 hover:text-mercurio-yellow transition-colors"
          >
            Ver Invitación
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
            title="Cerrar sesión"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Encabezado y Acciones */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-[0.3em] text-mercurio-pink">
              Fiesta de Fin de Año • 12 Dic 2026
            </span>
            <h1 className="text-3xl font-black text-mercurio-navy tracking-tight">
              Panel de Confirmaciones
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchRsvps}
              className="px-4 py-2.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-all cursor-pointer"
            >
              ↻ Actualizar
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredRsvps.length === 0}
              className="mercurio-button-primary text-xs px-5 py-2.5 cursor-pointer disabled:opacity-50"
            >
              📥 Exportar a Excel (CSV)
            </button>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Total
            </p>
            <p className="text-2xl font-black text-mercurio-navy mt-1">
              {stats.total}
            </p>
          </div>
          <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
              Asistiré
            </p>
            <p className="text-2xl font-black text-emerald-700 mt-1">
              {stats.asistire}
            </p>
          </div>
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-rose-700">
              No Asistiré
            </p>
            <p className="text-2xl font-black text-rose-700 mt-1">
              {stats.noAsistire}
            </p>
          </div>
          <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-amber-700">
              Aún no lo sé
            </p>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {stats.noLoSe}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              🌾 Celíacos
            </p>
            <p className="text-2xl font-black text-mercurio-navy mt-1">
              {stats.celiac}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              🥗 Vegetarianos
            </p>
            <p className="text-2xl font-black text-mercurio-navy mt-1">
              {stats.vegetarian}
            </p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              ⚠️ Alérgicos
            </p>
            <p className="text-2xl font-black text-mercurio-pink mt-1">
              {stats.allergic}
            </p>
          </div>
        </div>

        {/* Filtros y Buscador */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {[
              { id: "all", label: "Todos" },
              { id: "asistire", label: "Asistiré" },
              { id: "no_asistire", label: "No asistiré" },
              { id: "no_lo_se", label: "Aún no lo sé" },
              { id: "dietary", label: "Con Menú Especial / Alergia" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterAttendance(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterAttendance === tab.id
                    ? "bg-mercurio-navy text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-mercurio-navy"
            />
          </div>
        </div>

        {/* Tabla de Confirmaciones */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-mercurio-navy rounded-full animate-spin" />
          </div>
        ) : filteredRsvps.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center space-y-2 shadow-sm">
            <p className="text-lg font-bold text-slate-700">
              No hay confirmaciones para mostrar
            </p>
            <p className="text-sm text-slate-400">
              Las respuestas de los invitados aparecerán aquí automáticamente.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Invitado/a</th>
                    <th className="py-4 px-6">Asistencia</th>
                    <th className="py-4 px-6">Menú / Restricciones</th>
                    <th className="py-4 px-6">Detalle / Alergias</th>
                    <th className="py-4 px-6">Fecha</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredRsvps.map((item) => {
                    const badge = ATTENDANCE_BADGES[item.attendance] || {
                      label: item.attendance,
                      className: "bg-slate-100 text-slate-700",
                    };

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-4 px-6 font-bold text-slate-900">
                          {item.full_name}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex flex-wrap gap-1.5">
                            {item.is_celiac && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                                🌾 Celíaco/a
                              </span>
                            )}
                            {item.is_vegetarian && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-green-50 text-green-800 border border-green-200 text-xs font-bold">
                                🥗 Vegetariano/a
                              </span>
                            )}
                            {item.is_allergic && (
                              <span className="px-2.5 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold">
                                ⚠️ Alérgico/a
                              </span>
                            )}
                            {!item.is_celiac &&
                              !item.is_vegetarian &&
                              !item.is_allergic && (
                                <span className="text-slate-400 text-xs">
                                  Sin restricciones
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-600 max-w-xs">
                          {item.dietary_notes || (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                          {new Date(item.created_at).toLocaleString("es-AR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() =>
                              handleDelete(item.id, item.full_name)
                            }
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar registro"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
