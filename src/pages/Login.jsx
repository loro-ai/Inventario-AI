import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Store, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [modo, setModo] = useState('login')
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [verPassword, setVerPassword] = useState(false)
  const [cargando, setCargando] = useState(false)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCargando(true)
    try {
      if (modo === 'login') {
        await login(form.email, form.password)
      } else {
        if (!form.nombre.trim()) { toast.error('El nombre es requerido'); return }
        await register(form.nombre, form.email, form.password)
      }
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-sm border border-purple-100">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-[#7C3AED] flex items-center justify-center mx-auto mb-4">
            <Store className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Mi Tiendita</h1>
          <p className="text-gray-500 mt-1">Tu negocio en la palma de la mano 💜</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {modo === 'register' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">Tu nombre</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                placeholder="María González"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="maria@correo.com"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={verPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 text-base"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setVerPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {verPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-[#7C3AED] text-white font-black text-lg py-4 rounded-xl hover:bg-[#5B21B6] transition-colors disabled:opacity-60 mt-2"
          >
            {cargando ? 'Cargando...' : modo === 'login' ? 'Entrar a mi tiendita' : 'Crear mi cuenta'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          {modo === 'login' ? '¿Eres nueva?' : '¿Ya tienes cuenta?'}{' '}
          <button
            onClick={() => setModo(m => m === 'login' ? 'register' : 'login')}
            className="text-[#7C3AED] font-bold hover:underline"
          >
            {modo === 'login' ? 'Crea tu cuenta' : 'Inicia sesión'}
          </button>
        </p>
      </div>
    </div>
  )
}
