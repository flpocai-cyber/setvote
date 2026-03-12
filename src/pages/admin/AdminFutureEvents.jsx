import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    Plus, Trash2, Eye, EyeOff, Copy, Check, Loader2, CalendarPlus, MapPin,
    CalendarDays, Music
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminFutureEvents = () => {
    const { darkMode } = useTheme()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [copiedToken, setCopiedToken] = useState(null)
    const [userId, setUserId] = useState(null)
    const [formTitle, setFormTitle] = useState('')
    const [formDate, setFormDate] = useState('')
    const [formTime, setFormTime] = useState('')
    const [formVenue, setFormVenue] = useState('')

    useEffect(() => { checkUser(); fetchEvents() }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setUserId(user.id)
    }

    const fetchEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('future_events').select('*').order('event_date', { ascending: true })
        if (!error && data) setEvents(data)
        setLoading(false)
    }

    const handleCreateEvent = async (e) => {
        e.preventDefault()
        if (!userId) return
        if (!formTitle || !formDate || !formTime) { alert('Preencha pelo menos o título, data e hora do evento.'); return }
        setSaving(true)
        try {
            const eventDateTime = new Date(`${formDate}T${formTime}:00`).toISOString()
            const token = crypto.randomUUID()
            const { error } = await supabase.from('future_events').insert({ user_id: userId, title: formTitle, event_date: eventDateTime, venue: formVenue, token, is_active: true })
            if (error) throw error
            setFormTitle(''); setFormDate(''); setFormTime(''); setFormVenue(''); setShowForm(false)
            fetchEvents()
        } catch (error) { alert('Erro ao criar evento: ' + error.message) }
        finally { setSaving(false) }
    }

    const toggleActive = async (event) => {
        await supabase.from('future_events').update({ is_active: !event.is_active }).eq('id', event.id)
        fetchEvents()
    }

    const deleteEvent = async (event) => {
        if (!window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?\nTodos os votos associados a ele também serão perdidos.`)) return
        const { error } = await supabase.from('future_events').delete().eq('id', event.id)
        if (!error) fetchEvents(); else alert("Erro ao excluir: " + error.message)
    }

    const copyLink = (token) => {
        navigator.clipboard.writeText(`${window.location.origin}/evento/${token}`)
        setCopiedToken(token); setTimeout(() => setCopiedToken(null), 2000)
    }

    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        return new Date(dateString).toLocaleDateString('pt-BR', options).replace(',', ' as')
    }

    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        empty: darkMode ? 'bg-charcoal-900/40 border-charcoal-700' : 'bg-white border-gray-200 shadow-sm',
        emptyText: darkMode ? 'text-charcoal-500' : 'text-gray-400',
        eventCard: darkMode ? 'bg-charcoal-900/40' : 'bg-white shadow-sm',
        eventTitle: darkMode ? 'text-white' : 'text-gray-900',
        eventMeta: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        actionBg: darkMode ? 'bg-charcoal-800 text-charcoal-500 hover:bg-charcoal-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className={`text-4xl font-display font-bold flex items-center gap-3 ${t.heading}`}>
                                <CalendarDays className="text-gold-500" /> Eventos Futuros
                            </h1>
                            <p className={`mt-2 ${t.sub}`}>Crie links para o público e contratantes votarem nas músicas antes do show.</p>
                        </div>
                        <button onClick={() => setShowForm(true)}
                            className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2">
                            <Plus size={18} /><span>Novo Evento</span>
                        </button>
                    </div>

                    {/* Modal */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                    className="glass rounded-3xl p-8 border border-charcoal-700 w-full max-w-md">
                                    <h2 className="text-2xl font-display font-bold text-white mb-6">Criar Novo Evento</h2>
                                    <form onSubmit={handleCreateEvent} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-1">Nome do Evento / Contratante *</label>
                                            <input type="text" required value={formTitle} onChange={e => setFormTitle(e.target.value)}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                placeholder="Ex: Aniversário do João" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-400 mb-1">Data *</label>
                                                <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)}
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50 [color-scheme:dark]" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-400 mb-1">Hora *</label>
                                                <input type="time" required value={formTime} onChange={e => setFormTime(e.target.value)}
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50 [color-scheme:dark]" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-1">Local (Opcional)</label>
                                            <input type="text" value={formVenue} onChange={e => setFormVenue(e.target.value)}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                placeholder="Ex: Espaço de Eventos Vida" />
                                        </div>
                                        <div className="flex gap-3 pt-4">
                                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-charcoal-800 text-charcoal-300 py-3 rounded-xl hover:bg-charcoal-700 transition-colors">Cancelar</button>
                                            <button type="submit" disabled={saving} className="flex-1 gold-bg-gradient text-charcoal-950 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50">
                                                {saving ? <Loader2 className="animate-spin" size={18} /> : <span>Salvar Evento</span>}
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Events list */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-gold-500" size={32} />
                        </div>
                    ) : events.length === 0 ? (
                        <div className={`rounded-3xl border border-dashed p-16 flex flex-col items-center justify-center text-center ${t.empty}`}>
                            <CalendarPlus className={`mb-4 ${t.emptyText}`} size={48} />
                            <h3 className={`text-xl font-display ${t.emptyText}`}>Nenhum evento futuro</h3>
                            <p className={`text-sm mt-2 ${t.emptyText}`}>Clique em "Novo Evento" para agendar seu primeiro show futuro.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {events.map((event) => (
                                <motion.div key={event.id} layout
                                    className={`rounded-2xl border p-5 sm:flex items-center gap-6 ${event.is_active
                                        ? `${t.eventCard} border-gold-500/30`
                                        : `${t.eventCard} border-gray-200 opacity-70`}`}>
                                    <div className="flex-1 mb-4 sm:mb-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className={`text-xl font-bold ${t.eventTitle}`}>{event.title}</h3>
                                            {!event.is_active && (
                                                <span className="text-[10px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Inativo</span>
                                            )}
                                        </div>
                                        <div className={`flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm ${t.eventMeta}`}>
                                            <div className="flex items-center gap-1.5">
                                                <CalendarDays size={14} className={event.is_active ? 'text-gold-500/70' : ''} />
                                                <span>{formatDate(event.event_date)}</span>
                                            </div>
                                            {event.venue && (
                                                <div className="flex items-center gap-1.5 truncate">
                                                    <MapPin size={14} className={event.is_active ? 'text-gold-500/70' : ''} />
                                                    <span className="truncate">{event.venue}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Link to={`/admin/evento/${event.token}`}
                                            className="hidden sm:flex items-center space-x-2 px-6 py-2.5 gold-bg-gradient text-charcoal-950 rounded-xl font-bold shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all">
                                            <Music size={16} /><span>Mesa do Show</span>
                                        </Link>
                                        <button onClick={() => copyLink(event.token)}
                                            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-gold-500/10 hover:bg-gold-500/20 text-gold-500 rounded-xl transition-colors text-sm font-semibold">
                                            {copiedToken === event.token ? <Check size={16} /> : <Copy size={16} />}
                                            <span className="hidden lg:inline">{copiedToken === event.token ? 'Copiado' : 'Link de Votos'}</span>
                                        </button>
                                        <button onClick={() => toggleActive(event)} className={`p-2.5 rounded-xl transition-colors ${t.actionBg}`}>
                                            {event.is_active ? <Eye size={18} className="text-green-500" /> : <EyeOff size={18} />}
                                        </button>
                                        <button onClick={() => deleteEvent(event)} className={`p-2.5 rounded-xl transition-colors hover:text-red-400 ${t.actionBg}`}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminFutureEvents
