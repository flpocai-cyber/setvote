import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Music, CalendarDays, MapPin, Loader2, Trophy, ArrowRight, UserCircle, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PublicEventVoting = () => {
    const { token } = useParams()
    const [event, setEvent] = useState(null)
    const [songs, setSongs] = useState([])
    const [votes, setVotes] = useState({}) // { songId: voteCount }
    const [sponsors, setSponsors] = useState([])
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState(null)
    const [votingInProgress, setVotingInProgress] = useState(false)

    useEffect(() => {
        if (token) {
            fetchEventData()
        }
    }, [token])

    const fetchEventData = async () => {
        setLoading(true)
        setErrorMsg(null)

        try {
            // 1. Fetch Event Profile
            const { data: eventData, error: eventError } = await supabase
                .from('future_events')
                .select('*')
                .eq('token', token)
                .eq('is_active', true)
                .single()

            if (eventError || !eventData) {
                setErrorMsg('Evento não encontrado ou votação encerrada.')
                setLoading(false)
                return
            }

            setEvent(eventData)

            // 2. Fetch all active songs from the musician
            const { data: songsData, error: songsError } = await supabase
                .from('songs')
                .select('*')
                .eq('is_active', true)
                .order('title', { ascending: true })

            if (songsError) throw songsError
            setSongs(songsData || [])

            // 3. Fetch active sponsors
            const { data: sponsorsData } = await supabase
                .from('sponsors')
                .select('*')
                .eq('is_active', true)
                .order('is_master', { ascending: false })
                .order('display_order', { ascending: true })
            setSponsors(sponsorsData || [])

            // 4. Fetch current votes
            await fetchVotes(eventData.id)

            // 5. Subscribe to Realtime Updates for Votes
            subscribeToVotes(eventData.id)

        } catch (err) {
            console.error(err)
            setErrorMsg('Erro ao carregar os dados do evento.')
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
        supabase.channel(`public:event_votes:${eventId}`)
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

    const handleVote = async (songId) => {
        if (!event || votingInProgress) return
        setVotingInProgress(true)

        try {
            // Em vez de verificar e depois atualizar (o que pode falhar no RLS anon para Select),
            // Fazemos um Upsert cego baseado na soma do que já temos em memória.
            const currentVotes = votes[songId] || 0

            const { error } = await supabase
                .from('future_event_votes')
                .upsert(
                    {
                        event_id: event.id,
                        song_id: songId,
                        votes: currentVotes + 1
                    },
                    { onConflict: 'event_id,song_id' }
                )

            if (error) throw error

            // O realtime vai atualizar o valor na tela de todo mundo que está acessando
        } catch (error) {
            console.error('Erro ao votar:', error)
        } finally {
            setTimeout(() => setVotingInProgress(false), 200) // Pequeno cooldown
        }
    }

    const formatDate = (dateString) => {
        const options = { weekday: 'long', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }
        return new Date(dateString).toLocaleDateString('pt-BR', options).replace(',', ' as')
    }

    // Ordenação: primeiro por número de votos, depois alfabeticamente
    const sortedSongs = [...songs].sort((a, b) => {
        const votesA = votes[a.id] || 0
        const votesB = votes[b.id] || 0
        if (votesB !== votesA) return votesB - votesA
        return a.title.localeCompare(b.title)
    })

    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-4">
                <Loader2 className="w-12 h-12 text-gold-500 animate-spin mb-4" />
                <p className="text-gold-500/80 font-medium animate-pulse">Carregando repertório...</p>
            </div>
        )
    }

    if (errorMsg) {
        return (
            <div className="min-h-screen bg-charcoal-950 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-charcoal-900 border border-charcoal-800 flex items-center justify-center mb-6">
                    <Music className="text-charcoal-600 w-10 h-10" />
                </div>
                <h1 className="text-2xl font-display font-bold text-white mb-2">{errorMsg}</h1>
                <p className="text-charcoal-400 mb-8 max-w-sm">Verifique com o músico se o link está correto ou se a votação já foi encerrada.</p>
                <Link to="/" className="px-6 py-3 bg-charcoal-900 text-charcoal-300 rounded-xl hover:text-white transition-colors">
                    Voltar para o Início
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-charcoal-950">
            {/* Header Fixo */}
            <div className="sticky top-0 z-50 bg-charcoal-950/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl gold-bg-gradient p-[1px]">
                            <div className="w-full h-full bg-charcoal-950 rounded-[11px] flex items-center justify-center">
                                <Music className="text-gold-500 w-5 h-5" />
                            </div>
                        </div>
                        <span className="font-display font-bold text-white tracking-widest uppercase text-sm">SETVOTE</span>
                    </div>
                    <Link to="/" className="px-4 py-2 bg-charcoal-900 rounded-lg text-xs font-bold text-charcoal-400 hover:text-white transition-colors">
                        Sair
                    </Link>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <main className="max-w-2xl mx-auto px-4 py-8 pb-32">

                {/* Info do Evento */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="mb-10 text-center"
                >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 text-gold-500 text-xs font-bold uppercase tracking-wider mb-4 border border-gold-500/20">
                        <CalendarDays size={12} />
                        Votação Antecipada
                    </span>
                    <h1 className="text-3xl sm:text-4xl font-display font-black text-white mb-4 leading-tight">
                        {event.title}
                    </h1>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-charcoal-400 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarDays className="text-charcoal-500" size={16} />
                            <span className="capitalize">{formatDate(event.event_date)}</span>
                        </div>
                        {event.venue && (
                            <div className="flex items-center gap-2">
                                <MapPin className="text-charcoal-500" size={16} />
                                <span>{event.venue}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Instruções */}
                <div className="glass rounded-2xl p-5 border border-charcoal-800 mb-8 flex gap-4 text-left">
                    <UserCircle className="text-gold-500 shrink-0 mt-0.5" size={24} />
                    <div>
                        <h3 className="text-white font-bold mb-1">Monte a Playlist do Show!</h3>
                        <p className="text-charcoal-400 text-sm leading-relaxed">
                            Abaixo está todo o nosso repertório. Clique no botão de votar quantas vezes quiser nas músicas que você e seus convidados não abrem mão de ouvir na festa!
                        </p>
                    </div>
                </div>

                {/* Lista de Músicas */}
                <div className="space-y-3">
                    <AnimatePresence>
                        {sortedSongs.map((song, index) => {
                            const songVotes = votes[song.id] || 0
                            const isTop3 = index < 3 && songVotes > 0

                            return (
                                <motion.div
                                    key={song.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className={`relative overflow-hidden rounded-2xl border transition-all ${isTop3
                                        ? 'bg-gradient-to-r from-gold-500/10 to-transparent border-gold-500/30'
                                        : 'bg-charcoal-900/50 border-charcoal-800/50 hover:border-charcoal-700'
                                        }`}
                                >
                                    <div className="p-4 sm:p-5 flex items-center gap-4">

                                        {/* Posição / Troféu */}
                                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                                            {isTop3 ? (
                                                <div className="w-full h-full rounded-full bg-gold-500/20 flex items-center justify-center relative">
                                                    <Trophy className="text-gold-500" size={18} />
                                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-charcoal-950 text-[10px] font-black rounded-full flex items-center justify-center border-2 border-charcoal-950">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-charcoal-600 font-bold text-lg">{index + 1}</span>
                                            )}
                                        </div>

                                        {/* Info Música */}
                                        <div className="flex-1 min-w-0 pr-2">
                                            <h3 className={`font-bold truncate text-base sm:text-lg ${isTop3 ? 'text-white' : 'text-charcoal-100'}`}>
                                                {song.title}
                                            </h3>
                                            <p className="text-charcoal-500 text-xs sm:text-sm truncate">
                                                {song.artist}
                                            </p>
                                        </div>

                                        {/* Contagem de Votos Atual e Botão de Votar */}
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right hidden sm:block">
                                                <span className="block text-2xl font-black text-gold-500 leading-none">{songVotes}</span>
                                                <span className="text-[10px] uppercase font-bold text-charcoal-500 tracking-wider">Votos</span>
                                            </div>
                                            <button
                                                onClick={() => handleVote(song.id)}
                                                disabled={votingInProgress}
                                                className="h-12 px-4 sm:px-6 rounded-xl gold-bg-gradient text-charcoal-950 font-black shadow-lg shadow-gold-500/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                            >
                                                <span className="sm:hidden text-lg mr-1">{songVotes}</span>
                                                <ArrowRight className="hidden sm:block" size={18} strokeWidth={3} />
                                                Votar
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )
                        })}
                    </AnimatePresence>
                </div>

                {/* Patrocinadores */}
                {sponsors.length > 0 && (
                    <div className="mt-12 pb-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-1 h-px bg-white/10" />
                            <span className="text-xs font-black uppercase tracking-widest text-charcoal-500">Patrocinadores</span>
                            <div className="flex-1 h-px bg-white/10" />
                        </div>

                        {/* Master Sponsors */}
                        {sponsors.filter(s => s.is_master).length > 0 && (
                            <div className="mb-4 space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gold-500 mb-2">⭐ Apoio Master</p>
                                {sponsors.filter(s => s.is_master).map(sponsor => (
                                    <motion.a
                                        key={sponsor.id}
                                        href={sponsor.website_url || '#'}
                                        target={sponsor.website_url ? '_blank' : '_self'}
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex flex-col items-center gap-2 bg-gold-500/5 hover:bg-gold-500/10 rounded-2xl p-5 border border-gold-500/20 hover:border-gold-500/40 transition-all w-full group"
                                    >
                                        <div className="h-20 flex items-center justify-center">
                                            <img src={sponsor.image_url} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <p className="text-sm text-charcoal-300 group-hover:text-white font-semibold text-center transition-colors">{sponsor.name}</p>
                                        {sponsor.website_url && <Globe size={12} className="text-gold-500/40 group-hover:text-gold-500 transition-colors" />}
                                    </motion.a>
                                ))}
                            </div>
                        )}

                        {/* Normal Sponsors */}
                        {sponsors.filter(s => !s.is_master).length > 0 && (
                            <div>
                                {sponsors.filter(s => s.is_master).length > 0 && (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-charcoal-600 mb-2 mt-4">Apoio</p>
                                )}
                                <div className="grid grid-cols-2 gap-3">
                                    {sponsors.filter(s => !s.is_master).map(sponsor => (
                                        <motion.a
                                            key={sponsor.id}
                                            href={sponsor.website_url || '#'}
                                            target={sponsor.website_url ? '_blank' : '_self'}
                                            rel="noopener noreferrer"
                                            whileHover={{ scale: 1.04 }}
                                            whileTap={{ scale: 0.97 }}
                                            className="flex flex-col items-center gap-2 bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-charcoal-800 hover:border-gold-500/30 transition-all group"
                                        >
                                            <div className="h-14 flex items-center justify-center w-full">
                                                <img src={sponsor.image_url} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                                            </div>
                                            <p className="text-xs text-charcoal-500 group-hover:text-charcoal-300 font-medium text-center truncate w-full transition-colors">{sponsor.name}</p>
                                        </motion.a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}

export default PublicEventVoting
