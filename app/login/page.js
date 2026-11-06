"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MercurioLogo from "../components/MercurioLogo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: sbError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (sbError) throw sbError;

      if (!data.session) {
        throw new Error(
          "No se pudo establecer una sesión. Por favor, verificá tu correo."
        );
      }

      document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=${
        60 * 60 * 24 * 7
      }; SameSite=Lax`;

      window.location.href = "/admin";
      return;
    } catch (err) {
      let errorMessage = err.message || "Ocurrió un error inesperado";
      if (errorMessage === "Invalid login credentials") {
        errorMessage = "Credenciales inválidas. Revisá tu email y contraseña.";
      } else if (errorMessage === "Email not confirmed") {
        errorMessage = "Debés confirmar tu correo electrónico antes de ingresar.";
      }
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-mercurio-navy relative overflow-hidden">
      <div className="w-full h-1.5 mercurio-gradient-wave fixed top-0 left-0 z-20" />

      <div className="mb-8">
        <Link href="/">
          <MercurioLogo className="h-14 w-auto mx-auto" />
        </Link>
      </div>

      <div className="w-full max-w-md p-8 bg-white text-slate-900 rounded-[2rem] shadow-premium border border-slate-100 animate-entrance">
        <div className="text-center mb-6">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-mercurio-pink">
            Fiesta de Fin de Año
          </span>
          <h1 className="text-2xl font-black text-mercurio-navy mt-1">
            Acceso Administrador
          </h1>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-mercurio-navy focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-mercurio-navy focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mercurio-button-primary py-3.5 rounded-full font-bold text-sm uppercase tracking-wider cursor-pointer mt-2"
          >
            {loading ? "Iniciando sesión..." : "Entrar al Panel"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 hover:text-mercurio-navy transition-colors"
          >
            ← Volver a la invitación
          </Link>
        </div>
      </div>
    </div>
  );
}
