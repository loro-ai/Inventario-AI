export function formatCOP(valor) {
  if (!valor && valor !== 0) return '$0'
  return '$' + Math.round(Number(valor)).toLocaleString('es-CO').replace(/,/g, '.')
}

export function fechaRelativa(fecha) {
  const d = new Date(fecha)
  const ahora = new Date()
  const diffDias = Math.floor((ahora - d) / (1000 * 60 * 60 * 24))
  if (diffDias === 0) return 'hoy'
  if (diffDias === 1) return 'ayer'
  if (diffDias < 7) return `hace ${diffDias} días`
  if (diffDias < 14) return 'hace una semana'
  if (diffDias < 30) return `hace ${Math.floor(diffDias / 7)} semanas`
  const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${d.getDate()} de ${meses[d.getMonth()]}`
}

export function getIniciales(nombre) {
  return (nombre || '?').split(' ').slice(0, 2).map(n => n[0]?.toUpperCase() || '').join('')
}

export function colorStock(cantidad) {
  if (cantidad === 0) return 'bg-red-100 text-red-700 border-red-200'
  if (cantidad <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}

export function colorEstadoCredito(estado) {
  if (estado === 'pagado') return 'bg-green-100 text-green-700 border-green-200'
  if (estado === 'abonado') return 'bg-purple-100 text-purple-700 border-purple-200'
  return 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

export function colorEstadoTemu(estado) {
  const map = {
    pendiente: 'bg-gray-100 text-gray-700 border-gray-200',
    pedido_en_temu: 'bg-blue-100 text-blue-700 border-blue-200',
    en_camino: 'bg-blue-100 text-blue-700 border-blue-200',
    llego: 'bg-green-100 text-green-700 border-green-200',
    entregado: 'bg-purple-100 text-purple-700 border-purple-200',
    cancelado: 'bg-gray-100 text-gray-400 border-gray-200',
  }
  return map[estado] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function labelEstadoTemu(estado) {
  const map = {
    pendiente: 'Pendiente', pedido_en_temu: 'En Temu',
    en_camino: 'En camino', llego: 'Llegó',
    entregado: 'Entregado', cancelado: 'Cancelado',
  }
  return map[estado] || estado
}

export function colorEstadoCliente(estado) {
  const map = {
    en_curso: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    llego: 'bg-green-100 text-green-700 border-green-200',
    entregado: 'bg-purple-100 text-purple-700 border-purple-200',
    cancelado: 'bg-gray-100 text-gray-400 border-gray-200',
  }
  return map[estado] || 'bg-gray-100 text-gray-700 border-gray-200'
}

export function labelEstadoCliente(estado) {
  const map = { en_curso: 'En curso', llego: 'Llegó', entregado: 'Entregado', cancelado: 'Cancelado' }
  return map[estado] || estado
}
