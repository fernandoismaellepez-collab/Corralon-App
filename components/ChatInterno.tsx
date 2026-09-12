'use client';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, User, Check, Smile, Edit2, Trash2, Bell, RefreshCw, VolumeX } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';

interface Mensaje {
  id: string;
  remitente: string;
  texto: string;
  hora: string;
  editado?: boolean;
  esZumbido?: boolean;
}

const EMOJIS_POPULARES = [
  '🧱', '🏗️', '🪨', '🏚️', '🛠️', '⛏️', '⚒️', '🔩', '⚙️', '⛓️', '📏', '📐',
  '🚚', '🚛', '🚜', '📦', '📋', '📍', '🗺️', '⏱️', '🔑',
  '💰', '💵', '💳', '🧾', '📊', '📈', '✔️', '❌', '⚠️', '🚨', '⚡', '🔥',
  '👍', '👎', '🤝', '👏', '🙌', '💪', '🙏', '👀', '💬', '📢', '⏰', '✨'
];

export default function ChatInterno() {
  const { mensajesChat = [], enviarMensajeChat, actualizarMensajeChat, eliminarMensajeChat, forzarSincronizacionChat } = useInventario() as any;

  const [abierto, setAbierto] = useState(false);
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [tempNombre, setTempNombre] = useState('');
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [mostrarEmojis, setMostrarEmojis] = useState(false);
  const [mensajeEditandoId, setMensajeEditandoId] = useState<string | null>(null);
  
  const [hayZumbidoActivo, setHayZumbidoActivo] = useState(false);
  const [ultimoIdLeido, setUltimoIdLeido] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const osciladorRef = useRef<OscillatorNode | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const usuarioGuardado = localStorage.getItem('corralon_chat_usuario');
      if (usuarioGuardado) {
        setNombreUsuario(usuarioGuardado);
        setTempNombre(usuarioGuardado);
      } else {
        setEditandoNombre(true);
      }
      
      const leidoLocal = localStorage.getItem('corralon_ultimo_id_leido');
      if (leidoLocal) setUltimoIdLeido(leidoLocal);
    }
  }, []);

  // Detectar zumbidos SOLO si fueron enviados por OTRO usuario
  useEffect(() => {
    if (mensajesChat.length > 0 && nombreUsuario) {
      const ultimoMsg = mensajesChat[mensajesChat.length - 1];
      
      // Condición clave: Es zumbido, NO lo envié yo, y es más nuevo que el último leído
      if (ultimoMsg.esZumbido && ultimoMsg.remitente !== nombreUsuario && ultimoMsg.id !== ultimoIdLeido) {
        setHayZumbidoActivo(true);
        reproducirSonidoZumbido();
        if (!abierto) {
          setAbierto(true);
        }
      }
    }
  }, [mensajesChat, abierto, ultimoIdLeido, nombreUsuario]);

  const abrirChat = () => {
    setAbierto(true);
    detenerZumbido();
    if (mensajesChat.length > 0) {
      const idUltimo = mensajesChat[mensajesChat.length - 1].id;
      setUltimoIdLeido(idUltimo);
      if (typeof window !== 'undefined') {
        localStorage.setItem('corralon_ultimo_id_leido', idUltimo);
      }
    }
  };

  const reproducirSonidoZumbido = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      if (osciladorRef.current) {
        try { osciladorRef.current.stop(); } catch(e){}
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osciladorRef.current = osc;
    } catch (e) {
      console.error(e);
    }
  };

  const detenerZumbido = () => {
    setHayZumbidoActivo(false);
    if (osciladorRef.current) {
      try {
        osciladorRef.current.stop();
        osciladorRef.current = null;
      } catch (e) {
        console.error(e);
      }
    }
    if (mensajesChat.length > 0) {
      const idUltimo = mensajesChat[mensajesChat.length - 1].id;
      setUltimoIdLeido(idUltimo);
      if (typeof window !== 'undefined') {
        localStorage.setItem('corralon_ultimo_id_leido', idUltimo);
      }
    }
  };

  useEffect(() => {
    if (abierto) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [mensajesChat, abierto]);

  const mensajesNoLeidos = mensajesChat.filter((m: any) => {
    if (!ultimoIdLeido) return true;
    const indexUltimo = mensajesChat.findIndex((msg: any) => msg.id === ultimoIdLeido);
    const indexActual = mensajesChat.findIndex((msg: any) => msg.id === m.id);
    return indexActual > indexUltimo;
  }).length;

  const guardarNombre = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempNombre.trim()) return;
    const finalName = tempNombre.trim();
    setNombreUsuario(finalName);
    localStorage.setItem('corralon_chat_usuario', finalName);
    setEditandoNombre(false);
  };

  const manejarEnvio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !nombreUsuario) return;

    if (mensajeEditandoId) {
      if (actualizarMensajeChat) {
        actualizarMensajeChat(mensajeEditandoId, nuevoMensaje.trim());
      }
      setMensajeEditandoId(null);
    } else {
      if (enviarMensajeChat) {
        enviarMensajeChat({
          remitente: nombreUsuario,
          texto: nuevoMensaje.trim(),
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          esZumbido: false
        });
      }
    }
    setNuevoMensaje('');
    setMostrarEmojis(false);
  };

  const enviarZumbido = () => {
    if (!nombreUsuario) return;
    if (enviarMensajeChat) {
      enviarMensajeChat({
        remitente: nombreUsuario,
        texto: '⚡ ¡ZUMBIDO! ATENCIÓN REQUERIDA ⚡',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        esZumbido: true
      });
    }
  };

  const actualizarChatManual = async () => {
    if (forzarSincronizacionChat) {
      await forzarSincronizacionChat();
    }
  };

  const iniciarEdicion = (msg: Mensaje) => {
    setMensajeEditandoId(msg.id);
    setNuevoMensaje(msg.texto);
  };

  const cancelarEdicion = () => {
    setMensajeEditandoId(null);
    setNuevoMensaje('');
  };

  const agregarEmoji = (emoji: string) => {
    setNuevoMensaje(prev => prev + emoji);
    setMostrarEmojis(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {!abierto ? (
        <button
          onClick={abrirChat}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer font-bold relative group animate-bounce"
          title="Abrir chat interno"
        >
          <MessageSquare className="w-6 h-6" />
          {mensajesNoLeidos > 0 && (
            <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-mono shadow animate-pulse">
              {mensajesNoLeidos}
            </span>
          )}
        </button>
      ) : (
        <div className={`bg-slate-900 border border-slate-800 w-80 sm:w-96 h-[490px] rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all ${hayZumbidoActivo ? 'ring-4 ring-rose-500 animate-pulse' : ''}`}>
          {/* Header */}
          <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Chat Interno</h3>
            </div>
            <div className="flex items-center gap-2">
              {hayZumbidoActivo && (
                <button
                  onClick={detenerZumbido}
                  className="bg-rose-600 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-bounce cursor-pointer"
                  title="Silenciar zumbido"
                >
                  <VolumeX className="w-3 h-3" /> Silenciar
                </button>
              )}
              <button
                onClick={actualizarChatManual}
                className="text-slate-400 hover:text-amber-400 p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                title="Actualizar mensajes nuevos"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={enviarZumbido}
                className="text-amber-400 hover:text-amber-300 p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors"
                title="Enviar Zumbido de alerta"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>
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
                onClick={() => {
                  detenerZumbido();
                  setAbierto(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {editandoNombre ? (
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4 bg-slate-950">
              <User className="w-10 h-10 text-amber-500 bg-amber-500/10 p-2 rounded-2xl border border-amber-500/20" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">¿Cómo te llamas o qué rol usas?</h4>
                <p className="text-xs text-slate-400">Ej: Admin, Fer, Fati</p>
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
                {mensajesChat.length > 0 ? (
                  mensajesChat.map((msg: any) => {
                    const esMio = msg.remitente === nombreUsuario;
                    const esZ = msg.esZumbido;
                    return (
                      <div key={msg.id} className={`flex flex-col group ${esMio ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <User className="w-3 h-3 text-amber-500" /> {msg.remitente} • {msg.hora} {msg.editado && '(editado)'}
                          </span>
                          {esMio && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <button 
                                onClick={() => iniciarEdicion(msg)}
                                className="text-slate-400 hover:text-amber-400 p-0.5 cursor-pointer"
                                title="Editar mensaje"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => eliminarMensajeChat && eliminarMensajeChat(msg.id)}
                                className="text-slate-400 hover:text-rose-400 p-0.5 cursor-pointer"
                                title="Eliminar mensaje"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={`p-3 rounded-2xl text-xs max-w-[85%] relative ${
                          esZ
                            ? 'bg-rose-600 text-white font-bold shadow-lg border border-rose-400'
                            : esMio 
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

              {/* Selector de Emojis */}
              {mostrarEmojis && (
                <div className="bg-slate-900 border-t border-slate-800 p-2.5 grid grid-cols-8 gap-1.5 text-center max-h-40 overflow-y-auto">
                  {EMOJIS_POPULARES.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => agregarEmoji(emoji)}
                      className="hover:bg-slate-800 hover:scale-110 p-1.5 rounded-lg text-lg cursor-pointer transition-all"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {mensajeEditandoId && (
                <div className="bg-amber-500/10 border-t border-amber-500/30 px-3 py-1.5 flex items-center justify-between text-[11px] text-amber-400">
                  <span>Editando mensaje...</span>
                  <button onClick={cancelarEdicion} className="underline hover:text-white cursor-pointer">Cancelar</button>
                </div>
              )}

              {/* Formulario */}
              <form onSubmit={manejarEnvio} className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarEmojis(!mostrarEmojis)}
                  className="text-slate-400 hover:text-amber-400 p-2 rounded-xl hover:bg-slate-900 cursor-pointer transition-colors"
                  title="Insertar emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  placeholder={mensajeEditandoId ? "Modifica tu mensaje..." : "Escribe un mensaje..."}
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