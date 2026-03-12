import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    Plus, Trash2, Upload, Globe, Eye, EyeOff,
    Loader2, Save, Users, GripVertical, ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminSponsors = () => {
    const { darkMode } = useTheme()
    const [sponsors, setSponsors] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ name: '', website_url: '', is_active: true })
    const [file, setFile] = useState(null)
    const [preview, setPreview] = useState(null)
    const fileRef = useRef(null)

    useEffect(() => { fetchSponsors() }, [])

    const fetchSponsors = async () => {
        setLoading(true)
        const { data, error } = await supabase.from('sponsors').select('*').order('display_order', { ascending: true })
        if (!error) setSponsors(data || [])
        setLoading(false)
    }

    const handleFileChange = (e) => {
        const f = e.target.files?.[0]
        if (f) { setFile(f); setPreview(URL.createObjectURL(f)) }
    }

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!file) { alert('Selecione uma imagem para o patrocinador.'); return }
        if (sponsors.length >= 10) { alert('Máximo de 10 patrocinadores atingido.'); return }
        setSaving(true)
        try {
            const ext = file.name.split('.').pop()
            const path = `sponsor_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('sponsors').upload(path, file)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('sponsors').getPublicUrl(path)
            const { error: insErr } = await supabase.from('sponsors').insert({ name: form.name, image_url: publicUrl, website_url: form.website_url, is_active: form.is_active, display_order: sponsors.length })
            if (insErr) throw insErr
            setForm({ name: '', website_url: '', is_active: true }); setFile(null); setPreview(null); setShowForm(false)
            fetchSponsors()
        } catch (err) {
            alert('Erro ao adicionar patrocinador: ' + err.message)
        } finally { setSaving(false) }
    }

    const toggleActive = async (sponsor) => {
        await supabase.from('sponsors').update({ is_active: !sponsor.is_active }).eq('id', sponsor.id)
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
        sponsorName: darkMode ? 'text-white' : 'text-gray-900',
        emptyIcon: darkMode ? 'text-charcoal-700' : 'text-gray-300',
        emptyText: darkMode ? 'text-charcoal-500' : 'text-gray-400',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className={`text-4xl font-display font-bold ${t.heading}`}>Patrocinadores</h1>
                            <p className={`mt-1 ${t.sub}`}>{sponsors.length}/10 patrocinadores cadastrados</p>
                        </div>
                        {sponsors.length < 10 && (
                            <button onClick={() => setShowForm(true)}
                                className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2">
                                <Plus size={18} /><span>Adicionar</span>
                            </button>
                        )}
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
                                        <div className="flex items-center space-x-3">
                                            <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
                                            <label htmlFor="is_active" className="text-sm text-charcoal-300">Visível para visitantes</label>
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
                                    className={`rounded-2xl border p-4 flex items-center gap-4 ${sponsor.is_active ? t.sponsorCard : `${t.sponsorCard} opacity-60`}`}>
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveOrder(index, -1)} disabled={index === 0} className={`hover:text-gold-500 disabled:opacity-20 transition-colors ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`}>▲</button>
                                        <GripVertical className={darkMode ? 'text-charcoal-700' : 'text-gray-300'} size={16} />
                                        <button onClick={() => moveOrder(index, 1)} disabled={index === sponsors.length - 1} className={`hover:text-gold-500 disabled:opacity-20 transition-colors ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`}>▼</button>
                                    </div>
                                    <div className={`w-20 h-14 rounded-xl overflow-hidden flex items-center justify-center border flex-shrink-0 ${darkMode ? 'bg-white/5 border-charcoal-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <img src={sponsor.image_url} alt={sponsor.name} className="max-w-full max-h-full object-contain p-1" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-semibold truncate ${t.sponsorName}`}>{sponsor.name}</p>
                                        {sponsor.website_url && (
                                            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-500/70 hover:text-gold-500 flex items-center gap-1 mt-0.5 truncate">
                                                <Globe size={10} />{sponsor.website_url}
                                            </a>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
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
