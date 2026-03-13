import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, MessageCircle, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { fechaRelativa } from '../lib/utils'

const SUGERENCIAS = [
  'Vendí una blusa rosada talla M en $35.000',
  '¿Cuánto tengo en inventario?',
  'Ana García me abonó $20.000',
  'Llegó el pedido de Temu con 5 blusas',
  'Registra una deuda de Claudia López por $80.000',
  '¿Quién me debe más?',
]

function Burbuja({ msg }) {
  const esIA = msg.rol === 'assistant'
  return (
    <div className={`flex gap-2 ${esIA ? 'justify-start' : 'justify-end'}`}>
      {esIA && (
        <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0 mt-1">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
        esIA
          ? 'bg-white border border-purple-100 text-gray-800 rounded-tl-none shadow-sm'
          : 'bg-[#7C3AED] text-white rounded-tr-none'
      }`}>
        <p className="whitespace-pre-wrap">{msg.contenido}</p>
        <p className={`text-xs mt-1.5 ${esIA ? 'text-gray-400' : 'text-white/60'}`}>
          {fechaRelativa(msg.createdAt || new Date())}
        </p>
      </div>
    </div>
  )
}

function BurbujaTyping() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="w-8 h-8 rounded-full bg-[#7C3AED] flex items-center justify-center flex-shrink-0">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-purple-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-2 h-2 rounded-full bg-[#7C3AED] opacity-60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Chat() {
  const [mensajes, setMensajes] = useState([])
  const [input, setInput] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  const cargarHistorial = () => {
    api.get('/api/chat/historial')
      .then(r => setMensajes(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargarHistorial() }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, enviando])

  const enviar = async (texto) => {
    const msg = texto || input.trim()
    if (!msg || enviando) return
    setInput('')
    setEnviando(true)
    const msgUsuario = { rol: 'user', contenido: msg, createdAt: new Date() }
    setMensajes(prev => [...prev, msgUsuario])
    try {
      const { data } = await api.post('/api/chat/enviar', { mensaje: msg })
      setMensajes(prev => [...prev, { rol: 'assistant', contenido: data.respuesta, createdAt: new Date() }])
    } catch (err) {
      toast.error('Error al enviar mensaje')
      setMensajes(prev => [...prev, {
        rol: 'assistant',
        contenido: 'Hubo un problema al conectar con la IA. Intenta de nuevo 💜',
        createdAt: new Date()
      }])
    } finally {
      setEnviando(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const limpiarHistorial = async () => {
    if (!confirm('¿Limpiar todo el historial del chat?')) return
    try {
      await api.delete('/api/chat/historial')
      setMensajes([])
      toast.success('Historial limpiado')
    } catch { toast.error('Error limpiando historial') }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const vacio = !loading && mensajes.length === 0

  return (
    <div className="flex flex-col h-[calc(100dvh-112px)] md:h-[calc(100dvh-56px)] max-w-2xl mx-auto">
      {/* Header chat */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-purple-100 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#7C3AED] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-black text-gray-900 text-base leading-tight">Asistente IA</p>
            <p className="text-xs text-emerald-500 font-semibold">● En línea</p>
          </div>
        </div>
        {mensajes.length > 0 && (
          <button onClick={limpiarHistorial} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-[#F5F3FF]">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-[#7C3AED] border-t-transparent animate-spin" />
          </div>
        ) : vacio ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 pt-8">
            <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-[#7C3AED]" />
            </div>
            <div>
              <p className="font-black text-gray-900 text-lg">¡Hola! Soy tu asistente 💜</p>
              <p className="text-gray-500 text-sm mt-1 max-w-xs">
                Cuéntame lo que pasó en tu negocio y yo lo registro. También puedes preguntarme sobre tus ventas, deudas o inventario.
              </p>
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => <Burbuja key={i} msg={m} />)
        )}
        {enviando && <BurbujaTyping />}
        <div ref={bottomRef} />
      </div>

      {/* Sugerencias */}
      {vacio && (
        <div className="px-4 py-2 bg-[#F5F3FF] flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {SUGERENCIAS.map(s => (
              <button key={s} onClick={() => enviar(s)} disabled={enviando}
                className="flex-shrink-0 bg-white border border-purple-100 rounded-full px-4 py-2 text-sm font-semibold text-[#7C3AED] hover:bg-purple-50 hover:border-[#7C3AED] transition-colors disabled:opacity-50 shadow-sm">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-purple-100 flex-shrink-0">
        <div className="flex gap-2 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cuéntame lo que pasó..."
            rows={1}
            disabled={enviando}
            className="flex-1 resize-none px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-60 max-h-28"
            style={{ minHeight: '48px' }}
            onInput={e => {
              e.target.style.height = 'auto'
              e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px'
            }}
          />
          <button
            onClick={() => enviar()}
            disabled={!input.trim() || enviando}
            className="w-12 h-12 rounded-2xl bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#5B21B6] transition-colors disabled:opacity-40 flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
