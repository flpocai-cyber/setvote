import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    CreditCard, CheckCircle, Clock, FileText, Trash2, Loader2, Phone, User, MessageSquare, Music
} from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'
import { motion } from 'framer-motion'

const AdminPagantes = () => {
    const { darkMode } = useTheme()
    const [dedications, setDedications] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchDedications() }, [])

    const fetchDedications = async () => {
        setLoading(true)
        const { data } = await supabase
            .from('dedications')
            .select('*')
            .order('created_at', { ascending: false })
        setDedications(data || [])
        setLoading(false)
    }

    const markAsPlayed = async (id) => {
        await supabase.from('dedications').update({ is_played: true }).eq('id', id)
        fetchDedications()
    }

    const deleteReceipt = async (dedication) => {
        if (!window.confirm('Excluir comprovante? Os dados do pagante serão mantidos.')) return
        if (dedication.receipt_url) {
            const urlParts = dedication.receipt_url.split('/dedications/')
            if (urlParts[1]) {
                await supabase.storage.from('dedications').remove([urlParts[1]])
            }
        }
        await supabase.from('dedications').update({ receipt_url: null }).eq('id', dedication.id)
        fetchDedications()
    }

    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        card: darkMode ? 'bg-charcoal-900/40 border-charcoal-700' : 'bg-white border-gray-200 shadow-sm',
        badge: darkMode ? 'bg-charcoal-800 text-charcoal-400' : 'bg-gray-100 text-gray-500',
    }

    const pending = dedications.filter(d => !d.is_played)
    const played = dedications.filter(d => d.is_played)

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div>
                            <h1 className={`text-4xl font-display font-bold ${t.heading}`}>Pagantes</h1>
                            <p className={`mt-1 text-sm ${t.sub}`}>{pending.length} pendente{pending.length !== 1 ? 's' : ''} · {played.length} tocada{played.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="animate-spin text-gold-500" size={32} />
                        </div>
                    ) : dedications.length === 0 ? (
                        <div className={`rounded-3xl border p-16 flex flex-col items-center text-center ${t.card}`}>
                            <CreditCard className={darkMode ? 'text-charcoal-700' : 'text-gray-300'} size={48} />
                            <p className={`mt-4 text-lg font-display ${t.sub}`}>Nenhuma dedicação ainda</p>
                            <p className={`text-sm mt-1 ${t.sub}`}>Quando visitantes pagarem uma dedicação, aparecerão aqui.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {/* Pendentes */}
                            {pending.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock size={16} className="text-gold-500" />
                                        <h2 className={`text-sm font-black uppercase tracking-wider text-gold-500`}>Aguardando ser tocadas</h2>
                                    </div>
                                    <div className="space-y-3">
                                        {pending.map(d => (
                                            <DedicationCard key={d.id} d={d} darkMode={darkMode} t={t}
                                                onMarkPlayed={() => markAsPlayed(d.id)}
                                                onDeleteReceipt={() => deleteReceipt(d)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                            {/* Tocadas */}
                            {played.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <CheckCircle size={16} className="text-green-500" />
                                        <h2 className={`text-sm font-black uppercase tracking-wider text-green-500`}>Já tocadas</h2>
                                    </div>
                                    <div className="space-y-3 opacity-60">
                                        {played.map(d => (
                                            <DedicationCard key={d.id} d={d} darkMode={darkMode} t={t}
                                                onMarkPlayed={null}
                                                onDeleteReceipt={() => deleteReceipt(d)} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}

const DedicationCard = ({ d, darkMode, t, onMarkPlayed, onDeleteReceipt }) => {
    const dateStr = new Date(d.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

    return (
        <motion.div layout className={`rounded-2xl border p-5 ${t.card}`}>
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${d.is_played ? 'bg-green-500/10' : 'bg-gold-500/10'}`}>
                    <Music size={18} className={d.is_played ? 'text-green-500' : 'text-gold-500'} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div>
                            <p className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{d.song_title}</p>
                            {d.song_artist && <p className={`text-sm ${t.sub}`}>{d.song_artist}</p>}
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-lg font-medium flex-shrink-0 ${d.is_played
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gold-500/10 text-gold-500'
                        }`}>{d.is_played ? '✓ Tocada' : '⏳ Pendente'}</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2">
                        <div className="flex items-center gap-2">
                            <User size={13} className={t.sub} />
                            <span className={`text-sm ${darkMode ? 'text-charcoal-300' : 'text-gray-700'}`}>{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={13} className={t.sub} />
                            <span className={`text-sm ${darkMode ? 'text-charcoal-300' : 'text-gray-700'}`}>{d.phone}</span>
                        </div>
                    </div>

                    {d.message && (
                        <div className={`mt-3 flex items-start gap-2 p-3 rounded-xl ${darkMode ? 'bg-charcoal-800' : 'bg-gray-50'}`}>
                            <MessageSquare size={13} className={`mt-0.5 flex-shrink-0 ${t.sub}`} />
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-charcoal-300' : 'text-gray-600'}`}>{d.message}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-2 mt-4 flex-wrap">
                        <span className={`text-xs ${t.sub}`}>{dateStr}</span>
                        <div className="flex-1" />
                        {d.receipt_url && (
                            <a href={d.receipt_url} target="_blank" rel="noopener noreferrer"
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${darkMode
                                    ? 'border-charcoal-700 text-charcoal-400 hover:text-gold-500 hover:border-gold-500/40'
                                    : 'border-gray-200 text-gray-500 hover:text-gold-500'
                                }`}>
                                <FileText size={12} /> Comprovante
                            </a>
                        )}
                        {d.receipt_url && (
                            <button onClick={onDeleteReceipt}
                                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${darkMode
                                    ? 'border-charcoal-700 text-charcoal-600 hover:text-red-400 hover:border-red-400/30'
                                    : 'border-gray-200 text-gray-400 hover:text-red-500'
                                }`}>
                                <Trash2 size={12} /> Excluir comprovante
                            </button>
                        )}
                        {onMarkPlayed && (
                            <button onClick={onMarkPlayed}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30 transition-colors">
                                <CheckCircle size={12} /> Marcar como Tocada
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

export default AdminPagantes
