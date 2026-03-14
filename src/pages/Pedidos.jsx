import { useState, useEffect } from 'react'
import { ShoppingBag, Plus, X, ChevronDown, DollarSign, Minus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { formatCOP, fechaRelativa, getIniciales, colorEstadoTemu, labelEstadoTemu, colorEstadoCliente, labelEstadoCliente } from '../lib/utils'

const ESTADOS_TEMU = ['pendiente', 'pedido_en_temu', 'en_camino', 'llego', 'entregado', 'cancelado']
const ESTADOS_CLIENTE = ['en_curso', 'llego', 'entregado', 'cancelado']
const CANTIDADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30]

const ESTADOS_TEMU_LABELS = {
  pendiente: '🕐 Sin pedir aún',
  pedido_en_temu: '🛒 Pedido en Temu',
  en_camino: '🚚 En camino',
  llego: '📦 Llegó — listo',
  entregado: '✅ Entregado',
  cancelado: '❌ Cancelado',
}

const ESTADOS_CLIENTE_LABELS = {
  en_curso: '🕐 En curso',
  llego: '📦 Llegó — listo para entregar',
  entregado: '✅ Entregado',
  cancelado: '❌ Cancelado',
}

export default function Pedidos() {
  const [tab, setTab] = useState('encargos')
  const [encargos, setEncargos] = useState([])
  const [pedidosTemu, setPedidosTemu] = useState([])
  const [loadingEncargos, setLoadingEncargos] = useState(true)
  const [loadingTemu, setLoadingTemu] = useState(true)
  const [modalPedido, setModalPedido] = useState(null)
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [montoAbono, setMontoAbono] = useState('')
  const [mostrarFormEncargo, setMostrarFormEncargo] = useState(false)
  const [mostrarFormTemu, setMostrarFormTemu] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [mostrarSelectorCantidad, setMostrarSelectorCantidad] = useState(false)

  const [formEncargo, setFormEncargo] = useState({
    clienteNombre: '', clienteTelefono: '', descripcion: '',
    talla: '', color: '', cantidad: 1, totalVenta: '', abonoInicial: '', notas: ''
  })
  const [formTemu, setFormTemu] = useState({
    descripcion: '', categoria: '', talla: '', color: '',
    cantidad: 1, precioEstimado: '', linkTemu: '', notas: ''
  })
  const [mostrarSelectorCantidadTemu, setMostrarSelectorCantidadTemu] = useState(false)

  const cargarEncargos = () => {
    setLoadingEncargos(true)
    api.get('/api/pedidos-cliente').then(r => setEncargos(r.data)).catch(() => toast.error('Error cargando encargos')).finally(() => setLoadingEncargos(false))
  }
  const cargarTemu = () => {
    setLoadingTemu(true)
    api.get('/api/pedidos').then(r => setPedidosTemu(r.data)).catch(() => toast.error('Error cargando pedidos Temu')).finally(() => setLoadingTemu(false))
  }

  useEffect(() => { cargarEncargos(); cargarTemu() }, [])

  const crearEncargo = async (e) => {
    e.preventDefault()
    if (!formEncargo.clienteNombre || !formEncargo.descripcion || !formEncargo.totalVenta) {
      toast.error('Nombre, descripción y total son obligatorios'); return
    }
    setGuardando(true)
    try {
      await api.post('/api/pedidos-cliente', {
        cliente: { nombre: formEncargo.clienteNombre, telefono: formEncargo.clienteTelefono || undefined },
        descripcion: `${formEncargo.cantidad > 1 ? formEncargo.cantidad + 'x ' : ''}${formEncargo.descripcion}`,
        talla: formEncargo.talla || undefined,
        color: formEncargo.color || undefined,
        totalVenta: parseFloat(formEncargo.totalVenta) || 0,
        abonoInicial: formEncargo.abonoInicial ? parseFloat(formEncargo.abonoInicial) : undefined,
        notas: formEncargo.notas || undefined,
      })
      toast.success('¡Encargo registrado!')
      setMostrarFormEncargo(false)
      setFormEncargo({ clienteNombre: '', clienteTelefono: '', descripcion: '', talla: '', color: '', cantidad: 1, totalVenta: '', abonoInicial: '', notas: '' })
      cargarEncargos()
    } catch (err) { toast.error(err.response?.data?.error || 'Error guardando') }
    finally { setGuardando(false) }
  }

  const crearTemu = async (e) => {
    e.preventDefault()
    if (!formTemu.descripcion) { toast.error('La descripción es obligatoria'); return }
    setGuardando(true)
    try {
      await api.post('/api/pedidos', {
        descripcion: `${formTemu.cantidad > 1 ? formTemu.cantidad + 'x ' : ''}${formTemu.descripcion}`,
        categoria: formTemu.categoria || undefined,
        talla: formTemu.talla || undefined,
        color: formTemu.color || undefined,
        precioEstimado: formTemu.precioEstimado ? parseFloat(formTemu.precioEstimado) : undefined,
        linkTemu: formTemu.linkTemu || undefined,
        notas: formTemu.notas || undefined,
      })
      toast.success('¡Pedido a Temu registrado!')
      setMostrarFormTemu(false)
      setFormTemu({ descripcion: '', categoria: '', talla: '', color: '', cantidad: 1, precioEstimado: '', linkTemu: '', notas: '' })
      cargarTemu()
    } catch (err) { toast.error(err.response?.data?.error || 'Error guardando') }
    finally { setGuardando(false) }
  }

  const actualizarEstado = async (id, estado, tipo) => {
    try {
      const ruta = tipo === 'encargo' ? `/api/pedidos-cliente/${id}/estado` : `/api/pedidos/${id}/estado`
      await api.patch(ruta, { estado })
      toast.success('¡Estado actualizado!')
      tipo === 'encargo' ? cargarEncargos() : cargarTemu()
      setModalPedido(null)
    } catch (err) { toast.error(err.response?.data?.error || 'Error actualizando') }
  }

  const registrarAbono = async () => {
    if (!montoAbono || !modalPedido) return
    setGuardando(true)
    try {
      await api.post(`/api/pedidos-cliente/${modalPedido._id}/abonos`, { monto: parseFloat(montoAbono) })
      toast.success('¡Abono registrado!')
      setMostrarAbono(false); setMontoAbono(''); cargarEncargos(); setModalPedido(null)
    } catch (err) { toast.error(err.response?.data?.error || 'Error') }
    finally { setGuardando(false) }
  }

  const eliminarTemu = async (id) => {
    if (!confirm('¿Eliminar este pedido?')) return
    try { await api.delete(`/api/pedidos/${id}`); toast.success('Pedido eliminado'); cargarTemu(); setModalPedido(null) }
    catch { toast.error('Error eliminando') }
  }

  const enCurso = encargos.filter(e => e.estado === 'en_curso').length
  const llegaron = encargos.filter(e => e.estado === 'llego').length

  // Componente de selector de cantidad reutilizable
  const SelectorCantidad = ({ valor, onChange, mostrar, setMostrar }) => (
    <div>
      <label className="block text-base font-bold text-gray-700 mb-1.5">Cantidad</label>
      <div className="flex items-center gap-3 mb-2">
        <button type="button"
          onClick={() => onChange(Math.max(1, valor - 1))}
          className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
          <Minus className="w-5 h-5" />
        </button>
        <span className="flex-1 text-center text-2xl font-black text-gray-900 bg-gray-50 rounded-xl py-2">{valor}</span>
        <button type="button"
          onClick={() => onChange(valor + 1)}
          className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
          <Plus className="w-5 h-5" />
        </button>
      </div>
      <button type="button" onClick={() => setMostrar(v => !v)}
        className="text-sm text-purple-600 font-semibold flex items-center gap-1">
        Selección rápida <ChevronDown className="w-4 h-4" />
      </button>
      {mostrar && (
        <div className="flex flex-wrap gap-2 mt-2">
          {CANTIDADES.map(n => (
            <button key={n} type="button"
              onClick={() => { onChange(n); setMostrar(false) }}
              className={`w-12 h-12 rounded-xl text-base font-bold border transition-colors ${
                valor === n ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#7C3AED] hover:text-[#7C3AED]'
              }`}>
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Pedidos</h1>
        <button onClick={() => tab === 'encargos' ? setMostrarFormEncargo(true) : setMostrarFormTemu(true)}
          className="flex items-center gap-1.5 bg-[#7C3AED] text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-[#5B21B6] transition-colors">
          <Plus className="w-4 h-4" /> Nuevo
        </button>
      </div>

      <div className="flex bg-gray-100 rounded-xl p-1">
        {[{ key: 'encargos', label: 'Encargos clientas', badge: enCurso }, { key: 'temu', label: 'Pedidos a Temu', badge: 0 }].map(({ key, label, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${tab === key ? 'bg-white text-[#7C3AED] shadow-sm' : 'text-gray-400'}`}>
            {label}{badge > 0 && <span className="ml-2 bg-[#7C3AED] text-white text-xs font-black px-1.5 py-0.5 rounded-full">{badge}</span>}
          </button>
        ))}
      </div>

      {tab === 'encargos' && (enCurso > 0 || llegaron > 0) && (
        <div className="flex gap-3">
          {enCurso > 0 && <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-sm"><span className="font-bold text-yellow-800">{enCurso}</span><span className="text-yellow-700"> en curso</span></div>}
          {llegaron > 0 && <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm"><span className="font-bold text-green-700">{llegaron}</span><span className="text-green-600"> listos para entregar</span></div>}
        </div>
      )}

      {/* Lista encargos */}
      {tab === 'encargos' && (
        loadingEncargos ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-purple-100 animate-pulse" />)}</div>
        ) : encargos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center"><ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400 font-semibold">No hay encargos registrados</p></div>
        ) : (
          <div className="space-y-3">
            {encargos.map(e => {
              const pct = e.totalVenta > 0 ? Math.min(100, (e.totalPagado / e.totalVenta) * 100) : 0
              return (
                <button key={e._id} onClick={() => setModalPedido({ ...e, tipo: 'encargo' })}
                  className="w-full bg-white rounded-2xl border border-purple-100 p-4 shadow-sm text-left hover:border-[#7C3AED] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <span className="font-black text-[#7C3AED] text-sm">{getIniciales(e.cliente?.nombre || '')}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-black text-gray-900 text-base truncate">{e.cliente?.nombre}</p>
                        <span className={`text-sm font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${colorEstadoCliente(e.estado)}`}>{labelEstadoCliente(e.estado)}</span>
                      </div>
                      <p className="text-base text-gray-600 mt-1 truncate">{e.descripcion}</p>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500 font-semibold">{formatCOP(e.totalPagado)} pagado</span>
                          <span className="font-bold text-red-500">Falta {formatCOP(e.saldoPendiente)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      )}

      {/* Lista pedidos Temu */}
      {tab === 'temu' && (
        loadingTemu ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-purple-100 animate-pulse" />)}</div>
        ) : pedidosTemu.length === 0 ? (
          <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center"><ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-400 font-semibold">No hay pedidos a Temu</p></div>
        ) : (
          <div className="space-y-3">
            {pedidosTemu.map(p => (
              <button key={p._id} onClick={() => setModalPedido({ ...p, tipo: 'temu' })}
                className="w-full bg-white rounded-2xl border border-purple-100 p-4 shadow-sm text-left hover:border-[#7C3AED] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-base leading-tight truncate">{p.descripcion}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {p.categoria && <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg capitalize">{p.categoria}</span>}
                      {p.talla && <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg">T.{p.talla.toUpperCase()}</span>}
                      {p.precioEstimado && <span className="text-sm font-bold text-gray-700">{formatCOP(p.precioEstimado)}</span>}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{fechaRelativa(p.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${colorEstadoTemu(p.estado)}`}>{labelEstadoTemu(p.estado)}</span>
                </div>
              </button>
            ))}
          </div>
        )
      )}

      {/* Modal detalle */}
      {modalPedido && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-gray-900">{modalPedido.tipo === 'encargo' ? modalPedido.cliente?.nombre : 'Pedido a Temu'}</h2>
                <button onClick={() => { setModalPedido(null); setMostrarAbono(false) }} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-base text-gray-700 bg-gray-50 rounded-xl px-4 py-3 mb-4">{modalPedido.descripcion}</p>

              {/* Selector de estado — botones grandes en lugar de select */}
              <div className="mb-4">
                <label className="block text-base font-bold text-gray-700 mb-2">¿Cómo va este pedido?</label>
                <div className="grid grid-cols-1 gap-2">
                  {(modalPedido.tipo === 'encargo' ? ESTADOS_CLIENTE : ESTADOS_TEMU).map(est => (
                    <button key={est} type="button"
                      onClick={() => actualizarEstado(modalPedido._id, est, modalPedido.tipo)}
                      className={`w-full px-4 py-3 rounded-xl text-base font-bold border-2 text-left transition-colors ${
                        modalPedido.estado === est
                          ? 'bg-[#7C3AED] text-white border-[#7C3AED]'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#7C3AED] hover:text-[#7C3AED]'
                      }`}>
                      {modalPedido.tipo === 'encargo' ? ESTADOS_CLIENTE_LABELS[est] : ESTADOS_TEMU_LABELS[est]}
                    </button>
                  ))}
                </div>
              </div>

              {modalPedido.tipo === 'encargo' && (
                <div className="bg-purple-50 rounded-xl p-4 mb-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-600">Total</span>
                    <span className="font-bold text-gray-900 text-base">{formatCOP(modalPedido.totalVenta)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base text-gray-600">Pagado</span>
                    <span className="font-bold text-emerald-600 text-base">{formatCOP(modalPedido.totalPagado)}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-purple-200 pt-2">
                    <span className="text-base font-bold text-gray-700">Falta</span>
                    <span className="font-black text-red-600 text-xl">{formatCOP(modalPedido.saldoPendiente)}</span>
                  </div>
                </div>
              )}

              {modalPedido.tipo === 'encargo' && modalPedido.saldoPendiente > 0 && (
                !mostrarAbono ? (
                  <button onClick={() => setMostrarAbono(true)}
                    className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] text-white font-bold py-4 rounded-xl hover:bg-[#5B21B6] mb-3 text-base">
                    <DollarSign className="w-5 h-5" /> Registrar abono
                  </button>
                ) : (
                  <div className="space-y-3 mb-3">
                    <label className="block text-base font-bold text-gray-700">Monto del abono ($)</label>
                    <input type="number" min="1" value={montoAbono} onChange={e => setMontoAbono(e.target.value)}
                      placeholder="Ej: 20000" autoFocus
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    <div className="flex gap-3">
                      <button onClick={() => setMostrarAbono(false)} className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-base">Cancelar</button>
                      <button onClick={registrarAbono} disabled={guardando} className="flex-1 bg-[#7C3AED] text-white font-bold py-3 rounded-xl disabled:opacity-60 text-base">
                        {guardando ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </div>
                )
              )}

              {modalPedido.tipo === 'temu' && (
                <button onClick={() => eliminarTemu(modalPedido._id)}
                  className="w-full py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors text-base">
                  Eliminar pedido
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo encargo */}
      {mostrarFormEncargo && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">Nuevo encargo de clienta</h2>
                <button onClick={() => setMostrarFormEncargo(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={crearEncargo} className="space-y-4">
                {[
                  { key: 'clienteNombre', label: 'Nombre clienta *', placeholder: 'Ana García' },
                  { key: 'clienteTelefono', label: 'Teléfono', placeholder: '300 123 4567' },
                  { key: 'descripcion', label: '¿Qué encargó? *', placeholder: 'Vestido largo azul' },
                  { key: 'talla', label: 'Talla', placeholder: 'S, M, L, XL...' },
                  { key: 'color', label: 'Color', placeholder: 'Azul, rojo...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-base font-bold text-gray-700 mb-1.5">{label}</label>
                    <input type="text" value={formEncargo[key]} onChange={e => setFormEncargo(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                ))}

                {/* Cantidad con +/− */}
                <SelectorCantidad
                  valor={formEncargo.cantidad}
                  onChange={v => setFormEncargo(f => ({ ...f, cantidad: v }))}
                  mostrar={mostrarSelectorCantidad}
                  setMostrar={setMostrarSelectorCantidad}
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-1.5">Total ($) *</label>
                    <input type="number" min="0" value={formEncargo.totalVenta} onChange={e => setFormEncargo(f => ({ ...f, totalVenta: e.target.value }))}
                      placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-1.5">Anticipo ($)</label>
                    <input type="number" min="0" value={formEncargo.abonoInicial} onChange={e => setFormEncargo(f => ({ ...f, abonoInicial: e.target.value }))}
                      placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Notas</label>
                  <input type="text" value={formEncargo.notas} onChange={e => setFormEncargo(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Cualquier detalle adicional"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                <button type="submit" disabled={guardando}
                  className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-xl hover:bg-[#5B21B6] transition-colors disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Registrar encargo'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo pedido Temu */}
      {mostrarFormTemu && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">Nuevo pedido a Temu</h2>
                <button onClick={() => setMostrarFormTemu(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={crearTemu} className="space-y-4">
                {[
                  { key: 'descripcion', label: '¿Qué vas a pedir? *', placeholder: 'Blusas rosadas talla M' },
                  { key: 'categoria', label: 'Categoría', placeholder: 'blusa, vestido...' },
                  { key: 'talla', label: 'Talla', placeholder: 'S, M, L, XL...' },
                  { key: 'color', label: 'Color', placeholder: 'Rosado, azul...' },
                  { key: 'linkTemu', label: 'Link de Temu', placeholder: 'https://temu.com/...' },
                  { key: 'notas', label: 'Notas', placeholder: 'Cualquier detalle adicional' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key}>
                    <label className="block text-base font-bold text-gray-700 mb-1.5">{label}</label>
                    <input type="text" value={formTemu[key]} onChange={e => setFormTemu(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                ))}

                {/* Cantidad con +/− */}
                <SelectorCantidad
                  valor={formTemu.cantidad}
                  onChange={v => setFormTemu(f => ({ ...f, cantidad: v }))}
                  mostrar={mostrarSelectorCantidadTemu}
                  setMostrar={setMostrarSelectorCantidadTemu}
                />

                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Precio estimado ($)</label>
                  <input type="number" min="0" value={formTemu.precioEstimado} onChange={e => setFormTemu(f => ({ ...f, precioEstimado: e.target.value }))}
                    placeholder="0" className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                <button type="submit" disabled={guardando}
                  className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-xl hover:bg-[#5B21B6] transition-colors disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Registrar pedido'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
