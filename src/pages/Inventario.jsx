import { useState, useEffect } from 'react'
import { Plus, Search, X, Package, Edit2, Trash2, ChevronDown, Calculator, Minus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { formatCOP, colorStock, fechaRelativa } from '../lib/utils'

const CATEGORIAS = [
  { value: '', label: 'Todas' },
  { value: 'blusa', label: 'Blusa' },
  { value: 'vestido', label: 'Vestido' },
  { value: 'pantalon', label: 'Pantalón' },
  { value: 'falda', label: 'Falda' },
  { value: 'conjunto', label: 'Conjunto' },
  { value: 'accesorio', label: 'Accesorio' },
  { value: 'ropa_interior', label: 'Ropa interior' },
  { value: 'maquillaje', label: 'Maquillaje' },
  { value: 'bermuda', label: 'Bermuda' },
  { value: 'camiseta', label: 'Camiseta' },
  { value: 'comida', label: 'Comida' },
  { value: 'otro', label: 'Otro' },
]

const MARGENES = [
  { label: '1.5x', value: 1.5 },
  { label: '2x', value: 2 },
  { label: '2.5x', value: 2.5 },
  { label: '3x', value: 3 },
]

const CANTIDADES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30]

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
  const [mostrarSelectorCantidad, setMostrarSelectorCantidad] = useState(false)
  const [verAgotados, setVerAgotados] = useState(false)
  const [modalHistorial, setModalHistorial] = useState(null)
  const [loadingHistorial, setLoadingHistorial] = useState(false)

  // Calculadora de inversión
  const [totalInvertido, setTotalInvertido] = useState('')
  const [margenSugerido, setMargenSugerido] = useState(null)

  const precioCompraUnitario = totalInvertido && form.cantidad > 0
    ? Math.round(parseFloat(totalInvertido) / form.cantidad)
    : form.precioCompra

  useEffect(() => {
    if (totalInvertido && form.cantidad > 0) {
      const unitario = Math.round(parseFloat(totalInvertido) / form.cantidad)
      setForm(f => ({ ...f, precioCompra: unitario }))
      if (margenSugerido) {
        setForm(f => ({ ...f, precioCompra: unitario, precioVenta: Math.round(unitario * margenSugerido) }))
      }
    }
  }, [totalInvertido, form.cantidad, margenSugerido])

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
      setMostrarForm(false); setEditando(null); setForm(FORM_VACIO)
      setTotalInvertido(''); setMargenSugerido(null)
      cargar()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error guardando')
    } finally { setGuardando(false) }
  }

  const handleEditar = (p) => {
    setEditando(p._id)
    setTotalInvertido('')
    setMargenSugerido(null)
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

  const cerrarForm = () => {
    setMostrarForm(false); setEditando(null); setForm(FORM_VACIO)
    setTotalInvertido(''); setMargenSugerido(null)
  }

  const verHistorial = async (p) => {
    setLoadingHistorial(true)
    setModalHistorial({ producto: p, historial: [] })
    try {
      const { data } = await api.get(`/api/productos/${p._id}/historial`)
      setModalHistorial(data)
    } catch {
      toast.error('Error cargando historial')
    } finally {
      setLoadingHistorial(false)
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Inventario</h1>
          {verAgotados && <p className="text-sm font-semibold text-red-500">Mostrando productos agotados</p>}
        </div>
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
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-white rounded-2xl border border-purple-100 animate-pulse" />)}</div>
      ) : productos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 font-semibold">No hay productos aquí todavía</p>
        </div>
      ) : (() => {
        const vigentes = productos.filter(p => p.cantidad > 0)
        const agotados = productos.filter(p => p.cantidad === 0)
        const listaActual = verAgotados ? agotados : vigentes
        return (
          <div className="space-y-3">
            {listaActual.map(p => (
            <div key={p._id} className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Nombre y stock */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-gray-900 text-lg leading-tight">{p.nombre}</h3>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-full border ${colorStock(p.cantidad)}`}>
                      {p.cantidad === 0 ? 'Agotado' : `${p.cantidad} und.`}
                    </span>
                  </div>
                  {/* Categoría, talla, color — bien visibles */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-lg capitalize">{p.categoria?.replace('_', ' ')}</span>
                    {p.talla && <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">Talla {p.talla.toUpperCase()}</span>}
                    {p.color && <span className="text-sm font-semibold text-gray-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-lg capitalize">{p.color}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleEditar(p)} className="p-2.5 rounded-xl hover:bg-purple-50 text-gray-400 hover:text-[#7C3AED] transition-colors"><Edit2 className="w-5 h-5" /></button>
                  <button onClick={() => handleEliminar(p)} className="p-2.5 rounded-xl hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                  {p.cantidad === 0 && (
                    <button onClick={() => verHistorial(p)} className="p-2.5 rounded-xl hover:bg-blue-50 text-gray-400 hover:text-blue-500 transition-colors" title="Ver historial">
                      <Search className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${p.cantidad === 0 ? 'bg-red-400' : p.cantidad <= 3 ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (p.cantidad / 20) * 100)}%` }} />
                </div>
              </div>
              {/* Precios — más grandes y claros */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-500 mb-0.5">Compra unitaria</p>
                  <p className="font-black text-gray-900 text-base">{formatCOP(p.precioCompra)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-600 mb-0.5">Inversión total</p>
                  <p className="font-black text-blue-700 text-base">{formatCOP(p.precioCompra * p.cantidad)}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-purple-600 mb-0.5">Precio venta</p>
                  <p className="font-black text-purple-700 text-base">{formatCOP(p.precioVenta)}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-emerald-600 mb-0.5">Ganancia</p>
                  <p className="font-black text-emerald-700 text-base">{formatCOP(p.utilidadUnitaria)}</p>
                </div>
              </div>
            </div>
          ))}
            {listaActual.length === 0 && (
              <div className="bg-white rounded-2xl border border-purple-100 p-8 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 font-semibold">
                  {verAgotados ? 'No hay productos agotados 🎉' : 'No hay productos con stock disponible'}
                </p>
              </div>
            )}
          </div>
        )
      })()}

      {/* Botón ver agotados — encima del botón + */}
      <button
        onClick={() => setVerAgotados(v => !v)}
        className="fixed bottom-40 right-4 md:bottom-24 w-14 h-14 bg-white border-2 border-gray-300 text-gray-500 rounded-full shadow-md flex items-center justify-center hover:border-red-400 hover:text-red-500 transition-colors z-30"
        title={verAgotados ? 'Ver con stock' : 'Ver agotados'}
      >
        <span className="text-xs font-black leading-tight text-center">{verAgotados ? '✓' : '0'}</span>
      </button>

      <button
        onClick={() => { setEditando(null); setForm(FORM_VACIO); setTotalInvertido(''); setMargenSugerido(null); setMostrarForm(true) }}
        className="fixed bottom-24 right-4 md:bottom-8 w-14 h-14 bg-[#7C3AED] text-white rounded-full shadow-lg flex items-center justify-center hover:bg-[#5B21B6] transition-colors z-30"
      ><Plus className="w-7 h-7" /></button>

      {mostrarForm && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-black text-gray-900">{editando ? 'Editar producto' : 'Nuevo producto'}</h2>
                <button onClick={cerrarForm} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">

                {/* Nombre */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Nombre *</label>
                  <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Brasiel triangulo" required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                {/* Categoría y talla */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-1.5">Categoría</label>
                    <div className="relative">
                      <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400 appearance-none pr-8 bg-white">
                        {CATEGORIAS.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-700 mb-1.5">Talla</label>
                    <input type="text" value={form.talla} onChange={e => setForm(f => ({ ...f, talla: e.target.value }))}
                      placeholder="S, M, L..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Color</label>
                  <input type="text" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                    placeholder="Rosado, azul..." className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                {/* Cantidad — selector visual */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Cantidad</label>
                  {/* Botones +/− + display */}
                  <div className="flex items-center gap-3 mb-2">
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, cantidad: Math.max(0, f.cantidad - 1) }))}
                      className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="flex-1 text-center text-2xl font-black text-gray-900 bg-gray-50 rounded-xl py-2">{form.cantidad}</span>
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, cantidad: f.cantidad + 1 }))}
                      className="w-12 h-12 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {/* Selector rápido de cantidades comunes */}
                  <div>
                    <button type="button" onClick={() => setMostrarSelectorCantidad(v => !v)}
                      className="text-sm text-purple-600 font-semibold flex items-center gap-1">
                      Selección rápida <ChevronDown className="w-4 h-4" />
                    </button>
                    {mostrarSelectorCantidad && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {CANTIDADES.map(n => (
                          <button key={n} type="button"
                            onClick={() => { setForm(f => ({ ...f, cantidad: n })); setMostrarSelectorCantidad(false) }}
                            className={`w-12 h-12 rounded-xl text-base font-bold border transition-colors ${
                              form.cantidad === n ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#7C3AED] hover:text-[#7C3AED]'
                            }`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Calculadora de inversión */}
                <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
                  <p className="text-base font-bold text-blue-700 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Calculadora de inversión
                  </p>
                  <div>
                    <label className="block text-sm text-gray-500 font-semibold mb-1">Total invertido en el lote ($)</label>
                    <input
                      type="number" min="0"
                      value={totalInvertido}
                      onChange={e => setTotalInvertido(e.target.value)}
                      placeholder="Ej: 36000"
                      className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-white text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </div>
                  {totalInvertido && form.cantidad > 0 && (
                    <div className="bg-white rounded-xl p-3 flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">Costo unitario</p>
                        <p className="font-black text-blue-700 text-lg">{formatCOP(precioCompraUnitario)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Inversión total</p>
                        <p className="font-bold text-gray-700">{formatCOP(parseFloat(totalInvertido))}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Precio compra unitario */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Precio compra unitario ($)</label>
                  <input type="number" min="0" value={form.precioCompra}
                    onChange={e => { setTotalInvertido(''); setForm(f => ({ ...f, precioCompra: parseFloat(e.target.value) || 0 })) }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                  {totalInvertido && form.cantidad > 0 && (
                    <p className="text-xs text-blue-600 mt-1">✓ Calculado automáticamente desde la inversión total</p>
                  )}
                </div>

                {/* Precio venta */}
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-1.5">Precio venta ($)</label>
                  {form.precioCompra > 0 && (
                    <div className="flex gap-2 mb-2 flex-wrap">
                      <span className="text-xs text-gray-400 self-center">Sugerir:</span>
                      {MARGENES.map(m => (
                        <button key={m.value} type="button"
                          onClick={() => { setMargenSugerido(m.value); setForm(f => ({ ...f, precioVenta: Math.round(f.precioCompra * m.value) })) }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                            margenSugerido === m.value ? 'bg-[#7C3AED] text-white border-[#7C3AED]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#7C3AED] hover:text-[#7C3AED]'
                          }`}>
                          {m.label} = {formatCOP(Math.round(form.precioCompra * m.value))}
                        </button>
                      ))}
                    </div>
                  )}
                  <input type="number" min="0" value={form.precioVenta}
                    onChange={e => { setMargenSugerido(null); setForm(f => ({ ...f, precioVenta: parseFloat(e.target.value) || 0 })) }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>

                {/* Resumen final */}
                {form.precioVenta > 0 && form.precioCompra > 0 && (
                  <div className="bg-purple-50 rounded-xl p-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Utilidad por unidad</span>
                      <span className="font-bold text-emerald-600">{formatCOP(form.precioVenta - form.precioCompra)}</span>
                    </div>
                    {form.cantidad > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Utilidad total ({form.cantidad} und.)</span>
                        <span className="font-bold text-emerald-600">{formatCOP((form.precioVenta - form.precioCompra) * form.cantidad)}</span>
                      </div>
                    )}
                    {totalInvertido && (
                      <div className="flex justify-between border-t border-purple-100 pt-1 mt-1">
                        <span className="text-gray-500">Recuperas inversión con</span>
                        <span className="font-bold text-[#7C3AED]">
                          {Math.ceil(parseFloat(totalInvertido) / form.precioVenta)} ventas
                        </span>
                      </div>
                    )}
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

      {/* Modal historial producto agotado */}
      {modalHistorial && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40">
          <div className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{modalHistorial.producto?.nombre}</h2>
                  <p className="text-sm text-gray-400 mt-0.5">Historial — quién lo compró o debe</p>
                </div>
                <button onClick={() => setModalHistorial(null)} className="p-2 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
              </div>

              {/* Info del producto */}
              <div className="flex flex-wrap gap-2 mb-4">
                {modalHistorial.producto?.talla && <span className="text-sm font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">T.{modalHistorial.producto.talla.toUpperCase()}</span>}
                {modalHistorial.producto?.color && <span className="text-sm text-gray-700 bg-gray-100 px-2.5 py-1 rounded-lg capitalize">{modalHistorial.producto.color}</span>}
                <span className="text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-lg">Agotado</span>
              </div>

              {loadingHistorial ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-[#7C3AED] border-t-transparent animate-spin" />
                </div>
              ) : modalHistorial.historial?.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 font-semibold">Sin historial de ventas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modalHistorial.historial.map((h, i) => (
                    <div key={i} className={`rounded-xl p-3 border ${
                      h.tipo === 'credito' && h.saldoPendiente > 0
                        ? 'bg-red-50 border-red-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {h.cliente
                              ? <span className="font-bold text-gray-900 text-base">{h.cliente}</span>
                              : <span className="text-gray-400 text-sm italic">Sin nombre</span>
                            }
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                              h.tipo === 'credito' && h.saldoPendiente > 0
                                ? 'bg-red-100 text-red-700'
                                : h.tipo === 'credito'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-purple-100 text-purple-700'
                            }`}>
                              {h.tipo === 'credito' && h.saldoPendiente > 0
                                ? `Debe ${formatCOP(h.saldoPendiente)}`
                                : h.tipo === 'credito'
                                ? 'Pagó todo ✓'
                                : 'Venta contado'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {h.cantidad} und. · {formatCOP(h.total)} · {fechaRelativa(h.fecha)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón reabastecer */}
              <button
                onClick={() => { setModalHistorial(null); handleEditar(modalHistorial.producto) }}
                className="w-full mt-4 bg-[#7C3AED] text-white font-black text-base py-4 rounded-xl hover:bg-[#5B21B6] transition-colors">
                Reabastecer este producto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
