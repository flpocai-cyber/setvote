import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    Music, FileText, CheckCircle2, Clock, Trophy,
    ListMusic, History, AlertCircle, Wifi
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'musician_share_token'

const MusicianSetlist = () => {
    const { token } = useParams()
    const navigate = useNavigate()

    const [songs, setSongs] = useState([])
    const [loading, setLoading] = useState(true)
    const [valid, setValid] = useState(false)
    const [connected, setConnected] = useState(true)

    useEffect(() => {
        // Validate token against localStorage
        const savedToken = localStorage.getItem(STORAGE_KEY)
        if (!token || token !== savedToken) {
            setValid(false)
            setLoading(false)
            return
        }
        setValid(true)
        fetchSongs()

        const subscription = subscribeToChanges()
        return () => { supabase.removeChannel(subscription) }
    }, [token])

    const fetchSongs = async () => {
        const { data, error } = await supabase
            .from('songs')
            .select('*')
            .neq('id', '00000000-0000-0000-0000-000000000000')
            .order('votes', { ascending: false })
            .order('title', { ascending: true })

        if (!error && data) {
            setSongs(data)
        }
        setLoading(false)
    }

    const subscribeToChanges = () => {
        return supabase
            .channel('musician-setlist-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'songs' },
                () => { fetchSongs() }
            )
            .on('system', {}, (status) => {
                setConnected(status === 'SUBSCRIBED')
            })
            .subscribe((status) => {
                setConnected(status === 'SUBSCRIBED')
            })
    }

    const playedSongs = songs
        .filter(s => s.played)
        .sort((a, b) => (a.play_order || 0) - (b.play_order || 0))

    const pendingSongs = songs
        .filter(s => !s.played && s.is_active)
        .sort((a, b) => b.votes - a.votes || a.title.localeCompare(b.title))

    const topSong = pendingSongs[0]

    // ── Invalid token screen ───────────────────────────────────────────
    if (!loading && !valid) {
        return (
            <div className="min-h-screen bg-charcoal-950 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="text-red-400 w-10 h-10" />
                    </div>
                    <h1 className="text-3xl font-display font-bold text-white mb-3">Link Inválido</h1>
                    <p className="text-charcoal-400 leading-relaxed">
                        Este link de setlist não é válido ou foi revogado pelo músico.
                        Peça um novo link para continuar.
                    </p>
                </div>
            </div>
        )
    }

    // ── Loading screen ─────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-charcoal-950 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gold-500/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <Music className="text-gold-500 w-8 h-8" />
                    </div>
                    <p className="text-charcoal-400">Carregando setlist...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-charcoal-950">
            {/* Header */}
            <header className="border-b border-charcoal-800 bg-charcoal-900/80 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gold-500/20 flex items-center justify-center">
                            <Music className="text-gold-500" size={18} />
                        </div>
                        <div>
                            <h1 className="text-white font-display font-bold text-lg leading-tight">Setlist ao Vivo</h1>
                            <p className="text-charcoal-500 text-xs">Somente leitura</p>
                        </div>
                    </div>

                    {/* Live indicator */}
                    <div className="flex items-center space-x-2">
                        <span className={`flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${connected
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
                            <span>{connected ? 'Ao Vivo' : 'Reconectando...'}</span>
                        </span>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">

                {/* Next Song Highlight */}
                {topSong && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl border-2 border-gold-500/40 bg-gold-500/5"
                    >
                        <div className="absolute inset-0 gold-bg-gradient opacity-5 pointer-events-none" />
                        <div className="relative p-6 flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center space-x-5">
                                <div className="w-16 h-16 rounded-2xl bg-gold-500/20 flex items-center justify-center shrink-0">
                                    <Trophy className="text-gold-500 w-8 h-8" />
                                </div>
                                <div>
                                    <div className="text-xs text-gold-500 font-bold uppercase tracking-widest mb-1">
                                        🏆 Mais Votada — Próxima
                                    </div>
                                    <div className="text-2xl font-display font-bold text-white">{topSong.title}</div>
                                    <div className="text-gold-400 font-medium">{topSong.artist}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <div className="text-3xl font-display font-black text-gold-500">{topSong.votes}</div>
                                    <div className="text-xs text-charcoal-500 uppercase tracking-wider">votos</div>
                                </div>
                                {topSong.sheet_music_url && (
                                    <a
                                        href={topSong.sheet_music_url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center space-x-2 px-4 py-3 bg-charcoal-800 text-gold-500 border border-gold-500/30 rounded-2xl hover:bg-gold-500/10 transition-all font-bold text-sm"
                                    >
                                        <FileText size={16} />
                                        <span>Partitura</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Pending Songs */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                                <ListMusic className="text-gold-500" size={20} />
                                <span>Aguardando</span>
                            </h2>
                            <span className="bg-charcoal-800 text-charcoal-400 px-3 py-1 rounded-full text-xs font-bold">
                                {pendingSongs.length} músicas
                            </span>
                        </div>

                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {pendingSongs.slice(1).map((song, index) => (
                                    <motion.div
                                        key={song.id}
                                        layout
                                        initial={{ opacity: 0, x: -16 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 16 }}
                                        className="glass rounded-2xl p-4 flex items-center justify-between border border-transparent hover:border-charcoal-700 transition-all"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="text-charcoal-600 font-display font-bold w-5 text-center">{index + 2}</div>
                                            <div className="w-10 h-10 rounded-lg bg-charcoal-800 flex items-center justify-center overflow-hidden border border-charcoal-700 shrink-0">
                                                {song.cover_image_url ? (
                                                    <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Music className="text-charcoal-600 w-4 h-4" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-bold text-white text-sm">{song.title}</div>
                                                <div className="text-xs text-charcoal-400">{song.artist}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="text-center">
                                                <div className="text-base font-display font-bold text-gold-500">{song.votes}</div>
                                                <div className="text-[10px] text-charcoal-600 uppercase">votos</div>
                                            </div>
                                            {song.sheet_music_url && (
                                                <a
                                                    href={song.sheet_music_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="bg-charcoal-800 text-charcoal-400 hover:text-gold-500 p-2.5 rounded-xl transition-all"
                                                    title="Ver Partitura"
                                                >
                                                    <FileText size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {pendingSongs.length === 0 && (
                                <div className="text-center py-16 glass rounded-3xl border-dashed">
                                    <Music className="w-10 h-10 text-charcoal-700 mx-auto mb-3" />
                                    <p className="text-charcoal-500 text-sm">Nenhuma música aguardando.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Played Setlist */}
                    <div className="lg:col-span-5">
                        <div className="glass rounded-3xl p-6 border border-charcoal-800/50 sticky top-24">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-display font-bold text-white flex items-center space-x-2">
                                    <History className="text-charcoal-400" size={18} />
                                    <span>Setlist Tocada</span>
                                </h2>
                                <span className="bg-charcoal-800 text-charcoal-400 px-3 py-1 rounded-full text-xs font-bold">
                                    {playedSongs.length}
                                </span>
                            </div>

                            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                                {playedSongs.map((song, index) => (
                                    <div key={song.id} className="flex items-start space-x-3 group">
                                        <div className="relative">
                                            <div className="w-7 h-7 rounded-full bg-gold-500/20 border border-gold-500/40 flex items-center justify-center text-xs font-bold text-gold-500">
                                                {index + 1}
                                            </div>
                                            {index < playedSongs.length - 1 && (
                                                <div className="absolute top-7 left-1/2 -translate-x-1/2 w-px h-5 bg-charcoal-800" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-5">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-charcoal-200 text-sm">{song.title}</div>
                                                    <div className="text-xs text-charcoal-500">{song.artist}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="text-green-500" size={14} />
                                                    {song.sheet_music_url && (
                                                        <a
                                                            href={song.sheet_music_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-charcoal-600 hover:text-gold-500 transition-colors"
                                                            title="Ver Partitura"
                                                        >
                                                            <FileText size={14} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {playedSongs.length === 0 && (
                                    <div className="text-center py-10">
                                        <Clock className="w-8 h-8 text-charcoal-700 mx-auto mb-2" />
                                        <p className="text-charcoal-600 text-sm italic">O show ainda não começou!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MusicianSetlist
