import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import {
    Music, Star, FileText, ChevronRight, Search,
    Loader2, CheckCircle2, XCircle, Info, Heart,
    Users, CreditCard, List, Copy, X, Globe, CheckCheck
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import PublicLyricsModal from '../../components/public/PublicLyricsModal'

const PublicGallery = () => {
    const [songs, setSongs] = useState([])
    const [allSongs, setAllSongs] = useState([])
    const [sponsors, setSponsors] = useState([])
    const [profile, setProfile] = useState(null)
    const [fetchError, setFetchError] = useState(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [votedSongId, setVotedSongId] = useState(localStorage.getItem('voted_song_id'))
    const [selectedSongForLyrics, setSelectedSongForLyrics] = useState(null)
    const [votingInProgress, setVotingInProgress] = useState(null)
    const [showSponsors, setShowSponsors] = useState(false)
    const [showPix, setShowPix] = useState(false)
    const [showAllSongs, setShowAllSongs] = useState(false)
    const [pixCopied, setPixCopied] = useState(false)

    // Helper to determine if voting is actually active
    const isVotingActive = profile ? profile.voting_active : true

    useEffect(() => {
        fetchData()
        const subscription = subscribeToRealtime()
        return () => supabase.removeChannel(subscription)
    }, [])

    const fetchData = async () => {
        setLoading(true)

        // Fetch profile - pegamos o mais recente para evitar conflito se houver mais de um
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1)
            .single()

        if (profileError) {
            console.error('Erro ao buscar perfil:', profileError)
            setFetchError(profileError.message)
        }

        if (profileData) {
            const localResetAt = localStorage.getItem('last_reset_at')
            const dbResetAt = profileData.last_reset_at

            // Comparamos as strings das datas. Se mudou, é um novo show.
            if (dbResetAt && localResetAt !== dbResetAt) {
                console.log('Reset detectado - Limpando dados locais...')
                localStorage.removeItem('voted_song_id')
                localStorage.removeItem('vote_session_id')
                localStorage.setItem('last_reset_at', dbResetAt)
                setVotedSongId(null)
                window.location.reload()
                return
            }

            localStorage.setItem('last_reset_at', dbResetAt || '')
            setProfile(profileData)
        }

        // Fetch active songs (for voting)
        const { data: songsData } = await supabase
            .from('songs')
            .select('*')
            .eq('is_active', true)
            .eq('played', false)
            .order('title', { ascending: true })

        // Fetch all songs (for the songs modal)
        const { data: allSongsData } = await supabase
            .from('songs')
            .select('*')
            .order('title', { ascending: true })

        // Fetch active sponsors
        const { data: sponsorsData } = await supabase
            .from('sponsors')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true })

        setSongs(songsData || [])
        setAllSongs(allSongsData || [])
        setSponsors(sponsorsData || [])
        setLoading(false)
    }

    const subscribeToRealtime = () => {
        return supabase
            .channel('public-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, (payload) => {
                if (payload.eventType === 'UPDATE') {
                    setSongs(prev => {
                        // Remove if played or inactivated
                        if (payload.new.played || !payload.new.is_active) {
                            return prev.filter(s => s.id !== payload.new.id)
                        }
                        // Update or Add
                        const exists = prev.some(s => s.id === payload.new.id)
                        if (exists) {
                            return prev.map(s => s.id === payload.new.id ? payload.new : s)
                        } else {
                            return [...prev, payload.new].sort((a, b) => a.title.localeCompare(b.title))
                        }
                    })
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                if (payload.new) {
                    const localResetAt = localStorage.getItem('last_reset_at')
                    const dbResetAt = payload.new.last_reset_at

                    if (dbResetAt && dbResetAt !== localResetAt) {
                        // Reset via Realtime! Forçamos a limpeza total
                        localStorage.removeItem('voted_song_id')
                        localStorage.removeItem('vote_session_id')
                        localStorage.setItem('last_reset_at', dbResetAt)
                        setVotedSongId(null)
                        window.location.reload()
                        return
                    }
                    setProfile(payload.new)
                }
            })
            .subscribe()
    }

    const handleVote = async (songId) => {
        if (votedSongId || !isVotingActive) return

        setVotingInProgress(songId)

        let sessionId = localStorage.getItem('vote_session_id')
        if (!sessionId) {
            sessionId = crypto.randomUUID()
            localStorage.setItem('vote_session_id', sessionId)
        }

        const { error: insertError } = await supabase
            .from('votes')
            .insert({ song_id: songId, session_id: sessionId })

        if (insertError) {
            console.error('Vote storage error:', insertError)
            alert('Não foi possível registrar seu voto no momento.')
            setVotingInProgress(null)
            return
        }

        const { error: rpcError } = await supabase.rpc('increment_vote', { song_id: songId })

        if (rpcError) {
            console.error('RPC Error:', rpcError)
        }

        localStorage.setItem('voted_song_id', songId)
        setVotedSongId(songId)
        setVotingInProgress(null)
    }

    const filteredSongs = songs.filter(song =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
                <Loader2 className="animate-spin text-gold-500 w-12 h-12" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-charcoal-950 text-white selection:bg-gold-500/30">
            {/* Header / Profile */}
            <header className="relative py-12 px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gold-500/5 blur-3xl rounded-full -translate-y-1/2 scale-150"></div>
                <div className="max-w-2xl mx-auto relative z-10 text-center">
                    <div className="mb-6 relative inline-block">
                        <div className="w-24 h-24 rounded-full border-2 border-gold-500 p-1 mx-auto">
                            <div className="w-full h-full rounded-full bg-charcoal-900 overflow-hidden flex items-center justify-center">
                                {profile?.profile_image_url ? (
                                    <img src={profile.profile_image_url} alt={profile.musician_name} className="w-full h-full object-cover" />
                                ) : (
                                    <Music className="text-gold-500" />
                                )}
                            </div>
                        </div>
                        {profile?.voting_active ? (
                            <span className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-charcoal-950 animate-pulse"></span>
                        ) : null}
                    </div>

                    <h1 className="text-3xl font-display font-bold gold-gradient mb-2">{profile?.musician_name || 'Setlist ao Vivo'}</h1>
                    <p className="text-charcoal-400 text-sm mb-6 max-w-sm mx-auto leading-relaxed">
                        {profile?.welcome_text || 'Olá! Escolha sua música favorita e eu a tocarei para você!'}
                    </p>

                    <div className={`inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${isVotingActive
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isVotingActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        <span>{isVotingActive ? 'Votação Aberta' : 'Votação Encerrada'}</span>
                    </div>

                    {/* 3 Action Buttons */}
                    <div className="flex items-center justify-center gap-3 mt-6 flex-wrap">
                        {sponsors.length > 0 && (
                            <button
                                onClick={() => setShowSponsors(true)}
                                className="flex items-center space-x-2 bg-charcoal-900 border border-charcoal-700 hover:border-gold-500/40 hover:bg-gold-500/5 text-charcoal-300 hover:text-gold-400 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                            >
                                <Users size={15} />
                                <span>Patrocinadores</span>
                            </button>
                        )}
                        {profile?.pix_key && (
                            <button
                                onClick={() => setShowPix(true)}
                                className="flex items-center space-x-2 bg-charcoal-900 border border-charcoal-700 hover:border-gold-500/40 hover:bg-gold-500/5 text-charcoal-300 hover:text-gold-400 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                            >
                                <CreditCard size={15} />
                                <span>Couvert Artístico</span>
                            </button>
                        )}
                        <button
                            onClick={() => setShowAllSongs(true)}
                            className="flex items-center space-x-2 bg-charcoal-900 border border-charcoal-700 hover:border-gold-500/40 hover:bg-gold-500/5 text-charcoal-300 hover:text-gold-400 px-5 py-2.5 rounded-full text-sm font-medium transition-all"
                        >
                            <List size={15} />
                            <span>Músicas</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* ─── MODAL: Sponsors ─── */}
            <AnimatePresence>
                {showSponsors && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowSponsors(false)}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="glass rounded-3xl border border-charcoal-700 w-full max-w-lg max-h-[80vh] overflow-y-auto"
                        >
                            <div className="p-6 border-b border-charcoal-800 flex items-center justify-between sticky top-0 glass z-10">
                                <div className="flex items-center space-x-3">
                                    <Users className="text-gold-500" size={20} />
                                    <h2 className="text-lg font-display font-bold text-white">Patrocinadores</h2>
                                </div>
                                <button onClick={() => setShowSponsors(false)} className="text-charcoal-500 hover:text-white transition-colors p-1">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {sponsors.map(sponsor => (
                                    <motion.a
                                        key={sponsor.id}
                                        href={sponsor.website_url || '#'}
                                        target={sponsor.website_url ? '_blank' : '_self'}
                                        rel="noopener noreferrer"
                                        whileHover={{ scale: 1.04 }}
                                        whileTap={{ scale: 0.97 }}
                                        className="flex flex-col items-center gap-3 bg-white/5 hover:bg-white/10 rounded-2xl p-4 border border-charcoal-700 hover:border-gold-500/30 transition-all cursor-pointer group"
                                    >
                                        <div className="w-full h-16 flex items-center justify-center">
                                            <img src={sponsor.image_url} alt={sponsor.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <p className="text-xs text-charcoal-400 group-hover:text-charcoal-200 text-center font-medium truncate w-full transition-colors">{sponsor.name}</p>
                                        {sponsor.website_url && <Globe size={10} className="text-charcoal-600 group-hover:text-gold-500 transition-colors" />}
                                    </motion.a>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: Couvert Artístico (PIX) ─── */}
            <AnimatePresence>
                {showPix && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowPix(false)}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="relative glass rounded-3xl border border-gold-500/20 bg-gold-500/[0.02] w-full max-w-sm p-8 text-center"
                        >
                            <button onClick={() => setShowPix(false)} className="absolute top-4 right-4 text-charcoal-500 hover:text-white transition-colors">
                                <X size={20} />
                            </button>

                            <div className="w-16 h-16 bg-gold-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <CreditCard className="text-gold-500" size={28} />
                            </div>

                            <h2 className="text-2xl font-display font-bold text-white mb-2">Couvert Artístico</h2>
                            <p className="text-charcoal-400 text-sm mb-8 leading-relaxed">
                                Gostou do show? Faça uma contribuição para <strong className="text-white">{profile?.pix_name || profile?.musician_name}</strong> via PIX:
                            </p>

                            <div className="bg-charcoal-900 rounded-2xl border border-charcoal-700 p-5 mb-6">
                                <p className="text-xs text-charcoal-500 uppercase tracking-wider mb-2">Chave PIX</p>
                                <p className="text-white font-mono text-lg font-bold break-all">{profile?.pix_key}</p>
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    navigator.clipboard.writeText(profile?.pix_key || '')
                                    setPixCopied(true)
                                    setTimeout(() => setPixCopied(false), 3000)
                                }}
                                className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition-all ${pixCopied
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : 'gold-bg-gradient text-charcoal-950 shadow-lg shadow-gold-500/20'}`}
                            >
                                {pixCopied ? <><CheckCheck size={18} /><span>Chave Copiada! 🎉</span></> : <><Copy size={18} /><span>Clique para Copiar</span></>}
                            </motion.button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── MODAL: All Songs ─── */}
            <AnimatePresence>
                {showAllSongs && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
                        onClick={(e) => e.target === e.currentTarget && setShowAllSongs(false)}
                    >
                        <motion.div
                            initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="glass rounded-3xl border border-charcoal-700 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
                        >
                            <div className="p-6 border-b border-charcoal-800 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <List className="text-gold-500" size={20} />
                                    <div>
                                        <h2 className="text-lg font-display font-bold text-white">Todas as Músicas</h2>
                                        <p className="text-xs text-charcoal-500">{allSongs.length} músicas no repertório</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowAllSongs(false)} className="text-charcoal-500 hover:text-white transition-colors p-1">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="overflow-y-auto flex-1 p-4 space-y-2">
                                {allSongs.map((song, idx) => (
                                    <div key={song.id} className={`flex items-center gap-4 p-3 rounded-xl border ${song.played ? 'border-charcoal-800/50 opacity-50' : 'border-charcoal-800'}`}>
                                        <span className="text-charcoal-600 text-sm font-mono w-6 text-right flex-shrink-0">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-semibold text-sm truncate ${song.played ? 'line-through text-charcoal-500' : 'text-white'}`}>{song.title}</p>
                                            <p className="text-xs text-charcoal-500 truncate">{song.artist}</p>
                                        </div>
                                        {song.played && <span className="text-[10px] text-gold-500/60 font-bold uppercase flex-shrink-0">Tocada</span>}
                                        {!song.is_active && !song.played && <span className="text-[10px] text-charcoal-600 font-bold uppercase flex-shrink-0">Inativa</span>}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>


            {/* Main Content */}
            <main className="max-w-xl mx-auto px-4 pb-24">
                {/* Search */}
                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-500" size={18} />
                    <input
                        type="text"
                        placeholder="Pesquisar música ou artista..."
                        className="w-full bg-charcoal-900/80 backdrop-blur-md border border-charcoal-800 rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-gold-500/50 transition-all placeholder:text-charcoal-600"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List of Songs */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {filteredSongs.map(song => (
                            <motion.div
                                key={song.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`glass p-4 rounded-3xl border transition-all ${votedSongId === song.id
                                    ? 'border-gold-500 bg-gold-500/[0.03]'
                                    : 'border-charcoal-800/50 hover:border-charcoal-700'
                                    }`}
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 rounded-2xl bg-charcoal-800 flex-shrink-0 overflow-hidden relative group">
                                        {song.cover_image_url ? (
                                            <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Music className="text-charcoal-700" size={20} /></div>
                                        )}
                                        <button
                                            onClick={() => setSelectedSongForLyrics(song)}
                                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Info className="text-white" size={20} />
                                        </button>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <h3 className="font-bold text-white truncate group-hover:text-gold-400 transition-colors">{song.title}</h3>
                                            {song.votes > 0 && (
                                                <span className="text-[10px] font-black text-gold-500 bg-gold-500/10 px-2 py-0.5 rounded-full">
                                                    {song.votes} {song.votes === 1 ? 'VOTO' : 'VOTOS'}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-charcoal-400 truncate mt-0.5">{song.artist}</p>

                                        <div className="mt-3 flex items-center space-x-3">
                                            <button
                                                onClick={() => handleVote(song.id)}
                                                disabled={!!votedSongId || !isVotingActive}
                                                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-black transition-all ${votedSongId === song.id
                                                    ? 'bg-gold-500 text-charcoal-950 shadow-lg shadow-gold-500/20'
                                                    : votedSongId
                                                        ? 'bg-charcoal-900 text-charcoal-700 cursor-not-allowed opacity-50'
                                                        : 'bg-charcoal-800 text-charcoal-200 hover:bg-gold-500/10 hover:text-gold-400'
                                                    }`}
                                            >
                                                {votingInProgress === song.id ? (
                                                    <Loader2 className="animate-spin w-4 h-4" />
                                                ) : votedSongId === song.id ? (
                                                    <>
                                                        <Heart size={14} fill="currentColor" />
                                                        <span>ESCOLHIDO!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Star size={14} />
                                                        <span>VOTAR NESSA</span>
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                onClick={() => setSelectedSongForLyrics(song)}
                                                className="p-2.5 rounded-xl bg-charcoal-900 border border-charcoal-800 text-charcoal-400 hover:text-white transition-colors flex-shrink-0"
                                                title="Ver Letra"
                                            >
                                                <Info size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {filteredSongs.length === 0 && !loading && (
                        <div className="text-center py-20 bg-charcoal-900/30 rounded-3xl border-2 border-dashed border-charcoal-900">
                            <Music className="w-12 h-12 text-charcoal-800 mx-auto mb-4" />
                            <p className="text-charcoal-500 text-sm">Nenhuma música disponível no momento.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer / Branding */}
            <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-charcoal-950 to-transparent pointer-events-none">
                <div className="max-w-2xl mx-auto flex flex-col items-center">
                    {votedSongId && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-gold-500 text-charcoal-950 px-6 py-3 rounded-full font-bold shadow-2xl shadow-gold-500/20 mb-4 flex items-center space-x-2 pointer-events-auto"
                        >
                            <CheckCircle2 size={18} />
                            <span>Voto registrado! Obrigado por participar 🎶</span>
                        </motion.div>
                    )}
                    <div className="text-[10px] text-charcoal-600 uppercase tracking-[0.2em] font-black">
                        Powered by SetVote
                    </div>



                </div>
            </footer>

            {/* Lyrics Modal */}
            {selectedSongForLyrics && (
                <PublicLyricsModal
                    song={selectedSongForLyrics}
                    onClose={() => setSelectedSongForLyrics(null)}
                />
            )}
        </div>
    )
}

export default PublicGallery
