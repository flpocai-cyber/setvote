import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    Plus, Trash2, Upload, Globe, Eye, EyeOff,
    Loader2, Save, Users, GripVertical, ExternalLink, Star
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'

const MAX_TOTAL = 70
const MAX_MASTER = 20
const MAX_NORMAL = 50

const AdminSponsors = () => {
    const { darkMode } = useTheme()
    const [sponsors, setSponsors] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', website_url: '', is_active: true, is_master: false })
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const fileRef = useRef(null)

    useEffect(() => { fetchSponsors() }, [])

    const fetchSponsors = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('sponsors').select('*').order('is_master', { ascending: false }).order('display_order', { ascending: true })
        if (!error) setSponsors(data || [])
        setLoading(false)
    }

    const masterCount = sponsors.filter(s => s.is_master).length
    const normalCount = sponsors.filter(s => !s.is_master).length

    const handleFileChange = (e) => {
        const f = e.target.files?.[0]
        if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!file) { alert('Selecione uma imagem para o patrocinador.'); return }
        if (sponsors.length >= MAX_TOTAL) { alert(`Máximo de ${MAX_TOTAL} patrocinadores atingido.`); return }
        if (form.is_master && masterCount >= MAX_MASTER) { alert(`Máximo de ${MAX_MASTER} patrocinadores master atingido.`); return }
        if (!form.is_master && normalCount >= MAX_NORMAL) { alert(`Máximo de ${MAX_NORMAL} patrocinadores normais atingido.`); return }
        setSaving(true)
        try {
            const ext = file.name.split('.').pop()
            const path = `sponsor_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('sponsors').upload(path, file)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path)
            const { error: insErr } = await supabase.from('sponsors').insert({
                name: form.name,
                image_url: publicUrl,
                website_url: form.website_url,
                is_active: form.is_active,
                is_master: form.is_master,
                display_order: sponsors.length
            })
            if (insErr) throw insErr
            setForm({ name: '', website_url: '', is_active: true, is_master: false })
            setFile(null); setPreview(null); setShowForm(false)
            fetchSponsors()
        } catch (err) {
            alert('Erro ao adicionar patrocinador: ' + err.message)
        } finally { setSaving(false) }
    }

    const toggleActive = async (sponsor) => {
        await supabase.from('sponsors').update({ is_active: !sponsor.is_active }).eq('id', sponsor.id)
        fetchSponsors()
    }

    const toggleMaster = async (sponsor) => {
        const becomingMaster = !sponsor.is_master
        if (becomingMaster && masterCount >= MAX_MASTER) {
            alert(`Máximo de ${MAX_MASTER} patrocinadores master atingido.`)
            return
        }
        if (!becomingMaster && normalCount >= MAX_NORMAL) {
            alert(`Máximo de ${MAX_NORMAL} patrocinadores normais atingido.`)
            return
        }
        await supabase.from('sponsors').update({ is_master: becomingMaster }).eq('id', sponsor.id)
        fetchSponsors()
    }

    const deleteSponsor = async (sponsor) => {
        if (!window.confirm(`Remover "${sponsor.name}"?`)) return
        const urlParts = sponsor.image_url.split('/sponsors/')
        if (urlParts[1]) await supabase.storage.from('sponsors').remove([urlParts[1]])
        await supabase.from('sponsors').delete().eq('id', sponsor.id)
        fetchSponsors()
    }

    const moveOrder = async (index, dir) => {
        const newSponsors = [...sponsors]
        const swap = index + dir
        if (swap < 0 || swap >= newSponsors.length) return;
        [newSponsors[index], newSponsors[swap]] = [newSponsors[swap], newSponsors[index]]
        const updates = newSponsors.map((s, i) => supabase.from('sponsors').update({ display_order: i }).eq('id', s.id))
        await Promise.all(updates)
        fetchSponsors()
    }

    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        card: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        sponsorCard: darkMode ? 'bg-charcoal-900/40 border-charcoal-700' : 'bg-white border-gray-200 shadow-sm',
        masterCard: darkMode ? 'bg-gold-500/5 border-gold-500/40' : 'bg-amber-50 border-amber-300 shadow-sm',
        sponsorName: darkMode ? 'text-white' : 'text-gray-900',
        emptyIcon: darkMode ? 'text-charcoal-700' : 'text-gray-300',
        emptyText: darkMode ? 'text-charcoal-500' : 'text-gray-400',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className={`text-4xl font-display font-bold ${t.heading}`}>Patrocinadores</h1>
                            <p className={`mt-1 ${t.sub}`}>{sponsors.length}/{MAX_TOTAL} patrocinadores cadastrados</p>
                        </div>
                        {sponsors.length < MAX_TOTAL && (
                            <button onClick={() => setShowForm(true)}
                                className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2">
                                <Plus size={18} /><span>Adicionar</span>
                            </button>
                        )}
                    </div>

                    {/* Counters */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${darkMode ? 'bg-gold-500/5 border-gold-500/30' : 'bg-amber-50 border-amber-200'}`}>
                            <Star className="text-gold-500" size={20} fill="currentColor" />
                            <div>
                                <p className="text-gold-500 font-bold text-lg leading-none">{masterCount}<span className="text-charcoal-500 text-sm font-normal">/{MAX_MASTER}</span></p>
                                <p className={`text-xs mt-0.5 ${t.sub}`}>Patrocinadores Master</p>
                            </div>
                        </div>
                        <div className={`rounded-2xl border p-4 flex items-center gap-3 ${darkMode ? 'glass border-charcoal-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <Users className={darkMode ? 'text-charcoal-400' : 'text-gray-400'} size={20} />
                            <div>
                                <p className={`font-bold text-lg leading-none ${t.heading}`}>{normalCount}<span className={`text-sm font-normal ${t.sub}`}>/{MAX_NORMAL}</span></p>
                                <p className={`text-xs mt-0.5 ${t.sub}`}>Patrocinadores Normais</p>
                            </div>
                        </div>
                    </div>

                    {/* Add Form Modal */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
                                <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                    className="glass rounded-3xl p-8 border border-charcoal-700 w-full max-w-md">
                                    <h2 className="text-2xl font-display font-bold text-white mb-6">Novo Patrocinador</h2>
                                    <form onSubmit={handleAdd} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-2">Logo do Patrocinador *</label>
                                            <div onClick={() => fileRef.current?.click()}
                                                className="border-2 border-dashed border-charcoal-700 hover:border-gold-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors">
                                                {preview ? (
                                                    <img src={preview} alt="preview" className="max-h-24 object-contain" />
                                                ) : (
                                                    <>
                                                        <Upload className="text-charcoal-600 mb-2" size={32} />
                                                        <p className="text-sm text-charcoal-500">Clique para selecionar imagem</p>
                                                    </>
                                                )}
                                            </div>
                                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-2">Nome do Patrocinador *</label>
                                            <input required type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                placeholder="Ex: Cervejaria Aurora" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-2">Site / Instagram (opcional)</label>
                                            <input type="url" value={form.website_url} onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                placeholder="https://..." />
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center space-x-3">
                                                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
                                                <label htmlFor="is_active" className="text-sm text-charcoal-300">Visível para visitantes</label>
                                            </div>
                                            <div className={`flex items-center space-x-3 p-3 rounded-xl border ${form.is_master ? 'border-gold-500/40 bg-gold-500/5' : 'border-charcoal-700'}`}>
                                                <input type="checkbox" id="is_master" checked={form.is_master} onChange={e => setForm(p => ({ ...p, is_master: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
                                                <label htmlFor="is_master" className="text-sm text-charcoal-300 flex items-center gap-2">
                                                    <Star size={14} className={form.is_master ? 'text-gold-500' : 'text-charcoal-600'} fill={form.is_master ? 'currentColor' : 'none'} />
                                                    Patrocinador Master <span className="text-charcoal-500 text-xs">(ocupa espaço duplo)</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-charcoal-800 text-charcoal-300 py-3 rounded-xl hover:bg-charcoal-700 transition-colors">Cancelar</button>
                                            <button type="submit" disabled={saving} className="flex-1 gold-bg-gradient text-charcoal-950 font-bold py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50">
                                                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                <span>Salvar</span>
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Sponsors List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-gold-500" size={32} />
                        </div>
                    ) : sponsors.length === 0 ? (
                        <div className={`rounded-3xl border p-16 flex flex-col items-center justify-center text-center ${t.card}`}>
                            <Users className={`mb-4 ${t.emptyIcon}`} size={48} />
                            <h3 className={`text-xl font-display ${t.emptyText}`}>Nenhum patrocinador ainda</h3>
                            <p className={`text-sm mt-2 ${t.emptyText}`}>Clique em "Adicionar" para cadastrar o primeiro.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sponsors.map((sponsor, index) => (
                                <motion.div key={sponsor.id} layout
                                    className={`rounded-2xl border p-4 flex items-center gap-4 transition-all ${sponsor.is_master
                                        ? sponsor.is_active ? t.masterCard : `${t.masterCard} opacity-60`
                                        : sponsor.is_active ? t.sponsorCard : `${t.sponsorCard} opacity-60`
                                    }`}>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveOrder(index, -1)} disabled={index === 0} className={`hover:text-gold-500 disabled:opacity-20 transition-colors ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`}>▲</button>
                                        <GripVertical className={darkMode ? 'text-charcoal-700' : 'text-gray-300'} size={16} />
                                        <button onClick={() => moveOrder(index, 1)} disabled={index === sponsors.length - 1} className={`hover:text-gold-500 disabled:opacity-20 transition-colors ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`}>▼</button>
                                    </div>
                                    <div className={`w-20 h-14 rounded-xl overflow-hidden flex items-center justify-center border flex-shrink-0 ${darkMode ? 'bg-white/5 border-charcoal-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <img src={sponsor.image_url} alt={sponsor.name} className="max-w-full max-h-full object-contain p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`font-semibold truncate ${t.sponsorName}`}>{sponsor.name}</p>
                                            {sponsor.is_master && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-500 border border-gold-500/30 flex-shrink-0">
                                                    <Star size={9} fill="currentColor" /> MASTER
                                                </span>
                                            )}
                                        </div>
                                        {sponsor.website_url && (
                                            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-500/70 hover:text-gold-500 flex items-center gap-1 mt-0.5 truncate">
                                                <Globe size={10} />{sponsor.website_url}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* Toggle Master */}
                                        <button
                                            onClick={() => toggleMaster(sponsor)}
                                            title={sponsor.is_master ? 'Remover status Master' : 'Promover a Master'}
                                            className={`p-2 transition-colors rounded-lg ${sponsor.is_master
                                                ? 'text-gold-500 hover:text-gold-400 bg-gold-500/10'
                                                : darkMode ? 'text-charcoal-600 hover:text-gold-500' : 'text-gray-400 hover:text-gold-500'
                                            }`}>
                                            <Star size={16} fill={sponsor.is_master ? 'currentColor' : 'none'} />
                                        </button>
                                        {sponsor.website_url && (
                                            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className={`p-2 transition-colors ${darkMode ? 'text-charcoal-500 hover:text-gold-500' : 'text-gray-400 hover:text-gold-500'}`}>
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        <button onClick={() => toggleActive(sponsor)} className={`p-2 transition-colors ${sponsor.is_active ? 'text-green-500 hover:text-green-400' : darkMode ? 'text-charcoal-600 hover:text-charcoal-400' : 'text-gray-400 hover:text-gray-600'}`}>
                                            {sponsor.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button onClick={() => deleteSponsor(sponsor)} className={`p-2 transition-colors ${darkMode ? 'text-charcoal-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>
                                            <Trash2 size={16} />
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

export default AdminSponsors
