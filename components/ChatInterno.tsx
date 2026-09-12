'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Check } from 'lucide-react';

interface Mensaje {
  id: string;
  remitente: string;
  texto: string;
  hora: string;
}

export default function ChatInterno() {
  const [abierto, setAbierto] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [tempNombre, setTempNombre] = useState('');
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Cargar nombre de usuario y mensajes al iniciar de forma segura
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const usuarioGuardado = localStorage.getItem('corralon_chat_usuario');
      if (usuarioGuardado) {
        setNombreUsuario(usuarioGuardado);
        setTempNombre(usuarioGuardado);
      } else {
        setEditandoNombre(true); // Forzamos pedir nombre con un input interno
      }

      const msgsGuardados = localStorage.getItem('corralon_chat_mensajes');
      if (msgsGuardados) {
        try {
          setMensajes(JSON.parse(msgsGuardados));
        } catch (e) {
          console.error(e);
        }
      }

      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'corralon_chat_mensajes' && e.newValue) {
          setMensajes(JSON.parse(e.newValue));
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (abierto) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajes, abierto]);

  const guardarNombre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNombre.trim()) return;
    const finalName = tempNombre.trim();
    setNombreUsuario(finalName);
    localStorage.setItem('corralon_chat_usuario', finalName);
    setEditandoNombre(false);
  };

  const enviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !nombreUsuario) return;

    const mensajeNuevo: Mensaje = {
      id: Date.now().toString(),
      remitente: nombreUsuario,
      texto: nuevoMensaje.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const actualizados = [...mensajes, mensajeNuevo];
    setMensajes(actualizados);
    localStorage.setItem('corralon_chat_mensajes', JSON.stringify(actualizados));
    setNuevoMensaje('');
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!abierto ? (
        <button
          onClick={() => setAbierto(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer font-bold relative group"
          title="Abrir chat interno"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono shadow">
            {mensajes.length}
          </span>
        </button>
      ) : (
        <div className="bg-slate-900 border border-slate-800 w-80 sm:w-96 h-[460px] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header del Chat */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Chat Interno - Corralón</h3>
            </div>
            <div className="flex items-center gap-2">
              {nombreUsuario && !editandoNombre && (
                <button 
                  onClick={() => setEditandoNombre(true)}
                  className="text-[10px] text-amber-400 hover:underline cursor-pointer"
                  title="Cambiar mi nombre"
                >
                  ({nombreUsuario})
                </button>
              )}
              <button
                onClick={() => setAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo: Si no hay nombre configurado, mostramos el formulario de configuración */}
          {editandoNombre ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950">
              <User className="w-10 h-10 text-amber-500 bg-amber-500/10 p-2 rounded-2xl border border-amber-500/20" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">¿Cómo te llamas o qué rol usas?</h4>
                <p className="text-xs text-slate-400">Ej: Admin, Operativo Juan, Caja Pilar</p>
              </div>
              <form onSubmit={guardarNombre} className="w-full space-y-3">
                <input
                  type="text"
                  placeholder="Tu nombre o rol..."
                  value={tempNombre}
                  onChange={(e) => setTempNombre(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3.5 py-3 focus:outline-none focus:border-amber-500 text-center font-medium"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Entrar al Chat
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Mensajes */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-950/50">
                {mensajes.length > 0 ? (
                  mensajes.map((msg) => {
                    const esMio = msg.remitente === nombreUsuario;
                    return (
                      <div key={msg.id} className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}>
                        <span className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
                          <User className="w-3 h-3 text-amber-500" /> {msg.remitente} • {msg.hora}
                        </span>
                        <div className={`p-3 rounded-2xl text-xs max-w-[85%] ${
                          esMio 
                            ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none' 
                            : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/50'
                        }`}>
                          {msg.texto}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    No hay mensajes aún. ¡Escribe el primero!
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input para escribir */}
              <form onSubmit={enviarMensaje} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-2.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  );
}