import { useState, useRef } from 'react'
import { X, CalendarDays, MapPin, Music2, User, Users, Plus, Upload, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const UF_LIST = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
]

const MAX_SHOW_SPONSORS = 4

const ShowRegistrationModal = ({ isOpen, onClose, onSave, sponsors = [] }) => {
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

    // Show sponsors state
    const [selectedSponsors, setSelectedSponsors] = useState([]) // [{id?, name, image_url, website_url}]
    const [showCustomForm, setShowCustomForm] = useState(false)
    const [customForm, setCustomForm] = useState({ name: '', image_url: '', website_url: '' })
    const [customPreview, setCustomPreview] = useState(null)
    const [uploadingCustom, setUploadingCustom] = useState(false)
    const customFileRef = useRef(null)

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

    const toggleSponsor = (sponsor) => {
        const alreadySelected = selectedSponsors.some(s => s.id === sponsor.id)
        if (alreadySelected) {
            setSelectedSponsors(prev => prev.filter(s => s.id !== sponsor.id))
        } else {
            if (selectedSponsors.length >= MAX_SHOW_SPONSORS) return
            setSelectedSponsors(prev => [...prev, { id: sponsor.id, name: sponsor.name, image_url: sponsor.image_url, website_url: sponsor.website_url }])
        }
    }

    const handleCustomFileChange = async (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setUploadingCustom(true)
        try {
            const ext = f.name.split('.').pop()
            const path = `sponsor_custom_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('sponsors').upload(path, f)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path)
            setCustomForm(p => ({ ...p, image_url: publicUrl }))
            setCustomPreview(URL.createObjectURL(f))
        } catch (err) {
            alert('Erro ao enviar imagem: ' + err.message)
        } finally {
            setUploadingCustom(false)
        }
    }

    const addCustomSponsor = () => {
        if (!customForm.name.trim() || !customForm.image_url.trim()) return
        if (selectedSponsors.length >= MAX_SHOW_SPONSORS) return
        setSelectedSponsors(prev => [...prev, {
            id: null,
            name: customForm.name.trim(),
            image_url: customForm.image_url.trim(),
            website_url: customForm.website_url.trim()
        }])
        setCustomForm({ name: '', image_url: '', website_url: '' })
        setCustomPreview(null)
        setShowCustomForm(false)
    }

    const removeSponsor = (index) => {
        setSelectedSponsors(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        const errs = validate()
        if (Object.keys(errs).length > 0) { setErrors(errs); return }

        setSaving(true)
        try {
            await onSave({ ...form, event_sponsors: selectedSponsors })
            // Reset
            setSelectedSponsors([])
            setCustomForm({ name: '', image_url: '', website_url: '' })
            setShowCustomForm(false)
            onClose()
        } catch (err) {
            alert('Erro ao cadastrar show: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const availableSponsors = sponsors.filter(s => s.is_active)
    const canAddMore = selectedSponsors.length < MAX_SHOW_SPONSORS

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
                        className="relative w-full max-w-lg bg-charcoal-900 border border-charcoal-700 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="relative px-8 pt-8 pb-4 flex-shrink-0">
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

                        {/* Scrollable Form */}
                        <form onSubmit={handleSubmit} className="px-8 pb-8 pt-2 space-y-5 overflow-y-auto flex-1">

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

                            {/* ── Sponsors Section ── */}
                            <div className="border-t border-charcoal-800 pt-5">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider flex items-center gap-2">
                                        <Users size={13} /> Patrocinadores do Show
                                        <span className="text-charcoal-600 normal-case font-normal tracking-normal">
                                            ({selectedSponsors.length}/{MAX_SHOW_SPONSORS})
                                        </span>
                                    </label>
                                </div>

                                {/* Selected sponsors preview */}
                                {selectedSponsors.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedSponsors.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-gold-500/10 border border-gold-500/30 rounded-xl px-3 py-2">
                                                <div className="w-8 h-8 bg-white/10 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0">
                                                    <img src={s.image_url} alt={s.name} className="max-w-full max-h-full object-contain p-0.5" />
                                                </div>
                                                <span className="text-xs font-medium text-charcoal-200 max-w-[80px] truncate">{s.name}</span>
                                                <button type="button" onClick={() => removeSponsor(i)} className="text-charcoal-500 hover:text-red-400 transition-colors ml-1 flex-shrink-0">
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pick from existing list */}
                                {availableSponsors.length > 0 && canAddMore && (
                                    <div className="mb-3">
                                        <p className="text-xs text-charcoal-500 mb-2">Selecionar da lista:</p>
                                        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                                            {availableSponsors.map(sp => {
                                                const isSelected = selectedSponsors.some(s => s.id === sp.id)
                                                return (
                                                    <button
                                                        key={sp.id}
                                                        type="button"
                                                        onClick={() => toggleSponsor(sp)}
                                                        disabled={!isSelected && !canAddMore}
                                                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all text-center ${isSelected
                                                            ? 'border-gold-500 bg-gold-500/10'
                                                            : 'border-charcoal-700 bg-charcoal-800 hover:border-charcoal-600 disabled:opacity-40'
                                                            }`}
                                                    >
                                                        <div className="w-10 h-8 flex items-center justify-center">
                                                            <img src={sp.image_url} alt={sp.name} className="max-w-full max-h-full object-contain" />
                                                        </div>
                                                        <span className={`text-[10px] font-medium leading-tight truncate w-full ${isSelected ? 'text-gold-400' : 'text-charcoal-400'}`}>{sp.name}</span>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Add custom sponsor */}
                                {canAddMore && !showCustomForm && (
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomForm(true)}
                                        className="flex items-center gap-2 text-xs text-charcoal-400 hover:text-gold-500 transition-colors border border-dashed border-charcoal-700 hover:border-gold-500/40 rounded-xl px-4 py-2.5 w-full justify-center"
                                    >
                                        <Plus size={13} /> Adicionar patrocinador personalizado
                                    </button>
                                )}

                                {/* Custom sponsor mini-form */}
                                <AnimatePresence>
                                    {showCustomForm && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="border border-charcoal-700 rounded-2xl p-4 space-y-3 mt-1">
                                                <p className="text-xs font-semibold text-charcoal-400 uppercase tracking-wider">Patrocinador personalizado</p>
                                                <input
                                                    type="text"
                                                    placeholder="Nome do patrocinador *"
                                                    value={customForm.name}
                                                    onChange={e => setCustomForm(p => ({ ...p, name: e.target.value }))}
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50"
                                                />
                                                {/* Image Upload */}
                                                <div
                                                    onClick={() => customFileRef.current?.click()}
                                                    className="w-full border-2 border-dashed border-charcoal-700 hover:border-gold-500/50 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors gap-2"
                                                >
                                                    {uploadingCustom ? (
                                                        <><Loader2 className="animate-spin text-gold-500" size={24} /><p className="text-xs text-charcoal-500">Enviando...</p></>
                                                    ) : customPreview ? (
                                                        <><img src={customPreview} alt="preview" className="max-h-16 object-contain" /><p className="text-[10px] text-charcoal-500">Clique para trocar</p></>
                                                    ) : (
                                                        <><Upload className="text-charcoal-600" size={22} /><p className="text-xs text-charcoal-500">Clique para enviar logo *</p></>
                                                    )}
                                                </div>
                                                <input ref={customFileRef} type="file" accept="image/*" className="hidden" onChange={handleCustomFileChange} />
                                                <input
                                                    type="url"
                                                    placeholder="Site ou Instagram (opcional)"
                                                    value={customForm.website_url}
                                                    onChange={e => setCustomForm(p => ({ ...p, website_url: e.target.value }))}
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50"
                                                />
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => setShowCustomForm(false)} className="flex-1 py-2 rounded-xl bg-charcoal-800 text-charcoal-400 text-sm hover:bg-charcoal-700 transition-colors">
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={addCustomSponsor}
                                                        disabled={!customForm.name.trim() || !customForm.image_url.trim()}
                                                        className="flex-1 py-2 rounded-xl gold-bg-gradient text-charcoal-950 font-bold text-sm disabled:opacity-40"
                                                    >
                                                        Adicionar
                                                    </button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {!canAddMore && (
                                    <p className="text-xs text-charcoal-600 text-center mt-2">Máximo de {MAX_SHOW_SPONSORS} patrocinadores atingido</p>
                                )}
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
