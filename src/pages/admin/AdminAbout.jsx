import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import {
    Plus, Trash2, Upload, Loader2, Save,
    UserCircle, GripVertical, Image
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminAbout = () => {
    const { darkMode } = useTheme()
    const [aboutText, setAboutText] = useState('')
    const [photos, setPhotos] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingText, setSavingText] = useState(false)
    const [uploadingPhoto, setUploadingPhoto] = useState(false)
    const [profileId, setProfileId] = useState(null)
    const [newCaption, setNewCaption] = useState('')
    const [newFile, setNewFile] = useState(null)
    const [newPreview, setNewPreview] = useState(null)
    const fileRef = useRef(null)

    useEffect(() => { fetchData() }, [])

    const fetchData = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: profile } = await supabase.from('profiles').select('id, about_text').eq('id', user.id).single()
        if (profile) { setProfileId(profile.id); setAboutText(profile.about_text || '') }
        await fetchPhotos()
        setLoading(false)
    }

    const fetchPhotos = async () => {
        const { data } = await supabase.from('about_photos').select('*').order('display_order', { ascending: true })
        setPhotos(data || [])
    }

    const handleSaveText = async () => {
        if (!profileId) return
        setSavingText(true)
        const { error } = await supabase.from('profiles').update({ about_text: aboutText }).eq('id', profileId)
        if (error) alert('Erro ao salvar: ' + error.message)
        setSavingText(false)
    }

    const handleFileChange = (e) => {
        const f = e.target.files?.[0]
        if (f) { setNewFile(f); setNewPreview(URL.createObjectURL(f)) }
    }

    const handleAddPhoto = async () => {
        if (!newFile) { alert('Selecione uma foto.'); return }
        if (photos.length >= 50) { alert('Limite de 50 fotos atingido.'); return }
        setUploadingPhoto(true)
        try {
            const ext = newFile.name.split('.').pop()
            const path = `photo_${Date.now()}.${ext}`
            const { error: upErr } = await supabase.storage.from('about-photos').upload(path, newFile)
            if (upErr) throw upErr
            const { data: { publicUrl } } = supabase.storage.from('about-photos').getPublicUrl(path)
            const { error: insErr } = await supabase.from('about_photos').insert({ image_url: publicUrl, caption: newCaption, display_order: photos.length })
            if (insErr) throw insErr
            setNewFile(null); setNewPreview(null); setNewCaption('')
            if (fileRef.current) fileRef.current.value = ''
            await fetchPhotos()
        } catch (err) { alert('Erro ao adicionar foto: ' + err.message) }
        finally { setUploadingPhoto(false) }
    }

    const handleDeletePhoto = async (photo) => {
        if (!window.confirm('Remover esta foto?')) return
        const urlParts = photo.image_url.split('/about-photos/')
        if (urlParts[1]) await supabase.storage.from('about-photos').remove([urlParts[1]])
        await supabase.from('about_photos').delete().eq('id', photo.id)
        fetchPhotos()
    }

    const moveOrder = async (index, dir) => {
        const newPhotos = [...photos]
        const swap = index + dir
        if (swap < 0 || swap >= newPhotos.length) return;
        [newPhotos[index], newPhotos[swap]] = [newPhotos[swap], newPhotos[index]]
        const updates = newPhotos.map((p, i) => supabase.from('about_photos').update({ display_order: i }).eq('id', p.id))
        await Promise.all(updates)
        fetchPhotos()
    }

    const updateCaption = async (photo, caption) => {
        await supabase.from('about_photos').update({ caption }).eq('id', photo.id)
        setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption } : p))
    }

    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        section: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        sectionTitle: darkMode ? 'text-white' : 'text-gray-900',
        textarea: darkMode
            ? 'bg-charcoal-800 border-charcoal-700 text-white focus:border-gold-500/50'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gold-500/50',
        input: darkMode
            ? 'bg-charcoal-800 border-charcoal-700 text-white focus:border-gold-500/50'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gold-500/50',
        addPhotoBox: darkMode ? 'border-charcoal-700 bg-charcoal-900/50' : 'border-gray-200 bg-gray-50',
        addPhotoTitle: darkMode ? 'text-charcoal-300' : 'text-gray-600',
        photoCard: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        photoBg: darkMode ? 'bg-charcoal-800' : 'bg-gray-100',
        orderBtn: darkMode ? 'text-charcoal-600 hover:text-gold-500' : 'text-gray-400 hover:text-gold-500',
        grip: darkMode ? 'text-charcoal-700' : 'text-gray-300',
        deleteBtn: darkMode ? 'text-charcoal-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500',
        emptyText: darkMode ? 'text-charcoal-600' : 'text-gray-400',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto space-y-10">
                    <div>
                        <h1 className={`text-4xl font-display font-bold ${t.heading}`}>Sobre o Músico</h1>
                        <p className={`mt-1 ${t.sub}`}>Configure o texto de apresentação e a galeria de fotos.</p>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-gold-500" size={32} />
                        </div>
                    ) : (
                        <>
                            {/* Bio Text */}
                            <section className={`rounded-3xl p-8 border ${t.section}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <UserCircle className="text-gold-500" />
                                        <h2 className={`text-xl font-display font-bold ${t.sectionTitle}`}>Texto de Apresentação</h2>
                                    </div>
                                    <button onClick={handleSaveText} disabled={savingText}
                                        className="gold-bg-gradient text-charcoal-950 font-bold px-6 py-2.5 rounded-xl flex items-center space-x-2 disabled:opacity-50 hover:scale-[1.02] transition-all">
                                        {savingText ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                        <span>Salvar</span>
                                    </button>
                                </div>
                                <p className={`text-sm mb-4 ${t.sub}`}>Escreva sobre sua trajetória. Emojis são bem-vindos! 🎸🎵</p>
                                <textarea value={aboutText} onChange={e => setAboutText(e.target.value)} rows={10}
                                    placeholder="Escreva sobre você, sua história, experiências..."
                                    className={`w-full border rounded-2xl py-4 px-5 focus:outline-none resize-y text-sm leading-relaxed transition-all ${t.textarea}`} />
                            </section>

                            {/* Photos */}
                            <section className={`rounded-3xl p-8 border ${t.section}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center space-x-3">
                                        <Image className="text-gold-500" />
                                        <h2 className={`text-xl font-display font-bold ${t.sectionTitle}`}>Galeria de Fotos</h2>
                                    </div>
                                    <span className={`text-sm ${t.sub}`}>{photos.length}/50 fotos</span>
                                </div>

                                {photos.length < 50 && (
                                    <div className={`mb-8 p-6 rounded-2xl border border-dashed ${t.addPhotoBox}`}>
                                        <h3 className={`text-sm font-semibold mb-4 uppercase tracking-wider ${t.addPhotoTitle}`}>Adicionar Nova Foto</h3>
                                        <div className="flex flex-col sm:flex-row gap-4">
                                            <div onClick={() => fileRef.current?.click()}
                                                className={`w-full sm:w-40 h-32 border-2 border-dashed hover:border-gold-500/50 rounded-xl flex items-center justify-center cursor-pointer transition-colors overflow-hidden flex-shrink-0 ${darkMode ? 'border-charcoal-700' : 'border-gray-300'}`}>
                                                {newPreview ? (
                                                    <img src={newPreview} alt="preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className={`flex flex-col items-center ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`}>
                                                        <Upload size={24} />
                                                        <p className="text-xs mt-1">Selecionar foto</p>
                                                    </div>
                                                )}
                                            </div>
                                            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                            <div className="flex-1 flex flex-col gap-3">
                                                <textarea value={newCaption} onChange={e => setNewCaption(e.target.value)} rows={3}
                                                    placeholder="Legenda da foto (ex: 🎸 Com Roberto Carlos — São Paulo, 2023)"
                                                    className={`w-full border rounded-xl py-3 px-4 text-sm focus:outline-none resize-none transition-all ${t.textarea}`} />
                                                <button onClick={handleAddPhoto} disabled={uploadingPhoto || !newFile}
                                                    className="gold-bg-gradient text-charcoal-950 font-bold py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50 transition-all hover:scale-[1.02] self-start">
                                                    {uploadingPhoto ? <Loader2 className="animate-spin" size={16} /> : <Plus size={16} />}
                                                    <span>Adicionar Foto</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {photos.length === 0 ? (
                                    <div className={`text-center py-12 ${t.emptyText}`}>
                                        <Image size={40} className="mx-auto mb-3 opacity-30" />
                                        <p>Nenhuma foto ainda. Adicione a primeira acima!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <AnimatePresence>
                                            {photos.map((photo, index) => (
                                                <motion.div key={photo.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                                                    className={`rounded-2xl border p-4 flex items-center gap-4 ${t.photoCard}`}>
                                                    <div className="flex flex-col gap-1 flex-shrink-0">
                                                        <button onClick={() => moveOrder(index, -1)} disabled={index === 0} className={`disabled:opacity-20 transition-colors text-sm ${t.orderBtn}`}>▲</button>
                                                        <GripVertical className={t.grip} size={16} />
                                                        <button onClick={() => moveOrder(index, 1)} disabled={index === photos.length - 1} className={`disabled:opacity-20 transition-colors text-sm ${t.orderBtn}`}>▼</button>
                                                    </div>
                                                    <div className={`w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 ${t.photoBg}`}>
                                                        <img src={photo.image_url} alt={photo.caption} className="w-full h-full object-cover" />
                                                    </div>
                                                    <input type="text" value={photo.caption || ''} onChange={e => updateCaption(photo, e.target.value)}
                                                        placeholder="Legenda..."
                                                        className={`flex-1 border rounded-xl py-2 px-3 text-sm focus:outline-none transition-all ${t.input}`} />
                                                    <button onClick={() => handleDeletePhoto(photo)} className={`p-2 transition-colors flex-shrink-0 ${t.deleteBtn}`}>
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
            </div>
        </AdminLayout>
    )
}

export default AdminAbout
