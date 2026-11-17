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
    <footer className="mt-16 border-t border-[#33251D] bg-[#0D0907]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#EA580C] to-[#F59E0B] text-[#120D0A]">
                <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              <span className="font-display text-base font-bold text-white">Global Flame</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-[#A89789]">
              Comparador centralizado de ofertas digitales de videojuegos para Colombia integrado con
              CheapShark API. Precios en pesos colombianos (COP) y reseñas de la comunidad.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs font-medium text-[#D6C7BA]">
              <button type="button" onClick={() => onNavigate('home')} className="hover:text-[#F59E0B]">
                Inicio
              </button>
              <button type="button" onClick={() => onNavigate('catalog')} className="hover:text-[#F59E0B]">
                Ofertas y Catálogo
              </button>
              <button type="button" onClick={() => onNavigate('news')} className="hover:text-[#F59E0B]">
                Novedades
              </button>
              <button type="button" onClick={() => onNavigate('profile')} className="hover:text-[#F59E0B]">
                Perfil y Administración
              </button>
            </div>
          </div>

          {/* RNF08: Academic QA Simulator */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-[#33251D] bg-[#1D1511]/70 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#FAF5F0]">
                <Cpu className="h-4 w-4 text-[#F59E0B]" aria-hidden="true" />
                <span>Simulador de Estado del Sistema / QA (RNF08)</span>
              </div>
              <p className="mt-1 text-xs text-[#A89789]">
                Controles de tolerancia a fallos para pruebas de fiabilidad sin interrumpir la
                navegación principal.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 rounded-lg border border-[#33251D] bg-[#150F0B] px-3.5 py-2.5 cursor-pointer hover:border-[#EA580C]/60 transition-colors">
                  <span className="text-xs font-medium text-[#D6C7BA]">
                    Simular fallo de API externa
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={qaState.simulateApiFailure}
                    onClick={onToggleApiFailure}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      qaState.simulateApiFailure ? 'bg-amber-500' : 'bg-[#33251D]'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        qaState.simulateApiFailure ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between gap-3 rounded-lg border border-[#33251D] bg-[#150F0B] px-3.5 py-2.5 cursor-pointer hover:border-[#EA580C]/60 transition-colors">
                  <span className="text-xs font-medium text-[#D6C7BA]">
                    Simular fallo del Chatbot IA
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={qaState.simulateChatbotFailure}
                    onClick={onToggleChatbotFailure}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                      qaState.simulateChatbotFailure ? 'bg-red-600' : 'bg-[#33251D]'
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

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-[#33251D] pt-6 text-xs text-[#8C7A6B] sm:flex-row sm:items-center">
          <p>© 2026 Global Flame Colombia. Comparador de ofertas en COP integrado con CheapShark.</p>
          <p>Arquitectura multi-HTML · Base de datos local y Excel AppSheet</p>
        </div>
      </div>
    </footer>
  );
};
