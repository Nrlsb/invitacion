"use client";

import { useState } from "react";

const ATTENDANCE_OPTIONS = [
  {
    id: "asistire",
    label: "ASISTIRÉ",
    icon: "🎉",
    activeClass:
      "border-mercurio-navy bg-mercurio-navy text-white shadow-lg ring-4 ring-mercurio-navy/20 scale-[1.01]",
  },
  {
    id: "no_asistire",
    label: "NO ASISTIRÉ",
    icon: "😔",
    activeClass:
      "border-mercurio-pink bg-mercurio-pink text-white shadow-lg ring-4 ring-mercurio-pink/20 scale-[1.01]",
  },
  {
    id: "no_lo_se",
    label: "AÚN NO LO SÉ",
    icon: "🤔",
    activeClass:
      "border-amber-500 bg-amber-500 text-slate-950 shadow-lg ring-4 ring-amber-500/20 scale-[1.01]",
  },
];

export default function RsvpModal({ isOpen, onClose }) {
  const [fullName, setFullName] = useState("");
  const [attendance, setAttendance] = useState("asistire");
  const [isCeliac, setIsCeliac] = useState(false);
  const [isVegetarian, setIsVegetarian] = useState(false);
  const [isAllergic, setIsAllergic] = useState(false);
  const [dietaryNotes, setDietaryNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError("Por favor ingresá tu nombre y apellido.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          attendance,
          is_celiac: isCeliac,
          is_vegetarian: isVegetarian,
          is_allergic: isAllergic,
          dietary_notes: dietaryNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo registrar tu respuesta.");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setFullName("");
    setAttendance("asistire");
    setIsCeliac(false);
    setIsVegetarian(false);
    setIsAllergic(false);
    setDietaryNotes("");
    setError(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-modal-backdrop"
      onClick={handleResetAndClose}
    >
      <div
        className="bg-white text-slate-900 rounded-[2.25rem] sm:rounded-[2.5rem] shadow-premium border border-slate-100 max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden animate-modal-card relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra superior con gradiente Mercurio */}
        <div className="h-2 w-full mercurio-gradient-wave shrink-0" />

        {/* Header Fijo */}
        <div className="flex justify-between items-center px-6 sm:px-7 pt-5 pb-4 border-b border-slate-100 shrink-0 bg-white z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mercurio-pink">
              Fiesta de Fin de Año
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-mercurio-navy tracking-tight">
              Confirmar Asistencia
            </h2>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-6 animate-entrance">
            <div className="w-20 h-20 rounded-full bg-mercurio-navy/10 text-mercurio-navy mx-auto flex items-center justify-center text-4xl">
              ✨
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-mercurio-navy">
                ¡Respuesta registrada!
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed max-w-sm mx-auto">
                Muchas gracias,{" "}
                <strong className="text-mercurio-navy">{fullName}</strong>. Ya
                guardamos tu confirmación para la Fiesta de Fin de Año de
                Mercurio.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="w-full mercurio-button-primary py-3.5 text-base cursor-pointer"
            >
              Volver a la invitación
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Cuerpo desplazable con entrada escalonada */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-5">
              {/* Nombre y Apellido */}
              <div className="animate-stagger-1">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                  Nombre y Apellido *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Juan Pérez"
                  maxLength={120}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-base font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-mercurio-navy focus:border-transparent placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* Botones de Asistencia (Asistiré / No asistiré / Aún no lo sé) */}
              <div className="animate-stagger-2">
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                  ¿Vas a asistir? *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {ATTENDANCE_OPTIONS.map((option) => {
                    const isSelected = attendance === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setAttendance(option.id)}
                        className={`flex flex-col items-center justify-center gap-1 py-3 px-3 rounded-2xl border-2 font-black text-xs tracking-wider transition-all duration-200 cursor-pointer active:scale-95 ${
                          isSelected
                            ? option.activeClass
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-xl">{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Restricciones alimentarias: Celíaco, Vegetariano, Alérgico */}
              {attendance !== "no_asistire" && (
                <div className="space-y-3.5 p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 animate-stagger-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-mercurio-navy mb-1">
                      Restricciones Alimentarias / Menú Especial
                    </label>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Seleccioná si sos celíaco/a, vegetariano/a o alérgico/a
                      (podés marcar más de una).
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        id: "celiac",
                        label: "Celíaco/a",
                        icon: "🌾",
                        active: isCeliac,
                        toggle: () => setIsCeliac((v) => !v),
                      },
                      {
                        id: "vegetarian",
                        label: "Vegetariano/a",
                        icon: "🥗",
                        active: isVegetarian,
                        toggle: () => setIsVegetarian((v) => !v),
                      },
                      {
                        id: "allergic",
                        label: "Alérgico/a",
                        icon: "⚠️",
                        active: isAllergic,
                        toggle: () => setIsAllergic((v) => !v),
                      },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.toggle}
                        className={`relative flex flex-col items-center justify-center px-1.5 py-3 rounded-xl border text-center transition-all cursor-pointer active:scale-95 ${
                          item.active
                            ? "border-mercurio-navy bg-white text-mercurio-navy shadow-sm ring-2 ring-mercurio-navy/15 font-black"
                            : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 font-semibold"
                        }`}
                      >
                        <span className="text-lg mb-1">{item.icon}</span>
                        <span className="text-[11px] sm:text-xs leading-tight">
                          {item.label}
                        </span>
                        {item.active && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-mercurio-navy text-white flex items-center justify-center text-[10px]">
                            ✓
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">
                      Detalle de alergia u otra aclaración (opcional)
                    </label>
                    <input
                      type="text"
                      value={dietaryNotes}
                      onChange={(e) => setDietaryNotes(e.target.value)}
                      maxLength={300}
                      placeholder={
                        isAllergic
                          ? "Especificá a qué alimento sos alérgico/a..."
                          : "Ej: Vegano, intolerancia a la lactosa, etc."
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-mercurio-navy placeholder:text-slate-400"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-medium">
                  {error}
                </div>
              )}
            </div>

            {/* Footer Fijo del Modal */}
            <div className="flex gap-3 px-5 sm:px-7 py-4 border-t border-slate-100 bg-white shrink-0">
              <button
                type="button"
                onClick={handleResetAndClose}
                disabled={loading}
                className="px-5 py-3 rounded-full border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 mercurio-button-primary py-3 text-sm uppercase tracking-wider cursor-pointer"
              >
                {loading ? "Guardando..." : "Enviar Confirmación"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
