import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Inventario from './pages/Inventario'
import Ventas from './pages/Ventas'
import Deudas from './pages/Deudas'
import Pedidos from './pages/Pedidos'
import Chat from './pages/Chat'

function ProtectedRoute({ children }) {
  const { isAuth, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-purple-50">
      <div className="w-10 h-10 rounded-full border-4 border-purple-600 border-t-transparent animate-spin" />
    </div>
  )
  return isAuth ? children : <Navigate to="/login" replace />
}

function AppRoutes() {
  const { isAuth } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={isAuth ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route index element={<Inicio />} />
        <Route path="inventario" element={<Inventario />} />
        <Route path="ventas" element={<Ventas />} />
        <Route path="deudas" element={<Deudas />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="chat" element={<Chat />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster richColors position="top-center" />
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
