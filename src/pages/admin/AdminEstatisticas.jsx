import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    BarChart2, Music, LayoutDashboard, Settings, LogOut,
    Users, UserCircle, ChevronDown, ChevronUp, Download,
    Trophy, MapPin, CalendarDays, Mic2, FileDown
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const AdminEstatisticas = () => {
    const [shows, setShows] = useState([])
    const [loading, setLoading] = useState(true)
    const [expandedShow, setExpandedShow] = useState(null)
    const [showSongs, setShowSongs] = useState({}) // showId -> songs[]

    useEffect(() => {
        fetchShows()
    }, [])

    const fetchShows = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('shows')
            .select('*')
            .order('show_date', { ascending: false })

        if (!error) setShows(data || [])
        setLoading(false)
    }

    const loadShowSongs = async (showId) => {
        if (showSongs[showId]) return // already loaded
        const { data } = await supabase
            .from('show_songs')
            .select('*')
            .eq('show_id', showId)
            .order('votes', { ascending: false })
        setShowSongs(prev => ({ ...prev, [showId]: data || [] }))
    }

    const toggleExpand = async (showId) => {
        if (expandedShow === showId) {
            setExpandedShow(null)
        } else {
            setExpandedShow(showId)
            await loadShowSongs(showId)
        }
    }

    const formatDate = (dateStr) => {
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
    }

    const exportPDF = (show) => {
        const songs = showSongs[show.id] || []
        const doc = new jsPDF()

        // Header
        doc.setFillColor(20, 18, 16)
        doc.rect(0, 0, 210, 40, 'F')
        doc.setTextColor(212, 175, 55)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(20)
        doc.text('SetVote — Relatório de Show', 14, 20)
        doc.setFontSize(10)
        doc.setTextColor(160, 150, 140)
        doc.text(`Arquivo: ${show.file_key}`, 14, 30)

        // Info box
        doc.setTextColor(30, 30, 30)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        const infoY = 50
        doc.setFont('helvetica', 'bold')
        doc.text('Informações do Show', 14, infoY)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.text(`Data: ${formatDate(show.show_date)}`, 14, infoY + 8)
        doc.text(`Músico / Banda: ${show.musician_name}`, 14, infoY + 16)
        doc.text(`Local: ${show.venue}`, 14, infoY + 24)
        doc.text(`Cidade: ${show.city} - ${show.state}`, 14, infoY + 32)

        // Table
        const tableBody = songs.map((s, i) => [
            i + 1,
            s.song_title,
            s.artist,
            s.votes,
            s.played ? 'Sim' : 'Não'
        ])

        autoTable(doc, {
            startY: infoY + 44,
            head: [['#', 'Música', 'Artista', 'Votos', 'Tocada']],
            body: tableBody,
            headStyles: {
                fillColor: [212, 175, 55],
                textColor: [20, 18, 16],
                fontStyle: 'bold'
            },
            alternateRowStyles: { fillColor: [245, 243, 240] },
            styles: { fontSize: 9, cellPadding: 4 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 12 },
                3: { halign: 'center', cellWidth: 20 },
                4: { halign: 'center', cellWidth: 22 }
            }
        })

        // Footer
        const pageCount = doc.internal.getNumberOfPages()
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.setFontSize(8)
            doc.setTextColor(160, 150, 140)
            doc.text(
                `SetVote • Gerado em ${new Date().toLocaleDateString('pt-BR')} • Página ${i} de ${pageCount}`,
                14,
                doc.internal.pageSize.height - 8
            )
        }

        doc.save(`${show.file_key}.pdf`)
    }

    const sidebarLink = (to, icon, label, active = false) => (
        <Link
            to={to}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${active
                ? 'text-gold-500 bg-gold-500/10'
                : 'text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5'
                }`}
        >
            {icon}
            <span>{label}</span>
        </Link>
    )

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
                    {sidebarLink('/admin/dashboard', <LayoutDashboard size={20} />, 'Dashboard')}
                    {sidebarLink('/admin/musicas', <Music size={20} />, 'Músicas')}
                    {sidebarLink('/admin/patrocinadores', <Users size={20} />, 'Patrocinadores')}
                    {sidebarLink('/admin/sobre', <UserCircle size={20} />, 'Sobre o Músico')}
                    {sidebarLink('/admin/estatisticas', <BarChart2 size={20} />, 'Estatísticas', true)}
                    {sidebarLink('/admin/configuracoes', <Settings size={20} />, 'Configurações')}
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

            {/* Main */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {/* Header */}
                    <div className="mb-10">
                        <h1 className="text-4xl font-display font-bold text-white mb-2 flex items-center gap-3">
                            <BarChart2 className="text-gold-500" />
                            Estatísticas
                        </h1>
                        <p className="text-charcoal-400">Histórico completo de shows realizados e músicas mais votadas.</p>
                    </div>

                    {/* Summary Cards */}
                    {!loading && shows.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
                            <div className="glass rounded-2xl p-5 border border-charcoal-800">
                                <div className="text-charcoal-400 text-xs font-bold uppercase tracking-widest mb-2">Total de Shows</div>
                                <div className="text-4xl font-display font-black text-gold-500">{shows.length}</div>
                            </div>
                            <div className="glass rounded-2xl p-5 border border-charcoal-800">
                                <div className="text-charcoal-400 text-xs font-bold uppercase tracking-widest mb-2">Cidades Visitadas</div>
                                <div className="text-4xl font-display font-black text-gold-500">
                                    {new Set(shows.map(s => s.city)).size}
                                </div>
                            </div>
                            <div className="glass rounded-2xl p-5 border border-charcoal-800">
                                <div className="text-charcoal-400 text-xs font-bold uppercase tracking-widest mb-2">Total de Votos</div>
                                <div className="text-4xl font-display font-black text-gold-500">
                                    {Object.values(showSongs).flat().reduce((acc, s) => acc + (s.votes || 0), 0)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shows List */}
                    {loading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="glass rounded-2xl p-6 border border-charcoal-800 animate-pulse">
                                    <div className="h-5 bg-charcoal-800 rounded w-1/3 mb-3" />
                                    <div className="h-4 bg-charcoal-800 rounded w-1/2" />
                                </div>
                            ))}
                        </div>
                    ) : shows.length === 0 ? (
                        <div className="text-center py-24 glass rounded-3xl border border-dashed border-charcoal-700">
                            <BarChart2 className="w-14 h-14 text-charcoal-700 mx-auto mb-4" />
                            <p className="text-charcoal-500 text-lg font-medium">Nenhum show finalizado ainda.</p>
                            <p className="text-charcoal-600 text-sm mt-2">Cadastre e finalize um show no Dashboard para ver os dados aqui.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {shows.map((show, idx) => {
                                const isExpanded = expandedShow === show.id
                                const songs = showSongs[show.id] || []
                                const topSong = songs[0]

                                return (
                                    <motion.div
                                        key={show.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="glass rounded-2xl border border-charcoal-800 overflow-hidden"
                                    >
                                        {/* Show Header Row */}
                                        <div
                                            className="flex items-center justify-between p-5 cursor-pointer hover:bg-charcoal-800/30 transition-colors"
                                            onClick={() => toggleExpand(show.id)}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-xl bg-gold-500/10 flex items-center justify-center shrink-0">
                                                    <Mic2 className="text-gold-500" size={22} />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white text-lg leading-tight">
                                                        {show.musician_name}
                                                        <span className="ml-2 text-xs font-normal bg-charcoal-800 text-charcoal-400 px-2 py-0.5 rounded-full">{show.file_key}</span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-1">
                                                        <span className="text-charcoal-400 text-sm flex items-center gap-1.5">
                                                            <CalendarDays size={13} /> {formatDate(show.show_date)}
                                                        </span>
                                                        <span className="text-charcoal-400 text-sm flex items-center gap-1.5">
                                                            <MapPin size={13} /> {show.venue} — {show.city}/{show.state}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isExpanded && songs.length > 0 && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); exportPDF(show) }}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 rounded-xl text-sm font-medium transition-all"
                                                    >
                                                        <FileDown size={15} />
                                                        Exportar PDF
                                                    </button>
                                                )}
                                                <div className="text-charcoal-400">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Song List */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.25 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="border-t border-charcoal-800 px-5 pb-5 pt-4">
                                                        {songs.length === 0 ? (
                                                            <p className="text-charcoal-500 text-sm text-center py-4">Nenhuma música registrada para este show.</p>
                                                        ) : (
                                                            <>
                                                                {/* Top song highlight */}
                                                                {topSong && (
                                                                    <div className="flex items-center gap-4 bg-gold-500/5 border border-gold-500/20 rounded-xl p-4 mb-4">
                                                                        <Trophy className="text-gold-500 shrink-0" size={20} />
                                                                        <div className="flex-1">
                                                                            <div className="text-xs text-gold-500 font-bold uppercase tracking-widest mb-0.5">Mais Votada</div>
                                                                            <div className="font-bold text-white">{topSong.song_title}</div>
                                                                            <div className="text-charcoal-400 text-sm">{topSong.artist}</div>
                                                                        </div>
                                                                        <div className="text-3xl font-display font-black text-gold-500">{topSong.votes}</div>
                                                                    </div>
                                                                )}

                                                                {/* All songs table */}
                                                                <div className="space-y-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                                                                    {songs.map((song, i) => (
                                                                        <div key={song.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-charcoal-800/40 transition-colors">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className="text-charcoal-600 text-sm font-bold w-5 text-center">{i + 1}</span>
                                                                                <div>
                                                                                    <div className="text-white text-sm font-semibold">{song.song_title}</div>
                                                                                    <div className="text-charcoal-500 text-xs">{song.artist}</div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex items-center gap-3">
                                                                                {song.played && (
                                                                                    <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full font-bold">Tocada</span>
                                                                                )}
                                                                                <span className="bg-gold-500/10 text-gold-500 text-sm font-bold px-3 py-1 rounded-full min-w-[3rem] text-center">
                                                                                    {song.votes}
                                                                                </span>
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
            </main>
        </div>
    )
}

export default AdminEstatisticas
