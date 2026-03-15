import { useState, useEffect } from 'react'
import { TrendingUp, Package, Users, DollarSign, AlertTriangle, Star, Sparkles } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../lib/api'
import { formatCOP } from '../lib/utils'

function MetricaCard({ titulo, valor, icono: Icono, color, subtitulo }) {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-500">{titulo}</span>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icono className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="text-2xl font-black text-gray-900 leading-tight">{valor}</p>
      {subtitulo && <p className="text-xs text-gray-400">{subtitulo}</p>}
    </div>
  )
}

export default function Inicio() {
  const [resumen, setResumen] = useState(null)
  const [ventasDiarias, setVentasDiarias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/dashboard/resumen'),
      api.get('/api/dashboard/ventas-diarias'),
    ]).then(([r1, r2]) => {
      setResumen(r1.data)
      setVentasDiarias(r2.data)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="p-4 space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-white rounded-2xl border border-purple-100 animate-pulse" />
      ))}
    </div>
  )

  const stockBajo = resumen?.stockBajo || []
  const topProductos = resumen?.topProductos || []

  return (
    <div className="p-4 space-y-5 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-gray-900">¡Hola! 👋</h1>
        <p className="text-gray-500 text-base">Así va tu negocio hoy</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricaCard titulo="Ventas del mes" valor={String(resumen?.totalVentasMes ?? 0)} icono={TrendingUp} color="bg-[#7C3AED]" subtitulo="unidades vendidas" />
        <MetricaCard titulo="Ganancias" valor={formatCOP(resumen?.gananciaMes ?? 0)} icono={DollarSign} color="bg-emerald-500" subtitulo="este mes" />
        <MetricaCard titulo="En mi casa" valor={String(resumen?.totalProductos ?? 0)} icono={Package} color="bg-violet-500" subtitulo="productos con stock" />
        <MetricaCard titulo="Agotados" valor={String(resumen?.totalAgotados ?? 0)} icono={Package} color="bg-gray-400" subtitulo="sin unidades" />
        <div className="col-span-2">
          <MetricaCard titulo="Me deben" valor={formatCOP(resumen?.totalDeuda ?? 0)} icono={Users} color="bg-red-500" subtitulo="por cobrar" />
        </div>
      </div>

      {stockBajo.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-yellow-800 text-sm">
              ¡Stock bajo en {stockBajo.length} producto{stockBajo.length > 1 ? 's' : ''}!
            </p>
            <p className="text-yellow-700 text-sm mt-1">
              {stockBajo.slice(0, 3).map(p => `${p.nombre} (${p.cantidad} und.)`).join(', ')}
              {stockBajo.length > 3 && ` y ${stockBajo.length - 3} más`}
            </p>
          </div>
        </div>
      )}

      {/* Reporte IA local */}
      <div className="bg-purple-50 rounded-2xl border border-purple-100 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#7C3AED]" />
          <h2 className="font-bold text-base text-gray-900">Reporte de tu asistente</h2>
        </div>
        <div className="space-y-2">
          {resumen?.gananciaMes > 0
            ? <p className="text-sm text-gray-800">Este mes llevas {formatCOP(resumen.gananciaMes)} de ganancias con {resumen.totalVentasMes} ventas. ¡Vas muy bien! 💜</p>
            : <p className="text-sm text-gray-800">Aún no hay ventas este mes. ¡Cuéntame cuando vendas algo!</p>
          }
          {resumen?.totalDeuda > 0 && (
            <p className="text-sm text-gray-800">Tienes {formatCOP(resumen.totalDeuda)} pendientes por cobrar. Recuerda hacer seguimiento.</p>
          )}
          {topProductos.length > 0 && (
            <p className="text-sm text-gray-800">Tu producto estrella es "{topProductos[0].nombre}" con {topProductos[0].cantidad} unidades vendidas.</p>
          )}
          {stockBajo.some(p => p.cantidad === 0) && (
            <p className="text-sm text-gray-800">
              Tienes productos agotados: {stockBajo.filter(p => p.cantidad === 0).map(p => p.nombre).join(', ')}. Es hora de pedir más.
            </p>
          )}
        </div>
      </div>

      {/* Gráfica ventas diarias */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
        <h2 className="font-bold text-lg text-gray-900 mb-4">Ventas esta semana</h2>
        {ventasDiarias.length > 0 ? (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={ventasDiarias} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="dia" tick={{ fontSize: 12, fontFamily: 'Nunito', fontWeight: 700 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fontFamily: 'Nunito' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v) => [v, 'Unidades']}
                contentStyle={{ fontFamily: 'Nunito', borderRadius: '12px', border: '1px solid #C4B5FD', fontSize: '13px' }}
              />
              <Bar dataKey="ventas" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Ventas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-center py-8 text-sm">Aún no hay ventas esta semana</p>
        )}
      </div>

      {/* Top productos */}
      {topProductos.length > 0 && (
        <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-yellow-500" />
            <h2 className="font-bold text-lg text-gray-900">Más vendidos del mes</h2>
          </div>
          <div className="space-y-3">
            {topProductos.slice(0, 3).map((p, i) => (
              <div key={p.nombre} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-purple-50 text-[#7C3AED] font-black text-sm flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight">{p.nombre}</p>
                    <p className="text-xs text-gray-400">{p.cantidad} vendidas</p>
                  </div>
                </div>
                <span className="font-bold text-emerald-600 text-sm whitespace-nowrap">{formatCOP(p.ganancia)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
