import React from 'react';
import { Flame, ShieldAlert, Cpu } from 'lucide-react';
import { QAState, ViewRoute } from '../types';

interface FooterProps {
  onNavigate: (view: ViewRoute) => void;
  qaState: QAState;
  onToggleApiFailure: () => void;
  onToggleChatbotFailure: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate,
  qaState,
  onToggleApiFailure,
  onToggleChatbotFailure,
}) => {
  return (
    <footer className="mt-16 border-t border-[#1E293B] bg-[#080B13]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Brand & Info */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#2563EB] to-[#00E5FF] text-[#0B0F19]">
                <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              <span className="font-display text-base font-bold text-white">Global Flame</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-400">
              Comparador centralizado de ofertas digitales de videojuegos para Colombia. Todos los
              precios se calculan y presentan en pesos colombianos (COP) comparando tiendas oficiales.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-slate-300">
              <button type="button" onClick={() => onNavigate('home')} className="hover:text-[#00E5FF]">
                Inicio
              </button>
              <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#00E5FF]">
                Ofertas y Catálogo
              </button>
              <button type="button" onClick={() => onNavigate('news')} className="hover:text-[#00E5FF]">
                Novedades
              </button>
              <button type="button" onClick={() => onNavigate('profile')} className="hover:text-[#00E5FF]">
                Favoritos y Alertas
              </button>
            </div>
          </div>

          {/* RNF08: Discreet Academic QA / Fault Tolerance Simulator */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#1E293B] bg-[#131B2E]/60 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Cpu className="h-4 w-4 text-[#00E5FF]" aria-hidden="true" />
                <span>Simulador de Estado del Sistema / QA (RNF08)</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">
                Controles de tolerancia a fallos para pruebas de fiabilidad sin interrumpir la
                navegación principal.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-[#1E293B] bg-[#0B0F19]/80 px-3.5 py-2.5 cursor-pointer hover:border-[#2563EB]/60 transition-colors">
                  <span className="text-xs font-medium text-slate-200">
                    Simular fallo de API externa
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={qaState.simulateApiFailure}
                    onClick={onToggleApiFailure}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      qaState.simulateApiFailure ? 'bg-amber-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        qaState.simulateApiFailure ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-[#1E293B] bg-[#0B0F19]/80 px-3.5 py-2.5 cursor-pointer hover:border-[#2563EB]/60 transition-colors">
                  <span className="text-xs font-medium text-slate-200">
                    Simular fallo del Chatbot IA
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={qaState.simulateChatbotFailure}
                    onClick={onToggleChatbotFailure}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      qaState.simulateChatbotFailure ? 'bg-rose-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        qaState.simulateChatbotFailure ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {(qaState.simulateApiFailure || qaState.simulateChatbotFailure) && (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-300">
                  <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {qaState.simulateApiFailure && 'Modo Caché activo. '}
                    {qaState.simulateChatbotFailure && 'Asistente IA deshabilitado temporalmente.'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-[#1E293B] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center">
          <p>© 2026 Global Flame Colombia. Prototipo funcional de comparación de ofertas en COP.</p>
          <p>Arquitectura local estructurada · Estándar ISO/IEC 25010</p>
        </div>
      </div>
    </footer>
  );
};
