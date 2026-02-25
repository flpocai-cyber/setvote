import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    Plus, Search, Edit2, Trash2, Eye,
    Music, FileText, LayoutDashboard, Settings,
    LogOut, ChevronRight, CheckCircle2, XCircle, Users, UserCircle
} from 'lucide-react'
import SongModal from '../../components/admin/SongModal'

const AdminSongs = () => {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSong, setEditingSong] = useState(null)

    useEffect(() => {
        fetchSongs()
    }, [])

    const fetchSongs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('title', { ascending: true })

        if (error) {
            console.error('Error fetching songs:', error)
        } else {
            setSongs(data)
        }
        setLoading(false)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta música?')) {
            const { error } = await supabase.from('songs').delete().eq('id', id)
            if (error) {
                alert('Erro ao excluir música')
            } else {
                setSongs(songs.filter(s => s.id !== id))
            }
        }
    }

    const handleToggleActive = async (song) => {
        const { error } = await supabase
            .from('songs')
            .update({ is_active: !song.is_active })
            .eq('id', song.id)

        if (error) {
            alert('Erro ao atualizar status')
        } else {
            setSongs(songs.map(s => s.id === song.id ? { ...s, is_active: !s.is_active } : s))
        }
    }

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const openAddModal = () => {
        setEditingSong(null)
        setIsModalOpen(true)
    }

    const openEditModal = (song) => {
        setEditingSong(song)
        setIsModalOpen(true)
    }

    return (
        <div className="min-h-screen bg-charcoal-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-charcoal-900 border-r border-charcoal-800 flex flex-col">
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
                    <Link to="/admin/musicas" className="flex items-center space-x-3 text-gold-500 bg-gold-500/10 px-4 py-3 rounded-xl transition-all">
                        <Music size={20} />
                        <span>Músicas</span>
                    </Link>
                    <Link to="/admin/patrocinadores" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Users size={20} /><span>Patrocinadores</span>
                    </Link>
                    <Link to="/admin/sobre" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <UserCircle size={20} /><span>Sobre o Músico</span>
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
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-white mb-2">Gerenciar Repertório</h1>
                            <p className="text-charcoal-400">Total de {songs.length} músicas cadastradas</p>
                        </div>

                        <button
                            onClick={openAddModal}
                            className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all"
                        >
                            <Plus size={20} />
                            <span>Nova Música</span>
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou artista..."
                                className="w-full bg-charcoal-900/50 border border-charcoal-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500/50"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className="glass rounded-2xl overflow-hidden border border-charcoal-800">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-charcoal-900/50 border-b border-charcoal-800">
                                    <th className="px-6 py-4 text-charcoal-400 font-medium text-sm">Música</th>
                                    <th className="px-6 py-4 text-charcoal-400 font-medium text-sm text-center">Votos</th>
                                    <th className="px-6 py-4 text-charcoal-400 font-medium text-sm text-center">Votação</th>
                                    <th className="px-6 py-4 text-charcoal-400 font-medium text-sm text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-charcoal-800/50">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-6 py-8">
                                                <div className="h-4 bg-charcoal-800 rounded w-1/3"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredSongs.length > 0 ? (
                                    filteredSongs.map((song) => (
                                        <tr key={song.id} className="hover:bg-charcoal-900/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className="w-12 h-12 rounded-lg bg-charcoal-800 flex items-center justify-center overflow-hidden border border-charcoal-700">
                                                        {song.cover_image_url ? (
                                                            <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Music className="text-charcoal-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-gold-400 transition-colors">{song.title}</div>
                                                        <div className="text-sm text-charcoal-400">{song.artist}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-gold-500/10 text-gold-500 text-sm font-bold">
                                                    {song.votes}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => handleToggleActive(song)}
                                                    className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${song.is_active
                                                        ? 'bg-green-500/10 text-green-500'
                                                        : 'bg-charcoal-800 text-charcoal-500'
                                                        }`}
                                                >
                                                    {song.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                    <span>{song.is_active ? 'Aberta' : 'Fechada'}</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button
                                                        onClick={() => openEditModal(song)}
                                                        className="p-2 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/10 rounded-lg transition-all"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(song.id)}
                                                        className="p-2 text-charcoal-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-charcoal-500">
                                            Nenhuma música encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal for Add/Edit */}
            {isModalOpen && (
                <SongModal
                    isOpen={isModalOpen}
                    song={editingSong}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false)
                        fetchSongs()
                    }}
                />
            )}
        </div>
    )
}

export default AdminSongs
