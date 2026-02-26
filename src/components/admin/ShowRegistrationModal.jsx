import { useState } from 'react'
import { X, CalendarDays, MapPin, Music2, User } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const UF_LIST = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const ShowRegistrationModal = ({ isOpen, onClose, onSave }) => {
    const today = new Date().toISOString().split('T')[0]
    const [form, setForm] = useState({
        show_date: today,
        venue: '',
        city: '',
        state: 'SP',
        musician_name: ''
    })
    const [saving, setSaving] = useState(false)
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
        setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }

    const validate = () => {
        const e = {}
        if (!form.show_date) e.show_date = 'Informe a data'
        if (!form.venue.trim()) e.venue = 'Informe o local'
        if (!form.city.trim()) e.city = 'Informe a cidade'
        if (!form.musician_name.trim()) e.musician_name = 'Informe o nome'
        return e
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }

        setSaving(true)
        try {
            await onSave(form)
            onClose()
        } catch (err) {
            alert('Erro ao cadastrar show: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 30, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative w-full max-w-lg bg-charcoal-900 border border-charcoal-700 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="relative px-8 pt-8 pb-4">
                            <div className="absolute inset-0 gold-bg-gradient opacity-5" />
                            <div className="relative flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-display font-bold text-white">Cadastrar Show</h2>
                                    <p className="text-charcoal-400 text-sm mt-1">Preencha os dados do evento</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-10 h-10 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center text-charcoal-400 hover:text-white transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-2 space-y-5">

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <CalendarDays size={13} /> Data do Show
                                </label>
                                <input
                                    type="date"
                                    name="show_date"
                                    value={form.show_date}
                                    onChange={handleChange}
                                    className={`w-full bg-charcoal-800 border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/70 transition-colors ${errors.show_date ? 'border-red-500' : 'border-charcoal-700'}`}
                                />
                                {errors.show_date && <p className="text-red-400 text-xs mt-1">{errors.show_date}</p>}
                            </div>

                            {/* Musician Name */}
                            <div>
                                <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <User size={13} /> Nome do Músico / Banda
                                </label>
                                <input
                                    type="text"
                                    name="musician_name"
                                    value={form.musician_name}
                                    onChange={handleChange}
                                    placeholder="Ex: Rinaldo Zamai"
                                    className={`w-full bg-charcoal-800 border rounded-xl px-4 py-3 text-white placeholder-charcoal-600 focus:outline-none focus:border-gold-500/70 transition-colors ${errors.musician_name ? 'border-red-500' : 'border-charcoal-700'}`}
                                />
                                {errors.musician_name && <p className="text-red-400 text-xs mt-1">{errors.musician_name}</p>}
                            </div>

                            {/* Venue */}
                            <div>
                                <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <MapPin size={13} /> Local / Estabelecimento
                                </label>
                                <input
                                    type="text"
                                    name="venue"
                                    value={form.venue}
                                    onChange={handleChange}
                                    placeholder="Ex: APAE, Bar do João, Teatro Municipal..."
                                    className={`w-full bg-charcoal-800 border rounded-xl px-4 py-3 text-white placeholder-charcoal-600 focus:outline-none focus:border-gold-500/70 transition-colors ${errors.venue ? 'border-red-500' : 'border-charcoal-700'}`}
                                />
                                {errors.venue && <p className="text-red-400 text-xs mt-1">{errors.venue}</p>}
                            </div>

                            {/* City + State */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Cidade</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={form.city}
                                        onChange={handleChange}
                                        placeholder="Ex: São Paulo"
                                        className={`w-full bg-charcoal-800 border rounded-xl px-4 py-3 text-white placeholder-charcoal-600 focus:outline-none focus:border-gold-500/70 transition-colors ${errors.city ? 'border-red-500' : 'border-charcoal-700'}`}
                                    />
                                    {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
                                </div>
                                <div className="w-28">
                                    <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Estado</label>
                                    <select
                                        name="state"
                                        value={form.state}
                                        onChange={handleChange}
                                        className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold-500/70 transition-colors"
                                    >
                                        {UF_LIST.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-6 py-3 border border-charcoal-700 text-charcoal-400 hover:text-white hover:border-charcoal-600 rounded-xl transition-all font-medium"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                                >
                                    <Music2 size={18} />
                                    {saving ? 'Salvando...' : 'Iniciar Show'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default ShowRegistrationModal
