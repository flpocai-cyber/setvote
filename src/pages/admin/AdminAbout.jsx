import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import {
    Music, LayoutDashboard, Settings, LogOut,
    Plus, Trash2, Upload, Loader2, Save, Users,
    UserCircle, GripVertical, Image, BarChart2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const AdminAbout = () => {
    const [aboutText, setAboutText] = useState('')
    const [photos, setPhotos] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingText, setSavingText] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [profileId, setProfileId] = useState(null)

    // New photo form
    const [newCaption, setNewCaption] = useState('')
    const [newFile, setNewFile] = useState(null)
    const [newPreview, setNewPreview] = useState(null)
    const fileRef = useRef(null)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch profile (about_text)
        const { data: profile } = await supabase
            .from('profiles')
            .select('id, about_text')
            .eq('id', user.id)
            .single()

        if (profile) {
            setProfileId(profile.id)
            setAboutText(profile.about_text || '')
        }

        // Fetch photos
        await fetchPhotos()
        setLoading(false)
    }

    const fetchPhotos = async () => {
        const { data } = await supabase
            .from('about_photos')
            .select('*')
            .order('display_order', { ascending: true })
        setPhotos(data || [])
    }

    const handleSaveText = async () => {
        if (!profileId) return
        setSavingText(true)
        const { error } = await supabase
            .from('profiles')
            .update({ about_text: aboutText })
            .eq('id', profileId)
        if (error) alert('Erro ao salvar: ' + error.message)
        setSavingText(false)
    }

    const handleFileChange = (e) => {
        const f = e.target.files?.[0]
        if (f) {
            setNewFile(f)
            setNewPreview(URL.createObjectURL(f))
        }
    }

    const handleAddPhoto = async () => {
        if (!newFile) { alert('Selecione uma foto.'); return }
        if (photos.length >= 20) { alert('Limite de 20 fotos atingido.'); return }
        setUploadingPhoto(true)
        try {
            const ext = newFile.name.split('.').pop()
            const path = `photo_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('about-photos').upload(path, newFile)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('about-photos').getPublicUrl(path)
            const { error: insErr } = await supabase.from('about_photos').insert({
                image_url: publicUrl,
                caption: newCaption,
                display_order: photos.length
            })
            if (insErr) throw insErr
            setNewFile(null)
            setNewPreview(null)
            setNewCaption('')
            if (fileRef.current) fileRef.current.value = ''
            await fetchPhotos()
        } catch (err) {
            alert('Erro ao adicionar foto: ' + err.message)
        } finally {
            setUploadingPhoto(false)
        }
    }

    const handleDeletePhoto = async (photo) => {
        if (!window.confirm('Remover esta foto?')) return
        const urlParts = photo.image_url.split('/about-photos/')
        if (urlParts[1]) {
            await supabase.storage.from('about-photos').remove([urlParts[1]])
        }
        await supabase.from('about_photos').delete().eq('id', photo.id)
        fetchPhotos()
    }

    const moveOrder = async (index, dir) => {
        const newPhotos = [...photos]
        const swap = index + dir
        if (swap < 0 || swap >= newPhotos.length) return
            ;[newPhotos[index], newPhotos[swap]] = [newPhotos[swap], newPhotos[index]]
        const updates = newPhotos.map((p, i) =>
            supabase.from('about_photos').update({ display_order: i }).eq('id', p.id)
        )
        await Promise.all(updates)
        fetchPhotos()
    }

    const updateCaption = async (photo, caption) => {
        await supabase.from('about_photos').update({ caption }).eq('id', photo.id)
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption } : p))
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
                    <Link to="/admin/patrocinadores" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Users size={20} /><span>Patrocinadores</span>
                    </Link>
                    <Link to="/admin/sobre" className="flex items-center space-x-3 text-gold-500 bg-gold-500/10 px-4 py-3 rounded-xl transition-all">
                        <UserCircle size={20} /><span>Sobre o Músico</span>
                    </Link>
                    <Link to="/admin/estatisticas" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <BarChart2 size={20} /><span>Estatísticas</span>
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
                <div className="max-w-4xl mx-auto space-y-10">

                    {/* Header */}
                    <div>
                        <h1 className="text-4xl font-display font-bold text-white">Sobre o Músico</h1>
                        <p className="text-charcoal-400 mt-1">Configure o texto de apresentação e a galeria de fotos.</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-gold-500" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* ── Bio Text ── */}
                            <section className="glass rounded-3xl p-8 border border-charcoal-800">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <UserCircle className="text-gold-500" />
                                        <h2 className="text-xl font-display font-bold text-white">Texto de Apresentação</h2>
                                    </div>
                                    <button
                                        onClick={handleSaveText}
                                        disabled={savingText}
                                        className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50 hover:scale-[1.02] transition-all"
                                    >
                                        {savingText ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        <span>Salvar</span>
                                    </button>
                                </div>
                                <p className="text-sm text-charcoal-400 mb-4">Escreva sobre sua trajetória. Emojis são bem-vindos! 🎸🎵</p>
                                <textarea
                                    value={aboutText}
                                    onChange={e => setAboutText(e.target.value)}
                                    rows={10}
                                    placeholder="Escreva sobre você, sua história, experiências..."
                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-gold-500/50 resize-y text-sm leading-relaxed"
                                />
                            </section>

                            {/* ── Photos ── */}
                            <section className="glass rounded-3xl p-8 border border-charcoal-800">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <Image className="text-gold-500" />
                                        <h2 className="text-xl font-display font-bold text-white">Galeria de Fotos</h2>
                                    </div>
                                    <span className="text-sm text-charcoal-500">{photos.length}/20 fotos</span>
                                </div>

                                {/* Add Photo Form */}
                                {photos.length < 20 && (
                                    <div className="mb-8 p-6 rounded-2xl border border-dashed border-charcoal-700 bg-charcoal-900/50">
                                        <h3 className="text-sm font-semibold text-charcoal-300 mb-4 uppercase tracking-wider">Adicionar Nova Foto</h3>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            {/* Foto */}
                                            <div
                                                onClick={() => fileRef.current?.click()}
                                                className="w-full sm:w-40 h-32 border-2 border-dashed border-charcoal-700 hover:border-gold-500/50 rounded-xl flex items-center justify-center cursor-pointer transition-colors overflow-hidden flex-shrink-0"
                                            >
                                                {newPreview ? (
                                                    <img src={newPreview} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center text-charcoal-600">
                                                        <Upload size={24} />
                                                        <p className="text-xs mt-1">Selecionar foto</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                                            {/* Legenda + Botão */}
                                            <div className="flex-1 flex flex-col gap-3">
                                                <textarea
                                                    value={newCaption}
                                                    onChange={e => setNewCaption(e.target.value)}
                                                    rows={3}
                                                    placeholder="Legenda da foto (ex: 🎸 Com Roberto Carlos — São Paulo, 2023)"
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-gold-500/50 resize-none"
                                                />
                                                <button
                                                    onClick={handleAddPhoto}
                                                    disabled={uploadingPhoto || !newFile}
                                                    className="gold-bg-gradient text-charcoal-950 font-bold py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 transition-all hover:scale-[1.02] self-start"
                                                >
                                                    {uploadingPhoto ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                    <span>Adicionar Foto</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Photos List */}
                                {photos.length === 0 ? (
                                    <div className="text-center py-12 text-charcoal-600">
                                        <Image size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>Nenhuma foto ainda. Adicione a primeira acima!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {photos.map((photo, index) => (
                                                <motion.div
                                                    key={photo.id}
                                                    layout
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="glass rounded-2xl border border-charcoal-800 p-4 flex items-center gap-4"
                                                >
                                                    {/* Order */}
                                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                                        <button onClick={() => moveOrder(index, -1)} disabled={index === 0} className="text-charcoal-600 hover:text-gold-500 disabled:opacity-20 transition-colors text-sm">▲</button>
                                                        <GripVertical className="text-charcoal-700" size={16} />
                                                        <button onClick={() => moveOrder(index, 1)} disabled={index === photos.length - 1} className="text-charcoal-600 hover:text-gold-500 disabled:opacity-20 transition-colors text-sm">▼</button>
                                                    </div>

                                                    {/* Thumbnail */}
                                                    <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-charcoal-800">
                                                        <img src={photo.image_url} alt={photo.caption} className="w-full h-full object-cover" />
                                                    </div>

                                                    {/* Caption editable */}
                                                    <input
                                                        type="text"
                                                        value={photo.caption || ''}
                                                        onChange={e => updateCaption(photo, e.target.value)}
                                                        placeholder="Legenda..."
                                                        className="flex-1 bg-charcoal-800 border border-charcoal-700 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-gold-500/50"
                                                    />

                                                    {/* Delete */}
                                                    <button
                                                        onClick={() => handleDeletePhoto(photo)}
                                                        className="p-2 text-charcoal-600 hover:text-red-400 transition-colors flex-shrink-0"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}

export default AdminAbout
