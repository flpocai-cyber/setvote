import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
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
import AdminShareLink from './pages/admin/AdminShareLink'
import AdminFutureEvents from './pages/admin/AdminFutureEvents'
import AdminEventList from './pages/admin/AdminEventList'
import AdminDedications from './pages/admin/AdminDedications'
import AdminPagantes from './pages/admin/AdminPagantes'
import MusicianSetlist from './pages/public/MusicianSetlist'
import PublicEventVoting from './pages/public/PublicEventVoting'

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicGallery />} />
            <Route path="/votar" element={<PublicGallery />} />
            <Route path="/setlist/:token" element={<MusicianSetlist />} />
            <Route path="/evento/:token" element={<PublicEventVoting />} />

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
              <Route path="/admin/link-musicos" element={<AdminShareLink />} />
              <Route path="/admin/eventos-futuros" element={<AdminFutureEvents />} />
              <Route path="/admin/evento/:token" element={<AdminEventList />} />
              <Route path="/admin/dedique" element={<AdminDedications />} />
              <Route path="/admin/pagantes" element={<AdminPagantes />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
