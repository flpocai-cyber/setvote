import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    Music, LayoutDashboard, Settings, LogOut,
    Plus, Trash2, Upload, Globe, Eye, EyeOff,
    Loader2, Save, Users, GripVertical, ExternalLink
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AdminSponsors = () => {
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
        const { data, error } = await supabase
            .from('sponsors')
            .select('*')
            .order('display_order', { ascending: true })
        if (!error) setSponsors(data || [])
        setLoading(false)
    }

    const handleFileChange = (e) => {
        const f = e.target.files?.[0]
        if (f) {
            setFile(f)
            setPreview(URL.createObjectURL(f))
        }
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
            const { error: insErr } = await supabase.from('sponsors').insert({
                name: form.name,
                image_url: publicUrl,
                website_url: form.website_url,
                is_active: form.is_active,
                display_order: sponsors.length
            })
            if (insErr) throw insErr
            setForm({ name: '', website_url: '', is_active: true })
            setFile(null)
            setPreview(null)
            setShowForm(false)
            fetchSponsors()
        } catch (err) {
            alert('Erro ao adicionar patrocinador: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const toggleActive = async (sponsor) => {
        await supabase.from('sponsors').update({ is_active: !sponsor.is_active }).eq('id', sponsor.id)
        fetchSponsors()
    }

    const deleteSponsor = async (sponsor) => {
        if (!window.confirm(`Remover "${sponsor.name}"?`)) return
        // Extract file path from URL
        const urlParts = sponsor.image_url.split('/sponsors/')
        if (urlParts[1]) {
            await supabase.storage.from('sponsors').remove([urlParts[1]])
        }
        await supabase.from('sponsors').delete().eq('id', sponsor.id)
        fetchSponsors()
    }

    const moveOrder = async (index, dir) => {
        const newSponsors = [...sponsors]
        const swap = index + dir
        if (swap < 0 || swap >= newSponsors.length) return
            ;[newSponsors[index], newSponsors[swap]] = [newSponsors[swap], newSponsors[index]]
        // Update display_order
        const updates = newSponsors.map((s, i) =>
            supabase.from('sponsors').update({ display_order: i }).eq('id', s.id)
        )
        await Promise.all(updates)
        fetchSponsors()
    }

    return (
        <div className="min-h-screen bg-charcoal-950 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-charcoal-900 border-r border-charcoal-800 flex flex-col hidden lg:flex">
                <div className="p-6">
                    <h2 className="text-xl font-display font-bold gold-gradient flex items-center space-x-2">
                        <Music className="text-gold-500" />
                        <span>SetVote Admin</span>
                    </h2>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/admin/dashboard" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <LayoutDashboard size={20} /><span>Dashboard</span>
                    </Link>
                    <Link to="/admin/musicas" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Music size={20} /><span>Músicas</span>
                    </Link>
                    <Link to="/admin/patrocinadores" className="flex items-center space-x-3 text-gold-500 bg-gold-500/10 px-4 py-3 rounded-xl transition-all">
                        <Users size={20} /><span>Patrocinadores</span>
                    </Link>
                    <Link to="/admin/configuracoes" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Settings size={20} /><span>Configurações</span>
                    </Link>
                </nav>
                <div className="p-4 mt-auto">
                    <button onClick={() => supabase.auth.signOut()} className="flex items-center space-x-3 text-charcoal-500 hover:text-red-400 px-4 py-3 transition-colors w-full">
                        <LogOut size={20} /><span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h1 className="text-4xl font-display font-bold text-white">Patrocinadores</h1>
                            <p className="text-charcoal-400 mt-1">{sponsors.length}/10 patrocinadores cadastrados</p>
                        </div>
                        {sponsors.length < 10 && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2"
                            >
                                <Plus size={18} /><span>Adicionar</span>
                            </button>
                        )}
                    </div>

                    {/* Add Form Modal */}
                    <AnimatePresence>
                        {showForm && (
                            <motion.div
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
                            >
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                    className="glass rounded-3xl p-8 border border-charcoal-700 w-full max-w-md"
                                >
                                    <h2 className="text-2xl font-display font-bold text-white mb-6">Novo Patrocinador</h2>
                                    <form onSubmit={handleAdd} className="space-y-5">
                                        {/* Logo Upload */}
                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-2">Logo do Patrocinador *</label>
                                            <div
                                                onClick={() => fileRef.current?.click()}
                                                className="border-2 border-dashed border-charcoal-700 hover:border-gold-500/50 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors"
                                            >
                                                {preview ? (
                                                    <img src={preview} alt="preview" className="max-h-24 object-contain" />
                                                ) : (
                                                    <>
                                                        <Upload className="text-charcoal-600 mb-2" size={32} />
                                                        <p className="text-sm text-charcoal-500">Clique para selecionar imagem</p>
                                                        <p className="text-xs text-charcoal-600 mt-1">PNG, JPG, SVG — fundo transparente preferível</p>
                                                    </>
                                                )}
                                            </div>
                                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-2">Nome do Patrocinador *</label>
                                            <input
                                                required
                                                type="text"
                                                value={form.name}
                                                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                placeholder="Ex: Cervejaria Aurora"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-charcoal-400 mb-2">Site / Instagram (opcional)</label>
                                            <input
                                                type="url"
                                                value={form.website_url}
                                                onChange={e => setForm(p => ({ ...p, website_url: e.target.value }))}
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                placeholder="https://..."
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={form.is_active}
                                                onChange={e => setForm(p => ({ ...p, is_active: e.target.checked }))}
                                                className="w-4 h-4 accent-yellow-500"
                                            />
                                            <label htmlFor="is_active" className="text-sm text-charcoal-300">Visível para visitantes</label>
                                        </div>

                                        <div className="flex gap-3 pt-2">
                                            <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-charcoal-800 text-charcoal-300 py-3 rounded-xl hover:bg-charcoal-700 transition-colors">
                                                Cancelar
                                            </button>
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
                        <div className="glass rounded-3xl border border-charcoal-800 p-16 flex flex-col items-center justify-center text-center">
                            <Users className="text-charcoal-700 mb-4" size={48} />
                            <h3 className="text-xl font-display text-charcoal-500">Nenhum patrocinador ainda</h3>
                            <p className="text-charcoal-600 text-sm mt-2">Clique em "Adicionar" para cadastrar o primeiro.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {sponsors.map((sponsor, index) => (
                                <motion.div
                                    key={sponsor.id}
                                    layout
                                    className={`glass rounded-2xl border p-4 flex items-center gap-4 ${sponsor.is_active ? 'border-charcoal-800' : 'border-charcoal-800/50 opacity-60'}`}
                                >
                                    {/* Order Controls */}
                                    <div className="flex flex-col gap-1">
                                        <button onClick={() => moveOrder(index, -1)} disabled={index === 0} className="text-charcoal-600 hover:text-gold-500 disabled:opacity-20 transition-colors">▲</button>
                                        <GripVertical className="text-charcoal-700" size={16} />
                                        <button onClick={() => moveOrder(index, 1)} disabled={index === sponsors.length - 1} className="text-charcoal-600 hover:text-gold-500 disabled:opacity-20 transition-colors">▼</button>
                                    </div>

                                    {/* Logo */}
                                    <div className="w-20 h-14 bg-white/5 rounded-xl overflow-hidden flex items-center justify-center border border-charcoal-700 flex-shrink-0">
                                        <img src={sponsor.image_url} alt={sponsor.name} className="max-w-full max-h-full object-contain p-1" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold truncate">{sponsor.name}</p>
                                        {sponsor.website_url && (
                                            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-500/70 hover:text-gold-500 flex items-center gap-1 mt-0.5 truncate">
                                                <Globe size={10} />{sponsor.website_url}
                                            </a>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {sponsor.website_url && (
                                            <a href={sponsor.website_url} target="_blank" rel="noopener noreferrer" className="p-2 text-charcoal-500 hover:text-gold-500 transition-colors">
                                                <ExternalLink size={16} />
                                            </a>
                                        )}
                                        <button onClick={() => toggleActive(sponsor)} className={`p-2 transition-colors ${sponsor.is_active ? 'text-green-500 hover:text-green-400' : 'text-charcoal-600 hover:text-charcoal-400'}`}>
                                            {sponsor.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                                        </button>
                                        <button onClick={() => deleteSponsor(sponsor)} className="p-2 text-charcoal-600 hover:text-red-400 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default AdminSponsors
