import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    Trophy, CheckCircle2, ListMusic, Music, LayoutDashboard,
    Settings, LogOut, RefreshCcw, Eye, Play, History,
    ExternalLink, FileText, Users, UserCircle, CalendarPlus,
    BarChart2, CheckCheck, MapPin, CalendarDays, Mic2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import ShowRegistrationModal from '../../components/admin/ShowRegistrationModal'

const AdminDashboard = () => {
    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [session, setSession] = useState(null)
    const [profile, setProfile] = useState(null)
    const [fetchError, setFetchError] = useState(null)
    const [profileCount, setProfileCount] = useState(0)

    // Active show state (persisted to localStorage)
    const [showModalOpen, setShowModalOpen] = useState(false)
    const [activeShow, setActiveShow] = useState(() => {
        try { return JSON.parse(localStorage.getItem('activeShow')) || null } catch { return null }
    })

    useEffect(() => {
        fetchSongs()
        const subscription = subscribeToVotes()
        return () => { supabase.removeChannel(subscription) }
    }, [])

    const fetchSongs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .order('votes', { ascending: false })
            .order('title', { ascending: true })

        const { count, error: profileCountError } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        if (!profileCountError) setProfileCount(count || 0)

        if (error) {
            console.error(error)
            setFetchError(error.message)
        } else {
            setSongs(data)
        }
        setLoading(false)
    }

    const subscribeToVotes = () => {
        return supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'songs' },
                (payload) => {
                    setSongs(prev => {
                        const index = prev.findIndex(s => s.id === payload.new.id)
                        if (index === -1) return prev
                        const newSongs = [...prev]
                        newSongs[index] = payload.new
                        return newSongs.sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))
                    })
                }
            )
            .subscribe()
    }

    const markAsPlayed = async (song) => {
        const play_order = songs.filter(s => s.played).length + 1
        const { error } = await supabase
            .from('songs')
            .update({ played: true, play_order })
            .eq('id', song.id)

        if (error) {
            alert('Erro ao marcar como tocada')
        } else {
            if (song.sheet_music_url) window.open(song.sheet_music_url, '_blank')
        }
    }

    // ─── Cadastrar Show ────────────────────────────────────────────────
    const handleRegisterShow = async (form) => {
        // Build file_key: "VENUE-DD-MM-YY"
        const venuePart = form.venue.replace(/\s+/g, '').substring(0, 10).toUpperCase()
        const [y, m, d] = form.show_date.split('-')
        const fileKey = `${venuePart}-${d}-${m}-${y.slice(2)}`

        const show = { ...form, file_key: fileKey }
        setActiveShow(show)
        localStorage.setItem('activeShow', JSON.stringify(show))
    }

    // ─── Finalizar Show ────────────────────────────────────────────────
    const finalizeShow = async () => {
        if (!activeShow) {
            if (!window.confirm('Nenhum show cadastrado. Deseja apenas resetar os votos?')) return
            await doReset()
            return
        }

        if (!window.confirm(`Finalizar o show "${activeShow.file_key}" e salvar os dados?\n\nIsso irá zerar a votação após salvar.`)) return

        try {
            // 1. Save show to Supabase
            const { data: showRow, error: showErr } = await supabase
                .from('shows')
                .insert({
                    file_key: activeShow.file_key,
                    show_date: activeShow.show_date,
                    venue: activeShow.venue,
                    city: activeShow.city,
                    state: activeShow.state,
                    musician_name: activeShow.musician_name
                })
                .select()
                .single()

            if (showErr) throw showErr

            // 2. Save all songs snapshot
            const allSongs = songs.filter(s => s.votes > 0 || s.played)
            if (allSongs.length > 0) {
                const songRows = allSongs.map(s => ({
                    show_id: showRow.id,
                    song_title: s.title,
                    artist: s.artist,
                    votes: s.votes,
                    played: s.played,
                    play_order: s.play_order
                }))
                const { error: sErr } = await supabase.from('show_songs').insert(songRows)
                if (sErr) throw sErr
            }

            // 3. Reset votes
            await doReset()

            // 4. Clear active show
            setActiveShow(null)
            localStorage.removeItem('activeShow')

            alert(`✅ Show "${activeShow.file_key}" finalizado e salvo com sucesso!`)
        } catch (err) {
            console.error(err)
            alert('Erro ao finalizar show: ' + err.message)
        }
    }

    const doReset = async () => {
        const { error: songError } = await supabase
            .from('songs')
            .update({ votes: 0, played: false, play_order: null })
            .neq('id', '00000000-0000-0000-0000-000000000000')

        await supabase.from('votes').delete().neq('id', '00000000-0000-0000-0000-000000000000')

        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
            const now = new Date().toISOString()
            await supabase.from('profiles').upsert({
                id: authUser.id,
                last_reset_at: now,
                updated_at: now
            })
        }

        if (songError) throw songError
        fetchSongs()
    }

    const rankedSongs = songs.filter(s => !s.played && s.is_active)
    const playedSongs = songs.filter(s => s.played).sort((a, b) => (a.play_order || 0) - (b.play_order || 0))
    const topSong = rankedSongs[0]

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        const [y, m, d] = dateStr.split('-')
        return `${d}/${m}/${y}`
    }

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
                    <Link to="/admin/dashboard" className="flex items-center space-x-3 text-gold-500 bg-gold-500/10 px-4 py-3 rounded-xl transition-all">
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
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-white mb-2">Votação em Tempo Real</h1>
                            <div className="flex items-center space-x-4">
                                <span className="flex items-center text-green-500 text-sm font-medium">
                                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
                                    Monitorando votos ao vivo
                                </span>
                                <Link to="/" target="_blank" className="text-gold-500 hover:text-gold-400 text-sm flex items-center">
                                    <ExternalLink size={14} className="mr-1" /> Ver página pública
                                </Link>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {/* Cadastrar Show */}
                            <button
                                onClick={() => setShowModalOpen(true)}
                                className="gold-bg-gradient text-charcoal-950 font-bold px-5 py-3 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                <CalendarPlus size={18} />
                                <span>{activeShow ? 'Show Ativo' : 'Cadastrar Show'}</span>
                            </button>

                            {/* Finalizar Show */}
                            <button
                                onClick={finalizeShow}
                                className="px-5 py-3 border border-charcoal-700 text-charcoal-400 hover:text-white hover:bg-charcoal-900 rounded-xl flex items-center justify-center space-x-2 transition-all"
                            >
                                <CheckCheck size={18} />
                                <span>Finalizar Show</span>
                            </button>
                        </div>
                    </div>

                    {/* Active Show Banner */}
                    {activeShow && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-2xl border border-gold-500/30 bg-gold-500/5 p-4 mb-8 flex items-center gap-4 flex-wrap"
                        >
                            <div className="w-10 h-10 rounded-xl bg-gold-500/20 flex items-center justify-center shrink-0">
                                <Mic2 className="text-gold-500" size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="text-xs text-gold-500 font-bold uppercase tracking-widest mb-0.5">Show em Andamento</div>
                                <div className="text-white font-bold">{activeShow.musician_name}</div>
                            </div>
                            <div className="flex items-center gap-4 text-charcoal-400 text-sm">
                                <span className="flex items-center gap-1.5">
                                    <CalendarDays size={13} /> {formatDate(activeShow.show_date)}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={13} /> {activeShow.venue} — {activeShow.city}/{activeShow.state}
                                </span>
                                <span className="bg-charcoal-800 text-charcoal-400 text-xs px-2 py-1 rounded-full font-mono">{activeShow.file_key}</span>
                            </div>
                        </motion.div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Left Column: Ranking */}
                        <div className="lg:col-span-8 space-y-8">
                            {/* Top Voted Card */}
                            {topSong && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="relative overflow-hidden group"
                                >
                                    <div className="absolute inset-0 gold-bg-gradient opacity-10"></div>
                                    <div className="relative glass border-gold-500/50 rounded-3xl p-8 flex items-center justify-between border-2">
                                        <div className="flex items-center space-x-6">
                                            <div className="w-24 h-24 rounded-2xl bg-gold-500/20 flex items-center justify-center relative">
                                                <Trophy className="text-gold-500 w-12 h-12" />
                                                <div className="absolute -top-3 -right-3 bg-gold-500 text-charcoal-950 text-xs font-black px-3 py-1 rounded-full shadow-lg">
                                                    🏆 MAIS VOTADA
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-charcoal-400 text-sm font-bold uppercase tracking-widest mb-1">Próxima Recomendada</h3>
                                                <div className="text-3xl font-display font-bold text-white mb-1">{topSong.title}</div>
                                                <div className="text-gold-500 font-medium">{topSong.artist}</div>
                                            </div>
                                        </div>
                                        <div className="text-right flex flex-col items-end">
                                            <div className="text-5xl font-display font-black text-gold-500 mb-4">{topSong.votes} <span className="text-sm font-sans font-medium text-charcoal-400 uppercase tracking-wider">Votos</span></div>
                                            <div className="flex flex-col gap-3">
                                                <button
                                                    onClick={() => markAsPlayed(topSong)}
                                                    className="gold-bg-gradient text-charcoal-950 font-bold px-8 py-4 rounded-2xl flex items-center justify-center space-x-3 shadow-xl shadow-gold-500/30 hover:scale-105 active:scale-95 transition-all w-full"
                                                >
                                                    <Play size={20} fill="currentColor" />
                                                    <span>Tocar Agora</span>
                                                </button>

                                                {topSong.sheet_music_url && (
                                                    <a
                                                        href={topSong.sheet_music_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="px-8 py-3 bg-charcoal-800 text-gold-500 border border-gold-500/30 rounded-2xl flex items-center justify-center space-x-3 hover:bg-gold-500/10 transition-all font-bold text-sm"
                                                    >
                                                        <FileText size={18} />
                                                        <span>Ver Partitura</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Remaining Ranking */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h2 className="text-xl font-display font-bold text-white flex items-center space-x-2">
                                        <ListMusic className="text-gold-500" />
                                        <span>Ranking do Público</span>
                                    </h2>
                                    <span className="text-charcoal-400 text-sm">{rankedSongs.length} músicas aguardando</span>
                                </div>

                                <div className="space-y-3">
                                    <AnimatePresence mode="popLayout">
                                        {rankedSongs.slice(1).map((song, index) => (
                                            <motion.div
                                                key={song.id}
                                                layout
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                className="glass rounded-2xl p-4 flex items-center justify-between group border-transparent hover:border-gold-500/30 transition-all"
                                            >
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-charcoal-500 font-display font-bold w-6">{index + 2}</div>
                                                    <div className="w-12 h-12 rounded-lg bg-charcoal-800 overflow-hidden border border-charcoal-700">
                                                        {song.cover_image_url ? (
                                                            <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center"><Music className="text-charcoal-600 w-5 h-5" /></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white group-hover:text-gold-400 transition-colors">{song.title}</div>
                                                        <div className="text-xs text-charcoal-400">{song.artist}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-6">
                                                    <div className="text-center">
                                                        <div className="text-xl font-display font-bold text-gold-500">{song.votes}</div>
                                                        <div className="text-[10px] text-charcoal-500 uppercase tracking-tighter">Votos</div>
                                                    </div>
                                                    {song.sheet_music_url && (
                                                        <a
                                                            href={song.sheet_music_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="bg-charcoal-800 text-charcoal-400 hover:text-gold-500 p-3 rounded-xl transition-all"
                                                            title="Ver Partitura"
                                                        >
                                                            <FileText size={18} />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => markAsPlayed(song)}
                                                        className="bg-charcoal-800 text-charcoal-300 hover:bg-gold-500 hover:text-charcoal-950 p-3 rounded-xl transition-all"
                                                        title="Marcar como tocada"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {rankedSongs.length === 0 && !loading && (
                                        <div className="text-center py-20 glass rounded-3xl border-dashed">
                                            <Music className="w-12 h-12 text-charcoal-700 mx-auto mb-4" />
                                            <p className="text-charcoal-500">Nenhuma música na fila de votação.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Played Setlist */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="glass rounded-3xl p-6 border-charcoal-800/50 sticky top-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-display font-bold text-white flex items-center space-x-2">
                                        <History className="text-charcoal-400" size={20} />
                                        <span>Setlist Tocada</span>
                                    </h2>
                                    <span className="bg-charcoal-800 text-charcoal-400 px-3 py-1 rounded-full text-xs font-bold">
                                        {playedSongs.length}
                                    </span>
                                </div>

                                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {playedSongs.map((song, index) => (
                                        <div key={song.id} className="flex items-start space-x-4 group">
                                            <div className="relative">
                                                <div className="w-8 h-8 rounded-full bg-charcoal-800 flex items-center justify-center text-xs font-bold text-charcoal-500 group-hover:bg-gold-500 group-hover:text-charcoal-950 transition-colors">
                                                    {index + 1}
                                                </div>
                                                {index < playedSongs.length - 1 && (
                                                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-charcoal-800"></div>
                                                )}
                                            </div>
                                            <div className="flex-1 pb-6">
                                                <div className="font-bold text-charcoal-200 text-sm leading-tight">{song.title}</div>
                                                <div className="text-xs text-charcoal-500">{song.artist}</div>
                                            </div>
                                        </div>
                                    ))}

                                    {playedSongs.length === 0 && (
                                        <div className="text-center py-10">
                                            <p className="text-charcoal-600 text-sm italic">O show ainda não começou!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="space-y-3 mt-4">
                                <Link
                                    to="/admin/estatisticas"
                                    className="flex items-center justify-between glass rounded-2xl p-4 border border-charcoal-800 hover:border-gold-500/40 hover:bg-gold-500/5 transition-all group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center">
                                            <BarChart2 className="text-gold-500" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white group-hover:text-gold-400 transition-colors">Estatísticas</p>
                                            <p className="text-xs text-charcoal-500">Histórico de shows</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="text-charcoal-600 group-hover:text-gold-500 transition-colors" size={16} />
                                </Link>

                                <Link
                                    to="/admin/sobre"
                                    className="flex items-center justify-between glass rounded-2xl p-4 border border-charcoal-800 hover:border-gold-500/40 hover:bg-gold-500/5 transition-all group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center">
                                            <UserCircle className="text-gold-500" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white group-hover:text-gold-400 transition-colors">Sobre o Músico</p>
                                            <p className="text-xs text-charcoal-500">Bio e galeria de fotos</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="text-charcoal-600 group-hover:text-gold-500 transition-colors" size={16} />
                                </Link>

                                <Link
                                    to="/admin/patrocinadores"
                                    className="flex items-center justify-between glass rounded-2xl p-4 border border-charcoal-800 hover:border-gold-500/40 hover:bg-gold-500/5 transition-all group"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className="w-9 h-9 rounded-xl bg-gold-500/10 flex items-center justify-center">
                                            <Users className="text-gold-500" size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-white group-hover:text-gold-400 transition-colors">Patrocinadores</p>
                                            <p className="text-xs text-charcoal-500">Gerenciar logos e links</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="text-charcoal-600 group-hover:text-gold-500 transition-colors" size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Show Registration Modal */}
            <ShowRegistrationModal
                isOpen={showModalOpen}
                onClose={() => setShowModalOpen(false)}
                onSave={handleRegisterShow}
            />
        </div>
    )
}

export default AdminDashboard
