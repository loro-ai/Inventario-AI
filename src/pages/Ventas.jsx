import { useState, useEffect } from 'react'
import { Search, X, ShoppingCart, Edit2, Trash2, TrendingUp, Calendar } from 'lucide-react'
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
  const [form, setForm] = useState({ precioVenta: 0, precioCompra: 0, nota: '' })
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setLoading(true)
    api.get('/api/ventas', { params: { desde, hasta } })
      .then(r => setVentas(r.data))
      .catch(() => toast.error('Error cargando ventas'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [desde, hasta])

  const ventasFiltradas = ventas.filter(v =>
    v.nombreProducto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    v.nota?.toLowerCase().includes(busqueda.toLowerCase())
  )

  const totalUtilidad = ventasFiltradas.reduce((acc, v) => acc + (v.utilidadTotal || 0), 0)
  const totalVentas = ventasFiltradas.reduce((acc, v) => acc + (v.precioVenta * v.cantidadVendida || 0), 0)

  const handleEditar = (v) => {
    setEditando(v._id)
    setForm({ precioVenta: v.precioVenta, precioCompra: v.precioCompra, nota: v.nota || '' })
  }

  const handleGuardar = async () => {
    setGuardando(true)
    try {
      await api.put(`/api/ventas/${editando}`, form)
      toast.success('Venta actualizada')
      setEditando(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando')
    } finally { setGuardando(false) }
  }

  const handleEliminar = async (v) => {
    if (!confirm(`¿Eliminar la venta de "${v.nombreProducto}"?\nEsto NO devuelve el stock automáticamente.`)) return
    try {
      await api.delete(`/api/ventas/${v._id}`)
      toast.success('Venta eliminada')
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
        <input type="text" placeholder="Buscar por producto o nota..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-100 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
        {busqueda && (
          <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl border border-purple-100 animate-pulse" />)}
        </div>
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{v.nombreProducto}</h3>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                      x{v.cantidadVendida}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{fechaRelativa(v.fecha)}{v.nota ? ` · ${v.nota}` : ''}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEditar(v)} className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-[#7C3AED] transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEliminar(v)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <div><p className="text-xs text-gray-400">Venta</p><p className="font-bold text-gray-900 text-sm">{formatCOP(v.precioVenta)}</p></div>
                <div><p className="text-xs text-gray-400">Compra</p><p className="font-bold text-gray-900 text-sm">{formatCOP(v.precioCompra)}</p></div>
                <div><p className="text-xs text-gray-400">Ganancia</p><p className="font-bold text-emerald-600 text-sm">{formatCOP(v.utilidadTotal)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal editar */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">Editar venta</h2>
                <button onClick={() => setEditando(null)} className="p-2 rounded-xl hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio venta ($)</label>
                    <input type="number" min="0" value={form.precioVenta}
                      onChange={e => setForm(f => ({ ...f, precioVenta: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio compra ($)</label>
                    <input type="number" min="0" value={form.precioCompra}
                      onChange={e => setForm(f => ({ ...f, precioCompra: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>
                {form.precioVenta > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 text-sm">
                    <span className="text-gray-500">Ganancia: </span>
                    <span className="font-bold text-emerald-600">{formatCOP((form.precioVenta - form.precioCompra) * 1)}</span>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nota</label>
                  <input type="text" value={form.nota}
                    onChange={e => setForm(f => ({ ...f, nota: e.target.value }))}
                    placeholder="Ej: cliente habitual, descuento..."
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
    </div>
  )
}
