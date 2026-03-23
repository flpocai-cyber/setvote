import { Link, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    Music, LayoutDashboard, Settings, LogOut,
    Users, UserCircle, BarChart2, Share2, CalendarDays, Sun, Moon, Heart, CreditCard
} from 'lucide-react'

const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/musicas', icon: Music, label: 'Músicas' },
    { to: '/admin/patrocinadores', icon: Users, label: 'Patrocinadores' },
    { to: '/admin/sobre', icon: UserCircle, label: 'Sobre o Músico' },
    { to: '/admin/estatisticas', icon: BarChart2, label: 'Estatísticas' },
    { to: '/admin/link-musicos', icon: Share2, label: 'Link para Músicos' },
    { to: '/admin/eventos-futuros', icon: CalendarDays, label: 'Eventos Futuros' },
    { to: '/admin/dedique', icon: Heart, label: 'Dedique uma Canção' },
    { to: '/admin/pagantes', icon: CreditCard, label: 'Pagantes' },
    { to: '/admin/configuracoes', icon: Settings, label: 'Configurações' },
]

const AdminLayout = ({ children, activePath }) => {
    const { darkMode, toggleDarkMode } = useTheme()
    const location = useLocation()
    const currentPath = activePath || location.pathname

    return (
        <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-charcoal-950' : 'bg-gray-50'}`}>
            {/* Sidebar */}
            <aside className={`w-64 border-r flex flex-col hidden lg:flex flex-shrink-0 transition-colors duration-300 ${darkMode
                ? 'bg-charcoal-900 border-charcoal-800'
                : 'bg-white border-gray-200'
            }`}>
                <div className="p-6 flex items-center justify-between">
                    <h2 className="text-xl font-display font-bold gold-gradient flex items-center space-x-2">
                        <Music className="text-gold-500" />
                        <span>SetVote Admin</span>
                    </h2>
                    {/* Dark/Light Toggle */}
                    <button
                        onClick={toggleDarkMode}
                        title={darkMode ? 'Modo claro' : 'Modo escuro'}
                        className={`p-2 rounded-xl border transition-all ${darkMode
                            ? 'bg-charcoal-800 border-charcoal-700 text-gold-400 hover:bg-charcoal-700'
                            : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                        }`}
                    >
                        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {navItems.map(({ to, icon: Icon, label }) => {
                        const isActive = currentPath === to || (to !== '/admin/dashboard' && currentPath.startsWith(to))
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${isActive
                                    ? 'text-gold-500 bg-gold-500/10'
                                    : darkMode
                                        ? 'text-charcoal-400 hover:text-gold-400 hover:bg-gold-500/5'
                                        : 'text-gray-600 hover:text-gold-500 hover:bg-gold-500/5'
                                }`}
                            >
                                <Icon size={20} />
                                <span>{label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 mt-auto">
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className={`flex items-center space-x-3 px-4 py-3 transition-colors w-full rounded-xl text-sm font-medium hover:text-red-400 ${darkMode ? 'text-charcoal-500' : 'text-gray-400'}`}
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Page Content */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    )
}

export default AdminLayout
