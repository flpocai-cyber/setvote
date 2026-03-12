import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
    Plus, Search, Edit2, Trash2,
    Music, CheckCircle2, XCircle, Loader2
} from 'lucide-react'
import SongModal from '../../components/admin/SongModal'
import AdminLayout from '../../components/admin/AdminLayout'
import { useTheme } from '../../context/ThemeContext'

const AdminSongs = () => {
    const { darkMode } = useTheme()
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingSong, setEditingSong] = useState(null)

    useEffect(() => { fetchSongs() }, [])

    const fetchSongs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .order('title', { ascending: true })
        if (!error) setSongs(data)
        setLoading(false)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Tem certeza que deseja excluir esta música?')) {
            const { error } = await supabase.from('songs').delete().eq('id', id)
            if (error) { alert('Erro ao excluir música') }
            else { setSongs(songs.filter(s => s.id !== id)) }
        }
    }

    const handleToggleActive = async (song) => {
        const { error } = await supabase
            .from('songs')
            .update({ is_active: !song.is_active })
            .eq('id', song.id)
        if (error) { alert('Erro ao atualizar status') }
        else { setSongs(songs.map(s => s.id === song.id ? { ...s, is_active: !s.is_active } : s)) }
    }

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const openAddModal = () => { setEditingSong(null); setIsModalOpen(true) }
    const openEditModal = (song) => { setEditingSong(song); setIsModalOpen(true) }

    // Theme helpers
    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        searchWrap: darkMode ? 'bg-charcoal-900/60 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        searchIcon: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        input: darkMode
            ? 'bg-charcoal-900/50 border-charcoal-800 text-white placeholder:text-charcoal-600 focus:border-gold-500/50'
            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-gold-500/50',
        tableWrap: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        thead: darkMode ? 'bg-charcoal-900/70 border-charcoal-800 text-charcoal-400' : 'bg-gray-50 border-gray-200 text-gray-600',
        tbody: darkMode ? 'divide-charcoal-800/50' : 'divide-gray-100',
        row: darkMode ? 'hover:bg-charcoal-800/30' : 'hover:bg-gray-50',
        coverBg: darkMode ? 'bg-charcoal-800 border-charcoal-700' : 'bg-gray-100 border-gray-200',
        songTitle: darkMode ? 'text-white group-hover:text-gold-400' : 'text-gray-900 group-hover:text-gold-500',
        artist: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        actionBtn: darkMode ? 'text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/10' : 'text-gray-400 hover:text-gold-500 hover:bg-gold-100',
        deleteBtn: darkMode ? 'text-charcoal-400 hover:text-red-500 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50',
        empty: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        skeleton: darkMode ? 'bg-charcoal-800' : 'bg-gray-200',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className={`text-4xl font-display font-bold mb-2 ${t.heading}`}>Gerenciar Repertório</h1>
                            <p className={t.sub}>Total de {songs.length} músicas cadastradas</p>
                        </div>
                        <button
                            onClick={openAddModal}
                            className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all"
                        >
                            <Plus size={20} />
                            <span>Nova Música</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className={`rounded-2xl p-4 mb-8 flex items-center gap-4 border ${t.searchWrap}`}>
                        <div className="relative flex-1">
                            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${t.searchIcon}`} size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome ou artista..."
                                className={`w-full border rounded-xl py-3 pl-12 pr-4 focus:outline-none transition-all ${t.input}`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div className={`rounded-2xl overflow-hidden border ${t.tableWrap}`}>
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className={`border-b ${t.thead}`}>
                                    <th className="px-6 py-4 font-semibold text-sm">Música</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">Votos</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">Votação</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${t.tbody}`}>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan="4" className="px-6 py-8">
                                                <div className={`h-4 rounded w-1/3 ${t.skeleton}`}></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : filteredSongs.length > 0 ? (
                                    filteredSongs.map((song) => (
                                        <tr key={song.id} className={`transition-colors group ${t.row}`}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-4">
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden border ${t.coverBg}`}>
                                                        {song.cover_image_url ? (
                                                            <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <Music className={darkMode ? 'text-charcoal-600' : 'text-gray-400'} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className={`font-bold transition-colors ${t.songTitle}`}>{song.title}</div>
                                                        <div className={`text-sm ${t.artist}`}>{song.artist}</div>
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
                                                        : darkMode ? 'bg-charcoal-800 text-charcoal-500' : 'bg-gray-100 text-gray-400'
                                                    }`}
                                                >
                                                    {song.is_active ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                                    <span>{song.is_active ? 'Aberta' : 'Fechada'}</span>
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-2">
                                                    <button onClick={() => openEditModal(song)} className={`p-2 rounded-lg transition-all ${t.actionBtn}`} title="Editar">
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(song.id)} className={`p-2 rounded-lg transition-all ${t.deleteBtn}`} title="Excluir">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className={`px-6 py-12 text-center ${t.empty}`}>
                                            Nenhuma música encontrada.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <SongModal
                    isOpen={isModalOpen}
                    song={editingSong}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => { setIsModalOpen(false); fetchSongs() }}
                />
            )}
        </AdminLayout>
    )
}

export default AdminSongs
