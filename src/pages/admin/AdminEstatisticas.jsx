import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    BarChart2, Music, CalendarDays, Mic2, FileDown,
    ChevronUp, ChevronDown, Trophy, MapPin,
    Trash2, Edit2, X, Save, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminEstatisticas = () => {
    const { darkMode } = useTheme()
    const [shows, setShows] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedShow, setExpandedShow] = useState(null)
    const [showSongs, setShowSongs] = useState({})
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editingShow, setEditingShow] = useState(null)
    const [isSaving, setIsSaving] = useState(false)

    const UF_LIST = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

    useEffect(() => { fetchShows() }, [])

    const fetchShows = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('shows').select('*').order('show_date', { ascending: false })
        if (!error) setShows(data || [])
        setLoading(false)
    }

    const loadShowSongs = async (showId) => {
        if (showSongs[showId]) return
        const { data } = await supabase.from('show_songs').select('*').eq('show_id', showId).order('votes', { ascending: false })
        setShowSongs(prev => ({ ...prev, [showId]: data || [] }))
    }

    const toggleExpand = async (showId) => {
        if (expandedShow === showId) { setExpandedShow(null) }
        else { setExpandedShow(showId); await loadShowSongs(showId) }
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
    }

    const handleDelete = async (show) => {
        if (!window.confirm(`Tem certeza que deseja excluir permanentemente o show "${show.file_key}"?\n\nEsta ação não pode ser desfeita.`)) return
        const { error } = await supabase.from('shows').delete().eq('id', show.id)
        if (error) { alert('Erro ao excluir show: ' + error.message); return }
        setShows(prev => prev.filter(s => s.id !== show.id))
    }

    const handleEditOpen = (show) => { setEditingShow({ ...show }); setIsEditModalOpen(true) }

    const handleUpdateShow = async (e) => {
        e.preventDefault(); setIsSaving(true)
        try {
            const venuePart = editingShow.venue.replace(/\s+/g, '').substring(0, 10).toUpperCase()
            const [y, m, d] = editingShow.show_date.split('-')
            const newFileKey = `${venuePart}-${d}-${m}-${y.slice(2)}`
            const { error } = await supabase.from('shows').update({ show_date: editingShow.show_date, venue: editingShow.venue, city: editingShow.city, state: editingShow.state, musician_name: editingShow.musician_name, file_key: newFileKey }).eq('id', editingShow.id)
            if (error) throw error
            setShows(prev => prev.map(s => s.id === editingShow.id ? { ...editingShow, file_key: newFileKey } : s))
            setIsEditModalOpen(false); alert('Show atualizado com sucesso.')
        } catch (err) { alert('Erro ao atualizar show: ' + err.message) }
        finally { setIsSaving(false) }
    }

    const exportPDF = (show) => {
        const songs = showSongs[show.id] || []
        const doc = new jsPDF()
        doc.setFillColor(20, 18, 16); doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(212, 175, 55); doc.setFont('helvetica', 'bold'); doc.setFontSize(20)
        doc.text('SetVote — Relatório de Show', 14, 20)
        doc.setFontSize(10); doc.setTextColor(160, 150, 140); doc.text(`Arquivo: ${show.file_key}`, 14, 30)
        doc.setTextColor(30, 30, 30); doc.setFontSize(11); doc.setFont('helvetica', 'normal')
        const infoY = 50; doc.setFont('helvetica', 'bold'); doc.text('Informações do Show', 14, infoY)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
        doc.text(`Data: ${formatDate(show.show_date)}`, 14, infoY + 8)
        doc.text(`Músico / Banda: ${show.musician_name}`, 14, infoY + 16)
        doc.text(`Local: ${show.venue}`, 14, infoY + 24)
        doc.text(`Cidade: ${show.city} - ${show.state}`, 14, infoY + 32)
        const tableBody = songs.map((s, i) => [i + 1, s.song_title, s.artist, s.votes, s.played ? 'Sim' : 'Não'])
        autoTable(doc, {
            startY: infoY + 44, head: [['#', 'Música', 'Artista', 'Votos', 'Tocada']],
            body: tableBody, headStyles: { fillColor: [212, 175, 55], textColor: [20, 18, 16], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 243, 240] }, styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: { 0: { halign: 'center', cellWidth: 12 }, 3: { halign: 'center', cellWidth: 20 }, 4: { halign: 'center', cellWidth: 22 } }
        })
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i); doc.setFontSize(8); doc.setTextColor(160, 150, 140)
            doc.text(`SetVote • Gerado em ${new Date().toLocaleDateString('pt-BR')} • Página ${i} de ${pageCount}`, 14, doc.internal.pageSize.height - 8)
        }
        doc.save(`${show.file_key}.pdf`)
    }

    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        card: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        statLabel: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        showCard: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        showHover: darkMode ? 'hover:bg-charcoal-800/30' : 'hover:bg-gray-50',
        showTitle: darkMode ? 'text-white' : 'text-gray-900',
        showMeta: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        tag: darkMode ? 'bg-charcoal-800 text-charcoal-400' : 'bg-gray-100 text-gray-500',
        divider: darkMode ? 'border-charcoal-800' : 'border-gray-200',
        expandBg: darkMode ? 'bg-charcoal-800/30' : 'bg-gray-50',
        songRow: darkMode ? 'hover:bg-charcoal-800/40 text-white' : 'hover:bg-gray-100 text-gray-900',
        songSub: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        songNum: darkMode ? 'text-charcoal-600' : 'text-gray-400',
        emptyText: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        skeletonBg: darkMode ? 'bg-charcoal-800' : 'bg-gray-200',
        actionBtn: darkMode ? 'text-charcoal-500 hover:text-gold-500 hover:bg-gold-500/10' : 'text-gray-400 hover:text-gold-500 hover:bg-gold-100',
        deleteBtn: darkMode ? 'text-charcoal-500 hover:text-red-500 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50',
        chevron: darkMode ? 'text-charcoal-400' : 'text-gray-400',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-5xl mx-auto">
                    <div className="mb-10">
                        <h1 className={`text-4xl font-display font-bold mb-2 flex items-center gap-3 ${t.heading}`}>
                            <BarChart2 className="text-gold-500" /> Estatísticas
                        </h1>
                        <p className={t.sub}>Histórico completo de shows realizados e músicas mais votadas.</p>
                    </div>

                    {/* Summary Cards */}
                    {!loading && shows.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                            {[
                                { label: 'Total de Shows', value: shows.length },
                                { label: 'Cidades Visitadas', value: new Set(shows.map(s => s.city)).size },
                                { label: 'Total de Votos', value: Object.values(showSongs).flat().reduce((acc, s) => acc + (s.votes || 0), 0) },
                            ].map(({ label, value }) => (
                                <div key={label} className={`rounded-2xl p-5 border ${t.card}`}>
                                    <div className={`text-xs font-bold uppercase tracking-widest mb-2 ${t.statLabel}`}>{label}</div>
                                    <div className="text-4xl font-display font-black text-gold-500">{value}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Shows list */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className={`rounded-2xl p-6 border animate-pulse ${t.card}`}>
                                    <div className={`h-5 rounded w-1/3 mb-3 ${t.skeletonBg}`} />
                                    <div className={`h-4 rounded w-1/2 ${t.skeletonBg}`} />
                                </div>
                            ))}
                        </div>
                    ) : shows.length === 0 ? (
                        <div className={`text-center py-24 rounded-3xl border border-dashed ${t.card}`}>
                            <BarChart2 className={`w-14 h-14 mx-auto mb-4 ${t.emptyText}`} />
                            <p className={`text-lg font-medium ${t.emptyText}`}>Nenhum show finalizado ainda.</p>
                            <p className={`text-sm mt-2 ${t.emptyText}`}>Cadastre e finalize um show no Dashboard para ver os dados aqui.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {shows.map((show, idx) => {
                                const isExpanded = expandedShow === show.id
                                const songs = showSongs[show.id] || []
                                const topSong = songs[0]
                                return (
                                    <motion.div key={show.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                        className={`rounded-2xl border overflow-hidden ${t.showCard}`}>
                                        <div className={`flex items-center justify-between p-5 cursor-pointer transition-colors ${t.showHover}`}
                                            onClick={() => toggleExpand(show.id)}>
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                                                    <Mic2 className="text-gold-500" size={22} />
                                                </div>
                                                <div>
                                                    <div className={`font-bold text-lg leading-tight ${t.showTitle}`}>
                                                        {show.musician_name}
                                                        <span className={`ml-2 text-xs font-normal px-2 py-0.5 rounded-full ${t.tag}`}>{show.file_key}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-4 mt-1 text-sm ${t.showMeta}`}>
                                                        <span className="flex items-center gap-1.5"><CalendarDays size={13} /> {formatDate(show.show_date)}</span>
                                                        <span className="flex items-center gap-1.5"><MapPin size={13} /> {show.venue} — {show.city}/{show.state}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isExpanded && songs.length > 0 && (
                                                    <button onClick={(e) => { e.stopPropagation(); exportPDF(show) }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 rounded-xl text-sm font-medium transition-all">
                                                        <FileDown size={15} /><span className="hidden sm:inline">Exportar PDF</span>
                                                    </button>
                                                )}
                                                <div className={`flex items-center border-l ml-2 pl-2 gap-1 ${t.divider}`}>
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditOpen(show) }}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${t.actionBtn}`}>
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(show) }}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${t.deleteBtn}`}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                                <div className={`ml-2 ${t.chevron}`}>{isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                                                    <div className={`border-t px-5 pb-5 pt-4 ${t.divider}`}>
                                                        {songs.length === 0 ? (
                                                            <p className={`text-sm text-center py-4 ${t.emptyText}`}>Nenhuma música registrada para este show.</p>
                                                        ) : (
                                                            <>
                                                                {topSong && (
                                                                    <div className="flex items-center gap-4 bg-gold-500/5 border border-gold-500/20 rounded-xl p-4 mb-4">
                                                                        <Trophy className="text-gold-500 shrink-0" size={20} />
                                                                        <div className="flex-1">
                                                                            <div className="text-xs text-gold-500 font-bold uppercase tracking-widest mb-0.5">Mais Votada</div>
                                                                            <div className={`font-bold ${t.showTitle}`}>{topSong.song_title}</div>
                                                                            <div className={`text-sm ${t.showMeta}`}>{topSong.artist}</div>
                                                                        </div>
                                                                        <div className="text-3xl font-display font-black text-gold-500">{topSong.votes}</div>
                                                                    </div>
                                                                )}
                                                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                                                    {songs.map((song, i) => (
                                                                        <div key={song.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${t.songRow}`}>
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={`text-sm font-bold w-5 text-center ${t.songNum}`}>{i + 1}</span>
                                                                                <div>
                                                                                    <div className="text-sm font-semibold">{song.song_title}</div>
                                                                                    <div className={`text-xs ${t.songSub}`}>{song.artist}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                {song.played && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold">Tocada</span>}
                                                                                <span className="bg-gold-500/10 text-gold-500 text-sm font-bold px-3 py-1 rounded-full min-w-[3rem] text-center">{song.votes}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && editingShow && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => !isSaving && setIsEditModalOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="relative w-full max-w-lg bg-charcoal-900 border border-charcoal-800 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="p-8">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-display font-bold text-white flex items-center gap-3">
                                        <Edit2 className="text-gold-500" size={24} /> Editar Show
                                    </h2>
                                    <button onClick={() => setIsEditModalOpen(false)} className="text-charcoal-500 hover:text-white transition-colors"><X size={24} /></button>
                                </div>
                                <form onSubmit={handleUpdateShow} className="space-y-5">
                                    {[
                                        { label: 'Data do Show', type: 'date', field: 'show_date' },
                                        { label: 'Nome do Músico / Banda', type: 'text', field: 'musician_name' },
                                        { label: 'Local / Estabelecimento', type: 'text', field: 'venue' },
                                    ].map(({ label, type, field }) => (
                                        <div key={field}>
                                            <label className="block text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-2">{label}</label>
                                            <input type={type} required value={editingShow[field]} onChange={(e) => setEditingShow({ ...editingShow, [field]: e.target.value })}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" />
                                        </div>
                                    ))}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-2">Cidade</label>
                                            <input type="text" required value={editingShow.city} onChange={(e) => setEditingShow({ ...editingShow, city: e.target.value })}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-charcoal-400 uppercase tracking-widest mb-2">Estado</label>
                                            <select required value={editingShow.state} onChange={(e) => setEditingShow({ ...editingShow, state: e.target.value })}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors">
                                                {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-6 py-3 border border-charcoal-700 text-charcoal-400 hover:text-white rounded-xl transition-all font-bold">Cancelar</button>
                                        <button type="submit" disabled={isSaving} className="flex-1 gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                            {isSaving ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AdminLayout>
    )
}

export default AdminEstatisticas
