import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Music, CalendarDays, MapPin, Loader2, Trophy, ArrowLeft, CheckCircle2, History } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AdminEventList = () => {
    const { token } = useParams()
    const navigate = useNavigate()
    const [event, setEvent] = useState(null)
    const [songs, setSongs] = useState([])
    const [votes, setVotes] = useState({}) // { songId: voteCount }
    const [loading, setLoading] = useState(true)
    const [playedSongs, setPlayedSongs] = useState([]) // Array de songId que já foram marcadas como tocadas nesta sessão

    useEffect(() => {
        checkAuth()
    }, [])

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            navigate('/admin') // Redireciona se não estiver logado
        } else {
            fetchEventData()
        }
    }

    const fetchEventData = async () => {
        setLoading(true)

        try {
            // 1. Fetch Event Profile
            const { data: eventData, error: eventError } = await supabase
                .from('future_events')
                .select('*')
                .eq('token', token)
                .single()

            if (eventError || !eventData) {
                alert('Evento não encontrado.')
                navigate('/admin/eventos-futuros')
                return
            }

            setEvent(eventData)

            // 2. Fetch all active songs from the musician
            const { data: songsData, error: songsError } = await supabase
                .from('songs')
                .select('*')
                .eq('is_active', true)

            if (songsError) throw songsError
            setSongs(songsData || [])

            // 3. Fetch current votes
            await fetchVotes(eventData.id)

            // 4. Subscribe to Realtime Updates for Votes
            subscribeToVotes(eventData.id)

        } catch (err) {
            console.error(err)
            alert('Erro ao carregar os dados do evento.')
            navigate('/admin/eventos-futuros')
        } finally {
            setLoading(false)
        }
    }

    const fetchVotes = async (eventId) => {
        const { data } = await supabase
            .from('future_event_votes')
            .select('song_id, votes')
            .eq('event_id', eventId)

        if (data) {
            const votesMap = {}
            data.forEach(v => {
                votesMap[v.song_id] = v.votes
            })
            setVotes(votesMap)
        }
    }

    const subscribeToVotes = (eventId) => {
        supabase.channel(`admin:event_votes:${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'future_event_votes',
                    filter: `event_id=eq.${eventId}`
                },
                (payload) => {
                    if (payload.new && payload.new.song_id) {
                        setVotes(prev => ({
                            ...prev,
                            [payload.new.song_id]: payload.new.votes
                        }))
                    }
                }
            )
            .subscribe()
    }

    const togglePlayed = (songId) => {
        setPlayedSongs(prev =>
            prev.includes(songId) ? prev.filter(id => id !== songId) : [...prev, songId]
        )
    }

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        return new Date(dateString).toLocaleDateString('pt-BR', options).replace(',', ' as')
    }

    // Ordenação: primeiro por número de votos, depois alfabeticamente
    // Filtrando apenas as músicas que tem pelo menos 1 voto!
    const votedSongs = songs.filter(song => votes[song.id] > 0)

    const sortedSongs = [...votedSongs].sort((a, b) => {
        const votesA = votes[a.id] || 0
        const votesB = votes[b.id] || 0
        if (votesB !== votesA) return votesB - votesA
        return a.title.localeCompare(b.title)
    })

    const pendingSongs = sortedSongs.filter(s => !playedSongs.includes(s.id))
    const finishedSongs = sortedSongs.filter(s => playedSongs.includes(s.id))

    if (loading || !event) {
        return (
            <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                <p className="text-gold-500/80 font-medium animate-pulse">Carregando painel do show...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-charcoal-950 flex flex-col">
            {/* Header Fixo */}
            <div className="sticky top-0 z-50 bg-charcoal-950/80 backdrop-blur-xl border-b border-charcoal-800">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link to="/admin/eventos-futuros" className="w-10 h-10 rounded-xl bg-charcoal-900 border border-charcoal-800 flex items-center justify-center text-charcoal-400 hover:text-gold-500 hover:border-gold-500/30 transition-all">
                            <ArrowLeft size={20} />
                        </Link>
                        <div>
                            <h1 className="font-display font-bold text-white leading-tight">{event.title}</h1>
                            <div className="text-xs text-charcoal-500 flex items-center gap-2">
                                <span className="flex items-center gap-1"><CalendarDays size={10} /> {formatDate(event.event_date)}</span>
                                {event.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {event.venue}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 overflow-y-auto">

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass rounded-2xl p-4 border border-charcoal-800">
                        <div className="text-charcoal-500 text-xs font-bold uppercase tracking-wider mb-1">Total Pedidas</div>
                        <div className="text-2xl font-display font-bold text-white">{votedSongs.length}</div>
                    </div>
                    <div className="glass rounded-2xl p-4 border border-charcoal-800">
                        <div className="text-charcoal-500 text-xs font-bold uppercase tracking-wider mb-1">Músicas Restantes</div>
                        <div className="text-2xl font-display font-bold text-gold-500">{pendingSongs.length}</div>
                    </div>
                    <div className="glass rounded-2xl p-4 border border-charcoal-800">
                        <div className="text-charcoal-500 text-xs font-bold uppercase tracking-wider mb-1">Músicas Tocadas</div>
                        <div className="text-2xl font-display font-bold text-green-500">{finishedSongs.length}</div>
                    </div>
                    <div className="glass rounded-2xl p-4 border border-charcoal-800">
                        <div className="text-charcoal-500 text-xs font-bold uppercase tracking-wider mb-1">Total de Votos</div>
                        <div className="text-2xl font-display font-bold text-white">
                            {Object.values(votes).reduce((a, b) => a + b, 0)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Lista Principal (Pedidas) */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2 mb-4">
                            <Music className="text-gold-500" /> Fila de Pedidos
                        </h2>

                        {pendingSongs.length === 0 ? (
                            <div className="glass rounded-3xl border border-dashed border-charcoal-700 p-12 text-center">
                                <Music className="text-charcoal-700 w-12 h-12 mx-auto mb-4" />
                                <h3 className="text-lg font-display text-white mb-2">Sem pedidos pendentes</h3>
                                <p className="text-charcoal-500 text-sm">O público ainda não votou ou todas as músicas já foram tocadas.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence mode="popLayout">
                                    {pendingSongs.map((song, index) => (
                                        <motion.div
                                            key={song.id}
                                            layout
                                            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                            className="glass rounded-2xl p-4 border border-charcoal-800/50 hover:border-gold-500/30 transition-all flex items-center gap-4"
                                        >
                                            <div className="w-8 flex justify-center text-charcoal-500 font-bold">{index + 1}</div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white truncate">{song.title}</h3>
                                                <p className="text-xs text-charcoal-400 truncate">{song.artist}</p>
                                            </div>

                                            <div className="flex items-center gap-4 shrink-0">
                                                <div className="text-center w-12">
                                                    <span className="block text-xl font-black text-gold-500 leading-none">{votes[song.id]}</span>
                                                    <span className="text-[9px] uppercase font-bold text-charcoal-500">Votos</span>
                                                </div>

                                                <button
                                                    onClick={() => togglePlayed(song.id)}
                                                    className="w-12 h-12 rounded-xl bg-charcoal-800 text-charcoal-300 hover:bg-green-500 hover:text-charcoal-950 flex items-center justify-center transition-all group"
                                                    title="Marcar como Tocada"
                                                >
                                                    <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>

                    {/* Fila Lateral (Tocadas) */}
                    <div>
                        <div className="glass rounded-3xl p-6 border-charcoal-800/50 sticky top-24">
                            <h2 className="text-lg font-display font-bold text-white flex items-center gap-2 mb-6">
                                <History className="text-charcoal-400" size={18} /> Tocadas
                            </h2>

                            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                                <AnimatePresence>
                                    {finishedSongs.map((song, index) => (
                                        <motion.div
                                            key={song.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                            className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-900/50 border border-charcoal-800 group"
                                        >
                                            <button
                                                onClick={() => togglePlayed(song.id)}
                                                className="w-6 h-6 rounded bg-green-500/20 text-green-500 flex items-center justify-center shrink-0 hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                                title="Desfazer"
                                            >
                                                <CheckCircle2 size={14} />
                                            </button>
                                            <div className="flex-1 min-w-0 opacity-60">
                                                <h4 className="text-charcoal-200 text-sm font-bold truncate">{song.title}</h4>
                                                <p className="text-charcoal-500 text-xs truncate">{song.artist}</p>
                                            </div>
                                            <div className="text-charcoal-600 text-xs font-bold px-2 py-1 bg-charcoal-950 rounded-lg">{votes[song.id]} v</div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>

                                {finishedSongs.length === 0 && (
                                    <div className="text-center py-10 opacity-50">
                                        <p className="text-charcoal-500 text-sm">Nenhuma música tocada ainda.</p>
                                    </div>
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
