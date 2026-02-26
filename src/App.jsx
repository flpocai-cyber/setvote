import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Public Pages
import PublicGallery from './pages/public/PublicGallery'

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminSongs from './pages/admin/AdminSongs'
import AdminSettings from './pages/admin/AdminSettings'
import AdminSponsors from './pages/admin/AdminSponsors'
import AdminAbout from './pages/admin/AdminAbout'
import AdminEstatisticas from './pages/admin/AdminEstatisticas'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicGallery />} />
          <Route path="/votar" element={<PublicGallery />} />

          {/* Admin Login */}
          <Route path="/admin" element={<AdminLogin />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/musicas" element={<AdminSongs />} />
            <Route path="/admin/patrocinadores" element={<AdminSponsors />} />
            <Route path="/admin/configuracoes" element={<AdminSettings />} />
            <Route path="/admin/sobre" element={<AdminAbout />} />
            <Route path="/admin/estatisticas" element={<AdminEstatisticas />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
