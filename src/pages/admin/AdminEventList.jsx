import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import { Music, CalendarDays, MapPin, Loader2, Trophy, ArrowLeft, CheckCircle2, History, Play } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Note: AdminEventList is a special full-screen page (show control panel),
// so it intentionally does NOT use AdminLayout — it has its own header.

const AdminEventList = () => {
    const { darkMode } = useTheme()
    const { token } = useParams()
    const navigate = useNavigate()
    const [event, setEvent] = useState(null)
    const [songs, setSongs] = useState([])
    const [votes, setVotes] = useState({})
    const [loading, setLoading] = useState(true)
    const [playedSongs, setPlayedSongs] = useState([])

    useEffect(() => { checkAuth() }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) navigate('/admin'); else fetchEventData()
    }

    const fetchEventData = async () => {
        setLoading(true)
        try {
            const { data: eventData, error: eventError } = await supabase.from('future_events').select('*').eq('token', token).single()
            if (eventError || !eventData) { alert('Evento não encontrado.'); navigate('/admin/eventos-futuros'); return }
            setEvent(eventData)
            const { data: songsData, error: songsError } = await supabase.from('songs').select('*').eq('is_active', true)
            if (songsError) throw songsError
            setSongs(songsData || [])
            await fetchVotes(eventData.id)
            subscribeToVotes(eventData.id)
        } catch (err) { console.error(err); alert('Erro ao carregar os dados do evento.'); navigate('/admin/eventos-futuros') }
        finally { setLoading(false) }
    }

    const fetchVotes = async (eventId) => {
        const { data } = await supabase.from('future_event_votes').select('song_id, votes').eq('event_id', eventId)
        if (data) {
            const votesMap = {}
            data.forEach(v => { votesMap[v.song_id] = v.votes })
            setVotes(votesMap)
        }
    }

    const subscribeToVotes = (eventId) => {
        supabase.channel(`admin:event_votes:${eventId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'future_event_votes', filter: `event_id=eq.${eventId}` },
                (payload) => { if (payload.new?.song_id) setVotes(prev => ({ ...prev, [payload.new.song_id]: payload.new.votes })) })
            .subscribe()
    }

    const togglePlayed = (songId) => {
        setPlayedSongs(prev => prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId])
    }

    const handleStartShow = async () => {
        if (!window.confirm('Tem certeza que deseja exportar esses votos para o seu Dashboard principal e iniciar um Show agora?\n\nIsso substituirá a setlist ao vivo atual e zerará os votos anteriores da tela inicial.')) return
        try {
            setLoading(true)
            await supabase.from('songs').update({ votes: 0, played: false, play_order: null }).neq('id', '00000000-0000-0000-0000-000000000000')
            const votedSongs = songs.filter(song => votes[song.id] > 0)
            await Promise.all(votedSongs.map(song => supabase.from('songs').update({ votes: votes[song.id] }).eq('id', song.id)))
            const fileKey = `${event.title.replace(/\s+/g, '').substring(0, 10).toUpperCase()}-EVENTO`
            localStorage.setItem('activeShow', JSON.stringify({ show_date: event.event_date.split('T')[0], venue: event.venue || 'Evento', city: '', state: '', musician_name: '', file_key: fileKey }))
            navigate('/admin/dashboard')
        } catch (error) { console.error(error); alert('Erro ao iniciar show: ' + error.message); setLoading(false) }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', ' as')
    }

    const votedSongs = songs.filter(song => votes[song.id] > 0)
    const sortedSongs = [...votedSongs].sort((a, b) => { const va = votes[a.id] || 0, vb = votes[b.id] || 0; return vb !== va ? vb - va : a.title.localeCompare(b.title) })
    const pendingSongs = sortedSongs.filter(s => !playedSongs.includes(s.id))
    const finishedSongs = sortedSongs.filter(s => playedSongs.includes(s.id))

    const t = {
        bg: darkMode ? 'bg-charcoal-950' : 'bg-gray-50',
        header: darkMode ? 'bg-charcoal-950/80 border-charcoal-800' : 'bg-white/80 border-gray-200',
        backBtn: darkMode ? 'bg-charcoal-900 border-charcoal-800 text-charcoal-400 hover:text-gold-500 hover:border-gold-500/30' : 'bg-gray-100 border-gray-200 text-gray-500 hover:text-gold-500',
        eventTitle: darkMode ? 'text-white' : 'text-gray-900',
        eventMeta: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        statCard: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        statLabel: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        statVal: darkMode ? 'text-white' : 'text-gray-900',
        sectionTitle: darkMode ? 'text-white' : 'text-gray-900',
        empty: darkMode ? 'bg-charcoal-900/40 border-charcoal-700' : 'bg-white border-gray-200',
        emptyText: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        pendingCard: darkMode ? 'bg-charcoal-900/40 border-charcoal-800/50 hover:border-gold-500/30' : 'bg-white border-gray-200 shadow-sm hover:border-gold-500/30',
        rank: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        songTitle: darkMode ? 'text-white' : 'text-gray-900',
        songSub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        markBtn: darkMode ? 'bg-charcoal-800 text-charcoal-300 hover:bg-green-500 hover:text-charcoal-950' : 'bg-gray-100 text-gray-500 hover:bg-green-500 hover:text-white',
        historyCard: darkMode ? 'bg-charcoal-900/40' : 'bg-white shadow-sm',
        historyTitle: darkMode ? 'text-white' : 'text-gray-900',
        historyItem: darkMode ? 'bg-charcoal-900/50 border-charcoal-800' : 'bg-gray-50 border-gray-200',
        historyName: darkMode ? 'text-charcoal-200' : 'text-gray-700',
        historyArtist: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        historyVotes: darkMode ? 'bg-charcoal-950 text-charcoal-600' : 'bg-gray-200 text-gray-500',
        historyUndo: darkMode ? 'bg-green-500/20 text-green-500 hover:bg-red-500/20 hover:text-red-500' : 'bg-green-100 text-green-600 hover:bg-red-100 hover:text-red-500',
        mobileFloat: 'gold-bg-gradient text-charcoal-950',
    }

    if (loading || !event) {
        return (
            <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${t.bg}`}>
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                <p className="text-gold-500/80 font-medium animate-pulse">Carregando painel do show...</p>
            </div>
        )
    }

    return (
        <div className={`min-h-screen flex flex-col transition-colors duration-300 ${t.bg}`}>
            {/* Fixed Header */}
            <div className={`sticky top-0 z-50 backdrop-blur-xl border-b ${t.header}`}>
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to="/admin/eventos-futuros"
                            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${t.backBtn}`}>
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className={`font-display font-bold leading-tight ${t.eventTitle}`}>{event.title}</h1>
                            <div className={`text-xs flex items-center gap-2 ${t.eventMeta}`}>
                                <span className="flex items-center gap-1"><CalendarDays size={10} /> {formatDate(event.event_date)}</span>
                                {event.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {event.venue}</span>}
                            </div>
                        </div>
                    </div>
                    <button onClick={handleStartShow}
                        className="hidden md:flex items-center space-x-2 px-6 py-2.5 gold-bg-gradient text-charcoal-950 rounded-xl font-bold shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all">
                        <Play size={18} fill="currentColor" />
                        <span>Iniciar Show no Dashboard</span>
                    </button>
                </div>
            </div>

            {/* Mobile float button */}
            <button onClick={handleStartShow}
                className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full gold-bg-gradient text-charcoal-950 flex items-center justify-center shadow-lg shadow-gold-500/30 active:scale-95 transition-all">
                <Play size={24} fill="currentColor" className="ml-1" />
            </button>

            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Pedidas', value: votedSongs.length },
                        { label: 'Músicas Restantes', value: pendingSongs.length, gold: true },
                        { label: 'Músicas Tocadas', value: finishedSongs.length, green: true },
                        { label: 'Total de Votos', value: Object.values(votes).reduce((a, b) => a + b, 0) },
                    ].map(({ label, value, gold, green }) => (
                        <div key={label} className={`rounded-2xl p-4 border transition-colors ${t.statCard}`}>
                            <div className={`text-xs font-bold uppercase tracking-wider mb-1 ${t.statLabel}`}>{label}</div>
                            <div className={`text-2xl font-display font-bold ${gold ? 'text-gold-500' : green ? 'text-green-500' : t.statVal}`}>{value}</div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Pending queue */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className={`text-xl font-display font-bold flex items-center gap-2 mb-4 ${t.sectionTitle}`}>
                            <Music className="text-gold-500" /> Fila de Pedidos
                        </h2>
                        {pendingSongs.length === 0 ? (
                            <div className={`rounded-3xl border border-dashed p-12 text-center ${t.empty}`}>
                                <Music className={`w-12 h-12 mx-auto mb-4 ${t.emptyText}`} />
                                <h3 className={`text-lg font-display mb-2 ${t.emptyText}`}>Sem pedidos pendentes</h3>
                                <p className={`text-sm ${t.emptyText}`}>O público ainda não votou ou todas as músicas já foram tocadas.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {pendingSongs.map((song, index) => (
                                        <motion.div key={song.id} layout initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                            className={`rounded-2xl p-4 border transition-all flex items-center gap-4 ${t.pendingCard}`}>
                                            <div className={`w-8 flex justify-center font-bold ${t.rank}`}>{index + 1}</div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className={`font-bold truncate ${t.songTitle}`}>{song.title}</h3>
                                                <p className={`text-xs truncate ${t.songSub}`}>{song.artist}</p>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-center w-12">
                                                    <span className="block text-xl font-black text-gold-500 leading-none">{votes[song.id]}</span>
                                                    <span className={`text-[9px] uppercase font-bold ${t.rank}`}>Votos</span>
                                                </div>
                                                <button onClick={() => togglePlayed(song.id)}
                                                    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all group ${t.markBtn}`} title="Marcar como Tocada">
                                                    <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Played sidebar */}
                    <div>
                        <div className={`rounded-3xl p-6 sticky top-24 transition-colors ${t.historyCard}`}>
                            <h2 className={`text-lg font-display font-bold flex items-center gap-2 mb-6 ${t.historyTitle}`}>
                                <History className={t.eventMeta} size={18} /> Tocadas
                            </h2>
                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {finishedSongs.map((song) => (
                                        <motion.div key={song.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                            className={`flex items-center gap-3 p-3 rounded-xl border group ${t.historyItem}`}>
                                            <button onClick={() => togglePlayed(song.id)} className={`w-6 h-6 rounded flex items-center justify-center shrink-0 transition-colors ${t.historyUndo}`} title="Desfazer">
                                                <CheckCircle2 size={14} />
                                            </button>
                                            <div className="flex-1 min-w-0 opacity-60">
                                                <h4 className={`text-sm font-bold truncate ${t.historyName}`}>{song.title}</h4>
                                                <p className={`text-xs truncate ${t.historyArtist}`}>{song.artist}</p>
                                            </div>
                                            <div className={`text-xs font-bold px-2 py-1 rounded-lg ${t.historyVotes}`}>{votes[song.id]} v</div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {finishedSongs.length === 0 && (
                                    <div className={`text-center py-10 opacity-50 text-sm ${t.emptyText}`}>Nenhuma música tocada ainda.</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdminEventList
