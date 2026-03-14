import { useState, useEffect, useRef } from 'react'
import { Send, Trash2, MessageCircle, Sparkles, X, Plus, ShoppingCart, CreditCard, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { fechaRelativa } from '../lib/utils'

const ACCIONES_RAPIDAS = [
  { label: 'Agregar producto', icon: Plus, msg: 'Quiero agregar un producto nuevo' },
  { label: 'Registrar venta', icon: ShoppingCart, msg: 'Vendí un producto' },
  { label: 'Venta a crédito', icon: CreditCard, msg: 'Una clienta se llevó algo a crédito' },
  { label: 'Registrar abono', icon: DollarSign, msg: 'Una clienta me abonó' },
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
  const [confirmarLimpiar, setConfirmarLimpiar] = useState(false)
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
    try {
      await api.delete('/api/chat/historial')
      setMensajes([])
      setConfirmarLimpiar(false)
      toast.success('Historial limpiado')
    } catch { toast.error('Error limpiando historial') }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() }
  }

  const vacio = !loading && mensajes.length === 0

  return (
    <div className="flex flex-col h-[calc(100svh-56px-64px)] md:h-[calc(100svh-100px)] max-w-2xl mx-auto">

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
        <button onClick={() => setConfirmarLimpiar(true)}
          className="p-2 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Limpiar historial">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Acciones rápidas — siempre visibles */}
      <div className="px-4 pt-3 pb-2 bg-[#F5F3FF] border-b border-purple-100 flex-shrink-0">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ACCIONES_RAPIDAS.map(({ label, icon: Icon, msg }) => (
            <button key={label} onClick={() => enviar(msg)} disabled={enviando}
              className="flex-shrink-0 flex items-center gap-1.5 bg-white border border-purple-200 rounded-full px-4 py-2 text-sm font-bold text-[#7C3AED] hover:bg-[#7C3AED] hover:text-white hover:border-[#7C3AED] transition-colors disabled:opacity-50 shadow-sm">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
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
                Usa los botones de arriba o cuéntame lo que pasó en tu negocio.
              </p>
            </div>
          </div>
        ) : (
          mensajes.map((m, i) => <Burbuja key={i} msg={m} />)
        )}
        {enviando && <BurbujaTyping />}
        <div ref={bottomRef} />
      </div>

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

      {/* Modal confirmar limpiar historial */}
      {confirmarLimpiar && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl shadow-xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">¿Limpiar historial?</h2>
                <button onClick={() => setConfirmarLimpiar(false)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-red-50 rounded-xl p-4 mb-5">
                <p className="text-sm text-gray-700">Se borrarán todos los mensajes del chat. La IA no recordará conversaciones anteriores.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmarLimpiar(false)}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">
                  Cancelar
                </button>
                <button onClick={limpiarHistorial}
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600">
                  Limpiar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
