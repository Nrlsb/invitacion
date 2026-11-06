"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import MercurioLogo from "./components/MercurioLogo";
import RsvpModal from "./components/RsvpModal";

// Fecha del evento: 12 de Diciembre de 2026 a las 20:00 hs (Hora Argentina UTC-3)
const EVENT_DATE = new Date("2026-12-12T20:00:00-03:00").getTime();

// Distancia de scroll (en px) para abrir el telón de forma gradual y progresiva
const CURTAIN_SCROLL_DISTANCE = 800;

function calculateTimeLeft() {
  const now = Date.now();
  const diff = Math.max(0, EVENT_DATE - now);

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds };
}

// Curva S suave (smoothstep) para que el inicio y el final del recorrido amortigüen
function smoothstep(x) {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

export default function InvitationPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 37,
    hours: 11,
    minutes: 15,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Referencias directas al DOM para animar a 60/120fps sin re-renderizar React
  const curtainContainerRef = useRef(null);
  const leftCurtainRef = useRef(null);
  const rightCurtainRef = useRef(null);
  const centerBadgeRef = useRef(null);
  const centerCardRef = useRef(null);
  const topWaveRef = useRef(null);
  const stageTransformRef = useRef(null);
  const stageDimmerRef = useRef(null);

  // Contador regresivo en tiempo real
  useEffect(() => {
    setMounted(true);
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Motor de física con inercia amortiguada (Lerp) para abrir/cerrar el telón suavemente
  useEffect(() => {
    let rafId = null;
    let isReadyForScroll = false;
    let targetProgress = 0;
    let currentProgress = 0;
    let lastTime = performance.now();

    const applyCurtainStyles = (rawProgress) => {
      const p = smoothstep(rawProgress);

      // 1. Hoja izquierda y derecha del telón (solo GPU transform3d)
      if (leftCurtainRef.current) {
        leftCurtainRef.current.style.transform = `translate3d(-${
          p * 104
        }%, 0, 0) skewX(-${p * 3.5}deg)`;
      }
      if (rightCurtainRef.current) {
        rightCurtainRef.current.style.transform = `translate3d(${
          p * 104
        }%, 0, 0) skewX(${p * 3.5}deg)`;
      }

      // 2. Sello central de bienvenida
      if (centerBadgeRef.current) {
        const badgeOpacity = Math.max(0, 1 - smoothstep(rawProgress * 1.85));
        const badgeScale = 1 + p * 0.14;
        const badgeY = p * 28;
        centerBadgeRef.current.style.opacity = String(badgeOpacity);
        centerBadgeRef.current.style.transform = `translate3d(0, -${badgeY}px, 0) scale(${badgeScale})`;
      }
      if (centerCardRef.current) {
        centerCardRef.current.style.pointerEvents =
          rawProgress < 0.35 ? "auto" : "none";
      }

      // 3. Barra superior del telón
      if (topWaveRef.current) {
        topWaveRef.current.style.opacity = String(Math.max(0, 1 - p * 0.85));
      }

      // 4. Escala del escenario y velo de oscuridad (reemplaza filter:brightness por opacidad GPU)
      if (stageTransformRef.current) {
        const scale = 0.93 + 0.07 * p;
        stageTransformRef.current.style.transform = `scale3d(${scale}, ${scale}, 1)`;
      }
      if (stageDimmerRef.current) {
        const dimmerOpacity = Math.max(0, (1 - p) * 0.55);
        stageDimmerRef.current.style.opacity = String(dimmerOpacity);
        stageDimmerRef.current.style.visibility =
          dimmerOpacity <= 0.005 ? "hidden" : "visible";
      }

      // 5. Ocultar contenedor del telón cuando termina de abrirse al 100%
      if (curtainContainerRef.current) {
        curtainContainerRef.current.style.visibility =
          rawProgress >= 0.998 ? "hidden" : "visible";
      }
    };

    const tick = (now) => {
      const dt = Math.min(64, Math.max(1, now - lastTime));
      lastTime = now;

      // Factor de amortiguación independiente de los Hz del monitor (suave y sedoso)
      const lerpFactor = 1 - Math.pow(0.0008, dt / 1000);
      const diff = targetProgress - currentProgress;

      if (Math.abs(diff) > 0.0004) {
        currentProgress += diff * lerpFactor;
        applyCurtainStyles(currentProgress);
        rafId = window.requestAnimationFrame(tick);
      } else {
        currentProgress = targetProgress;
        applyCurtainStyles(currentProgress);
        rafId = null;
      }
    };

    const startLoop = () => {
      if (rafId === null) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const resetToTop = () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      if (window.location.hash) {
        window.history.replaceState(
          null,
          "",
          window.location.pathname + window.location.search
        );
      }
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      targetProgress = 0;
      currentProgress = 0;
      applyCurtainStyles(0);
    };

    resetToTop();

    const readyTimer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      targetProgress = 0;
      currentProgress = 0;
      applyCurtainStyles(0);
      isReadyForScroll = true;
    }, 80);

    const onScroll = () => {
      if (!isReadyForScroll) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        return;
      }
      const y = window.scrollY || window.pageYOffset || 0;
      targetProgress = Math.min(1, Math.max(0, y / CURTAIN_SCROLL_DISTANCE));
      startLoop();
    };

    const onPageShow = (e) => {
      if (e.persisted) {
        isReadyForScroll = false;
        resetToTop();
        setTimeout(() => {
          isReadyForScroll = true;
        }, 80);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pageshow", onPageShow);

    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pageshow", onPageShow);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, []);

  // Observer para animar elementos suavemente al bajar (Scroll Reveal)
  useEffect(() => {
    const elements = document.querySelectorAll(".reveal-item");
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -20px 0px",
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleOpenCurtainClick = () => {
    window.scrollTo({
      top: CURTAIN_SCROLL_DISTANCE + 20,
      behavior: "smooth",
    });
  };

  const handleScrollToDetails = () => {
    const target = document.getElementById("datos-fiesta");
    if (target) {
      const rect = target.getBoundingClientRect();
      const targetY = window.scrollY + rect.top - 24;
      window.scrollTo({
        top: Math.max(CURTAIN_SCROLL_DISTANCE + 300, targetY),
        behavior: "smooth",
      });
    }
  };

  const pad = (num) => String(num).padStart(2, "0");

  return (
    <div className="relative bg-mercurio-navy text-white selection:bg-mercurio-pink selection:text-white">
      {/* =========================================================
          TELÓN INTERACTIVO CON INERCIA AMORTIGUADA (LERP 60/120FPS)
         ========================================================= */}
      <div
        ref={curtainContainerRef}
        className="fixed inset-0 z-40 overflow-hidden pointer-events-none"
      >
        {/* Barra superior de gala */}
        <div
          ref={topWaveRef}
          className="absolute top-0 left-0 w-full h-2 mercurio-gradient-wave z-30 shadow-lg will-change-[opacity]"
        />

        {/* Hoja Izquierda del Telón */}
        <div
          ref={leftCurtainRef}
          className="curtain-panel-left absolute top-0 left-0 w-1/2 h-full border-r-2 border-mercurio-yellow/60 will-change-transform flex items-center justify-end"
          style={{
            transform: "translate3d(0%, 0, 0) skewX(0deg)",
            transformOrigin: "top left",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Cordón / Detalle dorado interior izquierdo */}
          <div className="h-full w-1.5 bg-gradient-to-b from-mercurio-yellow/80 via-mercurio-pink/60 to-mercurio-yellow/80 opacity-80" />
        </div>

        {/* Hoja Derecha del Telón */}
        <div
          ref={rightCurtainRef}
          className="curtain-panel-right absolute top-0 right-0 w-1/2 h-full border-l-2 border-mercurio-yellow/60 will-change-transform flex items-center justify-start"
          style={{
            transform: "translate3d(0%, 0, 0) skewX(0deg)",
            transformOrigin: "top right",
            backfaceVisibility: "hidden",
          }}
        >
          {/* Cordón / Detalle dorado interior derecho */}
          <div className="h-full w-1.5 bg-gradient-to-b from-mercurio-yellow/80 via-mercurio-pink/60 to-mercurio-yellow/80 opacity-80" />
        </div>

        {/* Sello / Medallón Central sobre el Telón Cerrado */}
        <div
          ref={centerBadgeRef}
          className="absolute inset-0 flex flex-col items-center justify-center p-6 z-20 will-change-[transform,opacity]"
        >
          <div
            ref={centerCardRef}
            onClick={handleOpenCurtainClick}
            className="max-w-xs w-full rounded-[2rem] bg-[#0d1d42]/95 border border-mercurio-yellow/40 shadow-[0_20px_60px_rgba(0,0,0,0.85)] px-7 py-9 flex flex-col items-center text-center space-y-6 cursor-pointer group transition-transform active:scale-95 pointer-events-auto"
          >
            <MercurioLogo className="h-14 w-auto mx-auto drop-shadow" />

            <div className="space-y-2">
              <span className="inline-block text-[10px] font-black uppercase tracking-[0.35em] text-mercurio-yellow">
                Fin de Año 2026
              </span>
              <h2 className="text-2xl font-black italic tracking-tight text-white">
                Tenés una Invitación Especial
              </h2>
            </div>

            <div className="pt-2 flex flex-col items-center gap-2 text-white/80 group-hover:text-mercurio-yellow transition-colors">
              <span className="text-[11px] font-black uppercase tracking-[0.22em]">
                Deslizá para abrir el telón
              </span>
              <div className="w-9 h-9 rounded-full bg-white/10 border border-mercurio-yellow/40 flex items-center justify-center animate-bounce text-mercurio-yellow">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Velo de penumbra ligero acelerado por GPU mientras el telón se abre */}
      <div
        ref={stageDimmerRef}
        className="fixed inset-0 bg-[#050c1d] pointer-events-none z-30 will-change-[opacity]"
        style={{ opacity: 0.55 }}
      />

      {/* =========================================================
          ESCENARIO STICKY + ESPACIADOR DE APERTURA DEL TELÓN
         ========================================================= */}
      <div className="relative">
        {/* Este contenedor queda fijo mientras se recorren los primeros 800px que abren el telón, y luego scrollea normalmente */}
        <div className="sticky top-0 min-h-screen flex flex-col justify-between relative overflow-hidden">
          {/* Barra superior con el gradiente característico de Promociones */}
          <div className="w-full h-1.5 mercurio-gradient-wave z-20 sticky top-0" />

          {/* Luces decorativas de fondo (estética Mercurio Promociones) */}
          <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay"
              style={{ backgroundImage: "url('/fondo.jpeg')" }}
            />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-mercurio-pink/25 blur-[120px] rounded-full" />
            <div className="absolute top-1/2 -left-24 w-80 h-80 bg-mercurio-yellow/15 blur-[100px] rounded-full" />
            <div className="absolute -bottom-24 right-1/4 w-96 h-96 bg-blue-500/20 blur-[120px] rounded-full" />
          </div>

          {/* Contenedor Principal Vertical tipo Tarjeta de Invitación */}
          <main
            ref={stageTransformRef}
            className="relative z-10 flex-1 flex items-center justify-center px-4 py-6 md:py-12 will-change-transform"
            style={{
              transform: "scale3d(0.93, 0.93, 1)",
              transformOrigin: "top center",
              backfaceVisibility: "hidden",
            }}
          >
            <div className="w-full max-w-xl rounded-[2.5rem] bg-gradient-to-b from-[#1a356e]/95 to-[#11224a]/98 border border-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5)] px-6 py-10 md:px-12 md:py-14 flex flex-col items-center text-center relative overflow-hidden">
              {/* Brillo interno superior */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

              {/* PRIMERA PANTALLA DE LA INVITACIÓN */}
              <div className="w-full min-h-[72vh] md:min-h-0 flex flex-col items-center justify-between gap-8 pb-6">
                {/* 1. Logo Mercurio Blanco */}
                <div className="pt-2">
                  <MercurioLogo className="h-16 md:h-20 w-auto mx-auto drop-shadow-md" />
                </div>

                {/* 2. Título Fiesta de Fin de Año */}
                <div className="space-y-3">
                  <span className="inline-block text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-mercurio-yellow px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                    Invitación Especial
                  </span>
                  <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic tracking-tighter leading-tight text-white">
                    <span className="inline-block px-2">Fiesta de</span> <br />
                    <span className="inline-block px-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/75">
                      Fin de Año
                    </span>
                  </h1>
                </div>

                {/* 3. Contador Regresivo en letras blancas (se modifica en vivo) */}
                <div className="w-full space-y-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-white/60">
                    Faltan para celebrar juntos
                  </p>
                  <div className="glass-dark rounded-2xl px-4 py-4 md:px-6 md:py-5 border border-white/25 shadow-inner">
                    <div className="flex items-center justify-center gap-2 sm:gap-4 text-white font-black tracking-tight">
                      <div className="flex flex-col items-center min-w-[54px] sm:min-w-[68px]">
                        <span className="text-2xl sm:text-4xl md:text-5xl tabular-nums leading-none">
                          {mounted ? timeLeft.days : "--"}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70 mt-1.5">
                          días
                        </span>
                      </div>

                      <span className="text-xl sm:text-3xl text-mercurio-yellow font-black -mt-4">
                        :
                      </span>

                      <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
                        <span className="text-2xl sm:text-4xl md:text-5xl tabular-nums leading-none">
                          {mounted ? pad(timeLeft.hours) : "--"}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70 mt-1.5">
                          hs
                        </span>
                      </div>

                      <span className="text-xl sm:text-3xl text-mercurio-yellow font-black -mt-4">
                        :
                      </span>

                      <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
                        <span className="text-2xl sm:text-4xl md:text-5xl tabular-nums leading-none">
                          {mounted ? pad(timeLeft.minutes) : "--"}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70 mt-1.5">
                          min
                        </span>
                      </div>

                      <span className="text-xl sm:text-3xl text-mercurio-pink font-black -mt-4">
                        :
                      </span>

                      <div className="flex flex-col items-center min-w-[48px] sm:min-w-[64px]">
                        <span className="text-2xl sm:text-4xl md:text-5xl tabular-nums leading-none text-mercurio-yellow">
                          {mounted ? pad(timeLeft.seconds) : "--"}
                        </span>
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70 mt-1.5">
                          seg
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botón indicador para seguir bajando a los datos */}
                <button
                  type="button"
                  onClick={handleScrollToDetails}
                  className="flex flex-col items-center gap-1.5 pt-2 text-white/60 hover:text-mercurio-yellow transition-colors group cursor-pointer"
                  aria-label="Ver datos de la fiesta"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.28em]">
                    Deslizá para ver los datos
                  </span>
                  <svg
                    className="w-5 h-5 animate-bounce text-mercurio-yellow"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </button>
              </div>

              {/* SEGUNDA PARTE: Revelado suave al bajar (Scroll Reveal) */}
              <div
                id="datos-fiesta"
                className="w-full space-y-9 pt-8 border-t border-white/10"
              >
                {/* 4. Fecha con separadores verticales como en el boceto */}
                <div className="reveal-item">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-3">
                    Agendá la fecha
                  </p>
                  <div className="inline-flex items-center justify-center border-x-2 border-white/40 px-4 sm:px-8 py-2">
                    <span className="text-3xl sm:text-5xl font-black tracking-tight px-3 sm:px-5">
                      12
                    </span>
                    <span className="reveal-divider h-10 sm:h-12 w-0.5 bg-mercurio-yellow/80" />
                    <span className="text-3xl sm:text-5xl font-black uppercase tracking-wider text-mercurio-yellow px-4 sm:px-6">
                      Dic
                    </span>
                    <span className="reveal-divider h-10 sm:h-12 w-0.5 bg-mercurio-yellow/80" />
                    <span className="text-3xl sm:text-5xl font-black tracking-tight px-3 sm:px-5">
                      2026
                    </span>
                  </div>
                </div>

                {/* Horario y Dirección */}
                <div
                  className="reveal-item space-y-4 text-white/90"
                  style={{ transitionDelay: "120ms" }}
                >
                  <div className="inline-flex items-center justify-center gap-2.5 text-lg sm:text-xl font-extrabold tracking-wide bg-white/5 px-5 py-2.5 rounded-full border border-white/10">
                    <svg
                      className="w-5 h-5 text-mercurio-yellow shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>20 hs a 3 hs</span>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-bold text-white/95 px-2">
                      <svg
                        className="w-5 h-5 text-mercurio-pink shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span>CICAE, Amado Aufranc 998, Esperanza.</span>
                    </div>

                    <div>
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=CICAE+Amado+Aufranc+998+Esperanza+Santa+Fe"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-mercurio-yellow/90 hover:text-mercurio-yellow underline underline-offset-4 transition-colors"
                      >
                        Cómo llegar en Google Maps ↗
                      </a>
                    </div>
                  </div>
                </div>

                {/* 5. Botón Confirmar Asistencia */}
                <div
                  className="reveal-item w-full pt-2 space-y-2.5"
                  style={{ transitionDelay: "220ms" }}
                >
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="w-full sm:w-auto sm:min-w-[300px] mx-auto mercurio-button-accent text-base sm:text-lg py-4 px-8"
                  >
                    <span>Responder Invitación</span>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2.5}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </button>
                  <p className="text-xs text-white/60 font-medium px-2">
                    Indicá si asistís o no, y si tenés requerimiento de menú (celíaco,
                    vegetariano o alérgico)
                  </p>
                </div>

                {/* 6. ¡TE ESPERAMOS! */}
                <div
                  className="reveal-item pt-6 border-t border-white/10 w-full"
                  style={{ transitionDelay: "320ms" }}
                >
                  <p className="text-2xl sm:text-3xl font-black italic tracking-widest uppercase text-white drop-shadow px-2">
                    ¡Te esperamos!
                  </p>
                </div>
              </div>
            </div>
          </main>

          {/* Footer minimalista con acceso al panel Admin */}
          <footer className="relative z-10 py-6 px-6 text-center text-[11px] font-bold uppercase tracking-widest text-white/35 flex flex-col sm:flex-row items-center justify-center gap-4">
            <span>© {new Date().getFullYear()} Mercurio Pinturerías</span>
            <span className="hidden sm:inline">•</span>
            <Link
              href="/admin"
              className="hover:text-mercurio-yellow transition-colors"
            >
              Panel de Asistencia
            </Link>
          </footer>
        </div>

        {/* Espaciador de recorrido de scroll para la apertura del telón */}
        <div
          style={{ height: `${CURTAIN_SCROLL_DISTANCE}px` }}
          className="pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Modal de Confirmación */}
      <RsvpModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
