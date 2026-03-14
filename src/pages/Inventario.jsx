import { useState, useEffect } from 'react'
import { Plus, Search, X, Package, Edit2, Trash2, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { formatCOP, colorStock } from '../lib/utils'

const CATEGORIAS = [
  { value: '', label: 'Todas' },
  { value: 'blusa', label: 'Blusa' },
  { value: 'ropa_interior', label: 'Ropa interior' },
  { value: 'vestido', label: 'Vestido' },
  { value: 'pantalon', label: 'Pantalón' },
  { value: 'falda', label: 'Falda' },
  { value: 'conjunto', label: 'Conjunto' },
  { value: 'accesorio', label: 'Accesorio' },
  { value: 'maquillaje', label: 'Maquillaje' },
  { value: 'bermuda', label: 'Bermuda' },
  { value: 'camiseta', label: 'Camiseta' },
  { value: 'comida', label: 'Comida' },
  { value: 'otro', label: 'Otro' },
]

const FORM_VACIO = { nombre: '', categoria: 'otro', talla: '', color: '', cantidad: 0, precioCompra: 0, precioVenta: 0 }

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState(FORM_VACIO)
  const [guardando, setGuardando] = useState(false)

  const cargar = () => {
    setLoading(true)
    const params = {}
    if (busqueda) params.busqueda = busqueda
    if (categoriaFiltro) params.categoria = categoriaFiltro
    api.get('/api/productos', { params })
      .then(r => setProductos(r.data))
      .catch(() => toast.error('Error cargando productos'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { cargar() }, [busqueda, categoriaFiltro])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { toast.error('El nombre es obligatorio'); return }
    setGuardando(true)
    try {
      if (editando) {
        await api.put(`/api/productos/${editando}`, form)
        toast.success('¡Producto actualizado!')
      } else {
        await api.post('/api/productos', form)
        toast.success('¡Producto agregado!')
      }
      setMostrarForm(false); setEditando(null); setForm(FORM_VACIO); cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando')
    } finally { setGuardando(false) }
  }

  const handleEditar = (p) => {
    setEditando(p._id)
    setForm({ nombre: p.nombre, categoria: p.categoria, talla: p.talla || '', color: p.color || '', cantidad: p.cantidad, precioCompra: p.precioCompra, precioVenta: p.precioVenta })
    setMostrarForm(true)
  }

  const handleEliminar = async (p) => {
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return
    try {
      await api.delete(`/api/productos/${p._id}`)
      toast.success('Producto eliminado')
      cargar()
    } catch { toast.error('Error eliminando') }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Inventario</h1>
        <span className="text-sm text-gray-400 font-semibold">{productos.length} productos</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text" placeholder="Buscar por nombre, color, talla..."
          value={busqueda} onChange={e => setBusqueda(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-purple-100 bg-white text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-purple-400"
        />
        {busqueda && <button onClick={() => setBusqueda('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIAS.map(cat => (
          <button key={cat.value} onClick={() => setCategoriaFiltro(cat.value)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold border transition-colors ${
              categoriaFiltro === cat.value ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#7C3AED] hover:text-[#7C3AED]'
            }`}
          >{cat.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-white rounded-2xl border border-purple-100 animate-pulse" />)}</div>
      ) : productos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No hay productos aquí todavía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {productos.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 text-base leading-tight">{p.nombre}</h3>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colorStock(p.cantidad)}`}>
                      {p.cantidad === 0 ? 'Agotado' : `${p.cantidad} und.`}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs text-gray-400 capitalize">{p.categoria}</span>
                    {p.talla && <span className="text-xs text-gray-400">Talla {p.talla}</span>}
                    {p.color && <span className="text-xs text-gray-400">{p.color}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEditar(p)} className="p-2 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-[#7C3AED] transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleEliminar(p)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.cantidad === 0 ? 'bg-red-400' : p.cantidad <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (p.cantidad / 20) * 100)}%` }} />
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <div><p className="text-xs text-gray-400">Compra</p><p className="font-bold text-gray-900 text-sm">{formatCOP(p.precioCompra)}</p></div>
                <div><p className="text-xs text-gray-400">Venta</p><p className="font-bold text-gray-900 text-sm">{formatCOP(p.precioVenta)}</p></div>
                <div><p className="text-xs text-gray-400">Utilidad</p><p className="font-bold text-emerald-600 text-sm">{formatCOP(p.utilidadUnitaria)}</p></div>
                <div><p className="text-xs text-gray-400">Total</p><p className="font-bold text-emerald-600 text-sm">{formatCOP(p.utilidadTotal)}</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => { setEditando(null); setForm(FORM_VACIO); setMostrarForm(true) }}
        className="fixed bottom-24 right-4 md:bottom-8 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5B21B6] transition-colors z-30"
      ><Plus className="w-7 h-7" /></button>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button onClick={() => { setMostrarForm(false); setEditando(null); setForm(FORM_VACIO) }} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Blusa rosada manga larga"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Categoría</label>
                    <div className="relative">
                      <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-8 bg-white">
                        {CATEGORIAS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Talla</label>
                    <input type="text" value={form.talla} onChange={e => setForm(f => ({ ...f, talla: e.target.value }))}
                      placeholder="S, M, L..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Color</label>
                    <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                      placeholder="Rosado, azul..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Cantidad</label>
                    <input type="number" min="0" value={form.cantidad} onChange={e => setForm(f => ({ ...f, cantidad: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio compra ($)</label>
                    <input type="number" min="0" value={form.precioCompra} onChange={e => setForm(f => ({ ...f, precioCompra: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Precio venta ($)</label>
                    <input type="number" min="0" value={form.precioVenta} onChange={e => setForm(f => ({ ...f, precioVenta: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>
                {form.precioVenta > 0 && form.precioCompra > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 text-sm">
                    <span className="text-gray-500">Utilidad por unidad: </span>
                    <span className="font-bold text-emerald-600">{formatCOP(form.precioVenta - form.precioCompra)}</span>
                  </div>
                )}
                <button type="submit" disabled={guardando}
                  className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-xl hover:bg-[#5B21B6] transition-colors disabled:opacity-60 mt-2">
                  {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar producto'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
