import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ArrowRight, Bot, MessageSquare, Send, X } from 'lucide-react';
import { ChatMessage } from '../types';
import { processChatbotQuery } from '../services/chatbotService';
import { getGameById } from '../services/databaseService';
import { formatCOP } from '../utils/formatters';

interface ChatbotWidgetProps {
  isChatbotDisabled: boolean;
  onSelectGame: (gameId: string) => void;
}

const SUGGESTIONS = [
  '¿Qué juegos de RPG están en oferta?',
  '¿Cuánto cuesta Cyberpunk 2077?',
  'Recomiéndame un juego barato para PC',
  '¿Hay juegos gratis?',
];

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  isChatbotDisabled,
  onSelectGame,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: '¡Hola! Soy el asistente de ofertas de Global Flame. Pregúntame por precios en COP, géneros, plataformas o juegos disponibles en nuestro catálogo.',
      timestamp: new Date().toISOString(),
    },
  ]);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendMessage = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    const reply = processChatbotQuery(trimmed);
    const botMsg: ChatMessage = {
      id: `b-${Date.now() + 1}`,
      sender: 'bot',
      text: reply.text,
      timestamp: new Date().toISOString(),
      recommendedGameIds: reply.recommendedGameIds,
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="fixed right-4 bottom-4 z-40 sm:right-6 sm:bottom-6">
      {isOpen && (
        <div
          className="mb-3 flex h-[480px] max-h-[75vh] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-[#33251D] bg-[#1D1511] shadow-2xl"
          role="dialog"
          aria-label="Asistente de ofertas Global Flame"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#33251D] bg-[#120D0A] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EA580C] text-white">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-display text-sm font-bold text-white">
                  Asistente Global Flame
                </h3>
                <p className="text-[11px] text-[#A89789]">
                  {isChatbotDisabled ? 'Servicio en mantenimiento' : 'Consultas sobre catálogo COP'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-[#A89789] hover:bg-[#33251D] hover:text-white"
              aria-label="Cerrar asistente"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {isChatbotDisabled ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h4 className="font-display mt-3 text-base font-bold text-white">
                Asistente IA no disponible temporalmente
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-[#D6C7BA]">
                El módulo conversacional está deshabilitado por la simulación de fallo (RNF08). El
                buscador, los filtros combinables y las ofertas del catálogo siguen funcionando al
                100%.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                        msg.sender === 'user'
                          ? 'rounded-br-sm bg-[#EA580C] text-white'
                          : 'rounded-bl-sm border border-[#33251D] bg-[#150F0B] text-[#FAF5F0]'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {msg.recommendedGameIds && msg.recommendedGameIds.length > 0 && (
                      <div className="mt-2 flex w-full max-w-[88%] flex-col gap-1.5">
                        {msg.recommendedGameIds.map((gid) => {
                          const g = getGameById(gid);
                          if (!g) return null;
                          return (
                            <button
                              key={gid}
                              type="button"
                              onClick={() => onSelectGame(gid)}
                              className="flex items-center justify-between gap-2 rounded-lg border border-[#33251D] bg-[#150F0B] px-3 py-2 text-left text-xs hover:border-[#F59E0B] transition-colors"
                            >
                              <div className="min-w-0">
                                <span className="block truncate font-semibold text-white">
                                  {g.title}
                                </span>
                                <span className="font-mono-num text-[11px] text-[#F59E0B]">
                                  {formatCOP(g.finalPriceCop)}
                                </span>
                              </div>
                              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-[#A89789]" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
                <div ref={listEndRef} />
              </div>

              <div className="flex gap-1.5 overflow-x-auto border-t border-[#33251D] bg-[#150F0B] px-3 py-2">
                {SUGGESTIONS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => sendMessage(sug)}
                    className="rounded-lg border border-[#33251D] bg-[#1D1511] px-2.5 py-1 text-[11px] text-[#D6C7BA] hover:border-[#F59E0B] hover:text-white whitespace-nowrap shrink-0"
                  >
                    {sug}
                  </button>
                ))}
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 border-t border-[#33251D] bg-[#120D0A] p-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta por juegos o precios COP..."
                  aria-label="Consulta al asistente"
                  className="h-9 flex-1 rounded-lg border border-[#33251D] bg-[#1D1511] px-3 text-xs text-white placeholder-[#A89789] focus:border-[#F59E0B] focus:outline-none"
                />
                <button
                  type="submit"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EA580C] text-white hover:bg-[#C2410C] transition-colors"
                  aria-label="Enviar consulta"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Cerrar chat asistente' : 'Abrir asistente de ofertas Global Flame'}
        className={`ml-auto flex h-13 items-center gap-2.5 rounded-full px-4 text-sm font-semibold shadow-2xl transition-transform hover:scale-105 ${
          isChatbotDisabled
            ? 'border border-red-500/60 bg-[#1D1511] text-red-300'
            : 'bg-gradient-to-r from-[#EA580C] to-[#D97706] text-white shadow-[#EA580C]/35'
        }`}
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
        <span className="hidden sm:inline">{isOpen ? 'Cerrar chat' : 'Asistente IA'}</span>
      </button>
    </div>
  );
};
