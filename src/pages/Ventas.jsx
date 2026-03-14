import { useState, useEffect } from 'react'
import { Search, X, ShoppingCart, Edit2, Trash2, TrendingUp, Calendar, Plus, User, Minus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { formatCOP, fechaRelativa } from '../lib/utils'

const HOY = new Date().toISOString().split('T')[0]
const HACE_30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

export default function Ventas() {
  const [ventas, setVentas] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [desde, setDesde] = useState(HACE_30)
  const [hasta, setHasta] = useState(HOY)
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({ nota: '', cliente: '' })
  const [guardando, setGuardando] = useState(false)
  const [confirmando, setConfirmando] = useState(null)

  // Nueva venta
  const [mostrarNueva, setMostrarNueva] = useState(false)
  const [clienteNueva, setClienteNueva] = useState('')
  const [notaNueva, setNotaNueva] = useState('')
  const [itemsCarrito, setItemsCarrito] = useState([])
  const [busquedaProducto, setBusquedaProducto] = useState('')
  const [productosResultado, setProductosResultado] = useState([])
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false)
  const [creando, setCreando] = useState(false)

  const cargar = () => {
    setLoading(true)
    api.get('/api/ventas', { params: { desde, hasta: hasta + 'T23:59:59' } })
      .then(r => setVentas(r.data))
      .catch(() => toast.error('Error cargando ventas'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [desde, hasta])

  useEffect(() => {
    if (busquedaProducto.trim().length < 1) { setProductosResultado([]); return }
    const t = setTimeout(() => {
      api.get('/api/productos', { params: { busqueda: busquedaProducto } })
        .then(r => setProductosResultado(r.data.filter(p => p.cantidad > 0).slice(0, 6)))
        .catch(() => {})
    }, 300)
    return () => clearTimeout(t)
  }, [busquedaProducto])

  const ventasFiltradas = ventas.filter(v => {
    const nombres = v.items?.map(i => i.nombreProducto).join(' ') || ''
    const cli = v.cliente || ''
    return nombres.toLowerCase().includes(busqueda.toLowerCase()) ||
      cli.toLowerCase().includes(busqueda.toLowerCase()) ||
      v.nota?.toLowerCase().includes(busqueda.toLowerCase())
  })

  const totalUtilidad = ventasFiltradas.reduce((acc, v) => acc + (v.utilidadTotal || 0), 0)
  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + (v.totalVenta || 0), 0)

  const agregarAlCarrito = (p) => {
    setBusquedaProducto('')
    setProductosResultado([])
    setMostrarSugerencias(false)
    setItemsCarrito(prev => {
      const existente = prev.find(i => i.productoId === p._id)
      if (existente) {
        return prev.map(i => i.productoId === p._id
          ? { ...i, cantidad: Math.min(i.cantidad + 1, p.cantidad) }
          : i)
      }
      return [...prev, {
        productoId: p._id,
        nombreProducto: p.nombre,
        cantidad: 1,
        maxCantidad: p.cantidad,
        precioVenta: p.precioVenta,
        talla: p.talla,
        color: p.color
      }]
    })
  }

  const actualizarCantidadCarrito = (productoId, delta) => {
    setItemsCarrito(prev => prev.map(i => {
      if (i.productoId !== productoId) return i
      const nueva = Math.min(Math.max(1, i.cantidad + delta), i.maxCantidad)
      return { ...i, cantidad: nueva }
    }))
  }

  const quitarDelCarrito = (productoId) => {
    setItemsCarrito(prev => prev.filter(i => i.productoId !== productoId))
  }

  const totalCarrito = itemsCarrito.reduce((s, i) => s + i.precioVenta * i.cantidad, 0)

  const abrirNueva = () => {
    setClienteNueva('')
    setNotaNueva('')
    setItemsCarrito([])
    setBusquedaProducto('')
    setMostrarNueva(true)
  }

  const handleCrear = async () => {
    if (itemsCarrito.length === 0) { toast.error('Agrega al menos un producto'); return }
    setCreando(true)
    try {
      await api.post('/api/ventas', {
        cliente: clienteNueva || undefined,
        nota: notaNueva || undefined,
        items: itemsCarrito.map(i => ({ productoId: i.productoId, cantidad: i.cantidad }))
      })
      toast.success('¡Venta registrada!')
      setMostrarNueva(false)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error registrando venta')
    } finally { setCreando(false) }
  }

  const handleEditar = (v) => {
    setEditando(v._id)
    setFormEdit({ nota: v.nota || '', cliente: v.cliente || '' })
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await api.put(`/api/ventas/${editando}`, formEdit)
      toast.success('Venta actualizada')
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando')
    } finally { setGuardando(false) }
  }

  const handleEliminar = async () => {
    if (!confirmando) return
    try {
      await api.delete(`/api/ventas/${confirmando._id}`)
      toast.success('Venta eliminada')
      setConfirmando(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error eliminando')
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Ventas</h1>
        <span className="text-sm text-gray-400 font-semibold">{ventasFiltradas.length} registros</span>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1">Total vendido</p>
          <p className="text-xl font-black text-gray-900">{formatCOP(totalVentas)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-semibold mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Ganancia</p>
          <p className="text-xl font-black text-emerald-600">{formatCOP(totalUtilidad)}</p>
        </div>
      </div>

      {/* Filtros fecha */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm space-y-3">
        <p className="text-sm font-bold text-gray-600 flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Rango de fechas</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 font-semibold">Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div>
            <label className="text-xs text-gray-400 font-semibold">Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input type="text" placeholder="Buscar por producto, cliente o nota..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-100 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
      </div>

      {/* Lista ventas */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-purple-100 animate-pulse" />)}</div>
      ) : ventasFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
          <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No hay ventas en este rango</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ventasFiltradas.map(v => (
            <div key={v._id} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Items — más grandes */}
                  <div className="space-y-1">
                    {v.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">{item.nombreProducto}</span>
                        <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">x{item.cantidadVendida}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {v.cliente && <span className="text-sm font-semibold text-gray-600 flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg"><User className="w-3.5 h-3.5" />{v.cliente}</span>}
                    <span className="text-sm text-gray-500">{fechaRelativa(v.fecha)}</span>
                    {v.nota && <span className="text-sm text-gray-500">· {v.nota}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEditar(v)} className="p-2.5 rounded-xl hover:bg-purple-50 text-gray-400 hover:text-[#7C3AED] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => setConfirmando(v)} className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 font-semibold mb-0.5">Total venta</p>
                  <p className="font-black text-gray-900 text-base">{formatCOP(v.totalVenta)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-600 font-semibold mb-0.5">Ganancia</p>
                  <p className="font-black text-emerald-700 text-base">{formatCOP(v.utilidadTotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botón nueva venta */}
      <button onClick={abrirNueva}
        className="fixed bottom-24 right-4 md:bottom-8 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5B21B6] transition-colors z-30">
        <Plus className="w-7 h-7" />
      </button>

      {/* Modal nueva venta */}
      {mostrarNueva && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">Nueva venta</h2>
                <button onClick={() => setMostrarNueva(false)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">

                {/* Cliente opcional */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Cliente (opcional)</label>
                  <input type="text" value={clienteNueva} onChange={e => setClienteNueva(e.target.value)}
                    placeholder="Ej: Ana García"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                {/* Buscador productos */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Agregar producto</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="text" placeholder="Buscar en inventario..."
                      value={busquedaProducto}
                      onChange={e => { setBusquedaProducto(e.target.value); setMostrarSugerencias(true) }}
                      onFocus={() => setMostrarSugerencias(true)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                    {busquedaProducto && (
                      <button type="button" onClick={() => { setBusquedaProducto(''); setProductosResultado([]) }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>
                    )}
                    {mostrarSugerencias && productosResultado.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border border-purple-100 shadow-lg overflow-hidden">
                        {productosResultado.map(p => (
                          <button key={p._id} type="button" onMouseDown={() => agregarAlCarrito(p)}
                            className="w-full px-4 py-4 text-left hover:bg-purple-50 transition-colors border-b border-gray-100 last:border-0">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-base leading-tight">{p.nombre}</p>
                                <div className="flex gap-2 mt-1 flex-wrap">
                                  {p.talla && <span className="text-sm font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">T.{p.talla.toUpperCase()}</span>}
                                  {p.color && <span className="text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded-md capitalize">{p.color}</span>}
                                  <span className="text-sm text-gray-500">{p.cantidad} und. disponibles</span>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-base font-black text-[#7C3AED]">{formatCOP(p.precioVenta)}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Carrito */}
                {itemsCarrito.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-base font-bold text-gray-600">Productos seleccionados</p>
                    {itemsCarrito.map(item => (
                      <div key={item.productoId} className="bg-purple-50 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-base">{item.nombreProducto}</p>
                            {(item.talla || item.color) && (
                              <div className="flex gap-1.5 mt-1 flex-wrap">
                                {item.talla && <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">T.{item.talla.toUpperCase()}</span>}
                                {item.color && <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded capitalize">{item.color}</span>}
                              </div>
                            )}
                          </div>
                          <button type="button" onClick={() => quitarDelCarrito(item.productoId)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-500 flex-shrink-0">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          {/* Botones +/− para cantidad */}
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={() => actualizarCantidadCarrito(item.productoId, -1)}
                              disabled={item.cantidad <= 1}
                              className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-gray-700 disabled:opacity-40 hover:bg-purple-100 transition-colors">
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-10 text-center text-xl font-black text-gray-900">{item.cantidad}</span>
                            <button type="button"
                              onClick={() => actualizarCantidadCarrito(item.productoId, 1)}
                              disabled={item.cantidad >= item.maxCantidad}
                              className="w-10 h-10 rounded-xl bg-white border border-purple-200 flex items-center justify-center text-gray-700 disabled:opacity-40 hover:bg-purple-100 transition-colors">
                              <Plus className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-gray-400">de {item.maxCantidad}</span>
                          </div>
                          <p className="text-base font-black text-[#7C3AED]">{formatCOP(item.precioVenta * item.cantidad)}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between items-center bg-emerald-50 rounded-xl p-3">
                      <span className="font-bold text-gray-700 text-base">Total</span>
                      <span className="font-black text-emerald-600 text-2xl">{formatCOP(totalCarrito)}</span>
                    </div>
                  </div>
                )}

                {/* Nota */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Nota (opcional)</label>
                  <input type="text" value={notaNueva} onChange={e => setNotaNueva(e.target.value)}
                    placeholder="Ej: pago en efectivo..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                <button onClick={handleCrear} disabled={creando || itemsCarrito.length === 0}
                  className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-xl hover:bg-[#5B21B6] transition-colors disabled:opacity-60">
                  {creando ? 'Registrando...' : `Registrar venta${totalCarrito > 0 ? ' · ' + formatCOP(totalCarrito) : ''}`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">Editar venta</h2>
                <button onClick={() => setEditando(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Cliente</label>
                  <input type="text" value={formEdit.cliente} onChange={e => setFormEdit(f => ({ ...f, cliente: e.target.value }))}
                    placeholder="Nombre del cliente"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Nota</label>
                  <input type="text" value={formEdit.nota} onChange={e => setFormEdit(f => ({ ...f, nota: e.target.value }))}
                    placeholder="Ej: cliente habitual..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <button onClick={handleGuardar} disabled={guardando}
                  className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-xl hover:bg-[#5B21B6] transition-colors disabled:opacity-60">
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-sm rounded-t-3xl md:rounded-2xl shadow-xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-black text-gray-900">¿Eliminar venta?</h2>
                <button onClick={() => setConfirmando(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="bg-red-50 rounded-xl p-4 mb-5">
                <p className="font-bold text-gray-900 text-base">{confirmando.items?.map(i => i.nombreProducto).join(', ')}</p>
                <p className="text-sm text-gray-500 mt-1">Esta acción no devuelve el stock automáticamente.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setConfirmando(null)}
                  className="w-full py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50">Cancelar</button>
                <button onClick={handleEliminar}
                  className="w-full py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
