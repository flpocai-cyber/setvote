import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    Music, LayoutDashboard, Settings, LogOut,
    Users, UserCircle, BarChart2, Share2, Copy,
    RefreshCw, Trash2, Eye, Link as LinkIcon, CalendarDays
} from 'lucide-react'

// Utilizar a mesma chave do localStorage que usamos na página pública
const STORAGE_KEY = 'musician_share_token'

const AdminShareLink = () => {
    const [token, setToken] = useState(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const savedToken = localStorage.getItem(STORAGE_KEY)
        if (savedToken) {
            setToken(savedToken)
        }
    }, [])

    const generateToken = () => {
        if (token && !window.confirm('Existe um link ativo. Deseja gerar um NOVO link e revogar o antigo?')) {
            return
        }

        // Gera um token aleatório simples (tipo UUID)
        const newToken = crypto.randomUUID()
        localStorage.setItem(STORAGE_KEY, newToken)
        setToken(newToken)
        setCopied(false)
    }

    const copyLink = () => {
        if (!token) return

        const url = `${window.location.origin}/setlist/${token}`
        navigator.clipboard.writeText(url)
            .then(() => {
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            })
            .catch(err => {
                console.error('Erro ao copiar:', err)
                alert('Não foi possível copiar o link.')
            })
    }

    const revokeToken = () => {
        if (window.confirm('Tem certeza? Isso fará com que o link atual pare de funcionar imediatamente para todos os músicos.')) {
            localStorage.removeItem(STORAGE_KEY)
            setToken(null)
            setCopied(false)
        }
    }

    const publicUrl = token ? `${window.location.origin}/setlist/${token}` : ''

    return (
        <div className="min-h-screen bg-charcoal-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-charcoal-900 border-r border-charcoal-800 flex flex-col hidden lg:flex">
                <div className="p-6">
                    <h2 className="text-xl font-display font-bold gold-gradient flex items-center space-x-2">
                        <Music className="text-gold-500" />
                        <span>SetVote Admin</span>
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/admin/dashboard" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/musicas" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Music size={20} />
                        <span>Músicas</span>
                    </Link>
                    <Link to="/admin/patrocinadores" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Users size={20} />
                        <span>Patrocinadores</span>
                    </Link>
                    <Link to="/admin/sobre" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <UserCircle size={20} />
                        <span>Sobre o Músico</span>
                    </Link>
                    <Link to="/admin/estatisticas" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <BarChart2 size={20} />
                        <span>Estatísticas</span>
                    </Link>
                    <Link to="/admin/link-musicos" className="flex items-center space-x-3 text-gold-500 bg-gold-500/10 px-4 py-3 rounded-xl transition-all">
                        <Share2 size={20} />
                        <span>Link para Músicos</span>
                    </Link>
                    <Link to="/admin/eventos-futuros" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <CalendarDays size={20} />
                        <span>Eventos Futuros</span>
                    </Link>
                    <Link to="/admin/configuracoes" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Settings size={20} />
                        <span>Configurações</span>
                    </Link>
                </nav>

                <div className="p-4 mt-auto">
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center space-x-3 text-charcoal-500 hover:text-red-400 px-4 py-3 transition-colors w-full"
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-10">
                        <h1 className="text-4xl font-display font-bold text-white mb-3">Link para Músicos</h1>
                        <p className="text-charcoal-400 text-lg">
                            Gere um link especial para seus músicos acompanharem a setlist em tempo real.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Status Card */}
                        <div className="glass rounded-3xl p-8 border-2 border-charcoal-800">
                            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-6">
                                <LinkIcon className="text-gold-500 w-7 h-7" />
                            </div>

                            <h2 className="text-2xl font-display font-bold text-white mb-2">Status do Link</h2>

                            {token ? (
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 text-green-400 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        Link Ativo e Funcionando
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-charcoal-500 uppercase tracking-wider">
                                            Compartilhe este link:
                                        </label>
                                        <div className="flex bg-charcoal-900 border border-charcoal-700 rounded-xl overflow-hidden p-1">
                                            <input
                                                type="text"
                                                readOnly
                                                value={publicUrl}
                                                className="bg-transparent border-none text-charcoal-300 w-full px-4 outline-none text-sm font-mono"
                                            />
                                            <button
                                                onClick={copyLink}
                                                className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shrink-0 ${copied
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : 'gold-bg-gradient text-charcoal-950 hover:opacity-90'
                                                    }`}
                                            >
                                                <Copy size={16} />
                                                {copied ? 'Copiado!' : 'Copiar'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3 pt-4 border-t border-charcoal-800">
                                        <button
                                            onClick={generateToken}
                                            className="px-5 py-3 rounded-xl font-medium text-sm border border-charcoal-700 text-charcoal-300 hover:text-white hover:bg-charcoal-800 transition-all flex items-center gap-2"
                                        >
                                            <RefreshCw size={16} /> Gerar Novo Link
                                        </button>

                                        <button
                                            onClick={revokeToken}
                                            className="px-5 py-3 rounded-xl font-medium text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 ml-auto"
                                        >
                                            <Trash2 size={16} /> Revogar Link
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-charcoal-800/50 text-charcoal-400 px-4 py-3 rounded-xl font-medium flex items-center gap-2 border border-charcoal-700 border-dashed">
                                        Nenhum link ativo no momento
                                    </div>

                                    <p className="text-charcoal-400 text-sm leading-relaxed">
                                        Ao gerar um link, seus músicos poderão abrir a página no celular e ver a setlist sendo atualizada ao vivo conforme você toca as músicas.
                                    </p>

                                    <button
                                        onClick={generateToken}
                                        className="w-full gold-bg-gradient text-charcoal-950 font-bold px-6 py-4 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Share2 size={20} />
                                        Gerar Link para Músicos
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Info Card */}
                        <div className="bg-charcoal-900 border border-charcoal-800 rounded-3xl p-8">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                <Eye className="text-gold-500" /> O que os músicos vêem?
                            </h3>

                            <ul className="space-y-4">
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-charcoal-800 flex items-center justify-center shrink-0 text-charcoal-400">1</div>
                                    <div>
                                        <p className="text-white font-medium mb-1">Acesso Direto (Sem Login)</p>
                                        <p className="text-charcoal-500 text-sm">Os músicos não precisam criar conta nem fazer login. É só clicar no link e a tela abre.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-charcoal-800 flex items-center justify-center shrink-0 text-charcoal-400">2</div>
                                    <div>
                                        <p className="text-white font-medium mb-1">Setlist ao Vivo</p>
                                        <p className="text-charcoal-500 text-sm">A lista de músicas atualiza automaticamente para eles assim que você marca como tocada.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-charcoal-800 flex items-center justify-center shrink-0 text-charcoal-400">3</div>
                                    <div>
                                        <p className="text-white font-medium mb-1">Links de Partituras</p>
                                        <p className="text-charcoal-500 text-sm">Eles podem abrir as partituras em PDF ou link externo (cifraclub) diretamente da lista.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-charcoal-800 flex items-center justify-center shrink-0 text-charcoal-400">4</div>
                                    <div>
                                        <p className="text-white font-medium mb-1">100% Seguro</p>
                                        <p className="text-charcoal-500 text-sm">A tela deles é somente leitura. Não há botões para editar, excluir ou marcar músicas.</p>
                                    </div>
                                </li>
                            </ul>

                            {token && (
                                <div className="mt-8 pt-6 border-t border-charcoal-800">
                                    <a
                                        href={publicUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-charcoal-800 text-white font-medium hover:bg-gold-500 hover:text-black transition-colors"
                                    >
                                        <Eye size={18} /> Ver Preview da Tela
                                    </a>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdminShareLink
