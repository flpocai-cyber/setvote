import { useState, useEffect } from 'react'
import { X, Upload, FileText, Music, Loader2, Image as ImageIcon } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const SongModal = ({ isOpen, song, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        artist: '',
        lyrics: '',
        tone: '',
        bpm: '',
        category: '',
        is_active: true
    })
    const [files, setFiles] = useState({
        cover: null,
        sheet: null
    })
    const [loading, setLoading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(null)

    useEffect(() => {
        if (song) {
            setFormData({
                title: song.title || '',
                artist: song.artist || '',
                lyrics: song.lyrics || '',
                tone: song.tone || '',
                bpm: song.bpm || '',
                category: song.category || '',
                is_active: song.is_active ?? true
            })
        }
    }, [song])

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleFileChange = (e) => {
        const { name, files: selectedFiles } = e.target
        if (selectedFiles && selectedFiles[0]) {
            setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }))
        }
    }

    const uploadFile = async (file, bucket) => {
        if (!file) return null
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError, data } = await supabase.storage
            .from(bucket)
            .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath)

        return publicUrl
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            let cover_image_url = song?.cover_image_url
            let sheet_music_url = song?.sheet_music_url

            // Upload files if selected
            if (files.cover) {
                setUploadProgress('Fazendo upload da capa...')
                cover_image_url = await uploadFile(files.cover, 'covers')
            }
            if (files.sheet) {
                setUploadProgress('Fazendo upload da partitura...')
                sheet_music_url = await uploadFile(files.sheet, 'sheets')
            }

            setUploadProgress('Salvando dados...')

            const songData = {
                ...formData,
                cover_image_url,
                sheet_music_url,
                bpm: formData.bpm ? parseInt(formData.bpm) : null
            }

            if (song) {
                const { error } = await supabase
                    .from('songs')
                    .update(songData)
                    .eq('id', song.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('songs')
                    .insert([songData])
                if (error) throw error
            }

            onSave()
        } catch (err) {
            console.error('Error saving song:', err)
            alert('Erro ao salvar música: ' + err.message)
        } finally {
            setLoading(false)
            setUploadProgress(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-charcoal-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-charcoal-800 shadow-2xl relative">
                <button
                    onClick={onClose}
                    className="absolute right-6 top-6 text-charcoal-500 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                <form onSubmit={handleSubmit} className="p-8">
                    <h2 className="text-3xl font-display font-bold gold-gradient mb-8">
                        {song ? 'Editar Música' : 'Adicionar Nova Música'}
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Basic Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-charcoal-300 mb-2">Título da Música *</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                    placeholder="Ex: Yesterday"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-charcoal-300 mb-2">Artista / Compositor *</label>
                                <input
                                    type="text"
                                    name="artist"
                                    required
                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                    placeholder="Ex: The Beatles"
                                    value={formData.artist}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-300 mb-2">Tom</label>
                                    <input
                                        type="text"
                                        name="tone"
                                        className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50 text-center"
                                        placeholder="Am"
                                        value={formData.tone}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-300 mb-2">BPM</label>
                                    <input
                                        type="number"
                                        name="bpm"
                                        className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50 text-center"
                                        placeholder="120"
                                        value={formData.bpm}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-charcoal-300 mb-2">Gênero</label>
                                    <select
                                        name="category"
                                        className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="">Selecione</option>
                                        <option value="Rock">Rock</option>
                                        <option value="Pop">Pop</option>
                                        <option value="MPB">MPB</option>
                                        <option value="Sertanejo">Sertanejo</option>
                                        <option value="Jazz">Jazz</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3 bg-charcoal-800 p-4 rounded-xl border border-charcoal-700">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    name="is_active"
                                    className="w-5 h-5 accent-gold-500 rounded border-charcoal-600 bg-charcoal-900"
                                    checked={formData.is_active}
                                    onChange={handleChange}
                                />
                                <label htmlFor="is_active" className="text-charcoal-300 font-medium cursor-pointer">
                                    Disponível para votação do público
                                </label>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 border border-dashed border-charcoal-700 rounded-xl">
                                    <label className="block text-sm font-medium text-charcoal-400 mb-3 flex items-center space-x-2">
                                        <ImageIcon size={18} />
                                        <span>Capa da Música (JPG/PNG)</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="cover"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="text-xs text-charcoal-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold-500/10 file:text-gold-500 hover:file:bg-gold-500/20"
                                    />
                                </div>

                                <div className="p-4 border border-dashed border-charcoal-700 rounded-xl">
                                    <label className="block text-sm font-medium text-charcoal-400 mb-3 flex items-center space-x-2">
                                        <FileText size={18} />
                                        <span>Partitura (PDF)</span>
                                    </label>
                                    <input
                                        type="file"
                                        name="sheet"
                                        accept=".pdf"
                                        onChange={handleFileChange}
                                        className="text-xs text-charcoal-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-gold-500/10 file:text-gold-500 hover:file:bg-gold-500/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Lyrics */}
                        <div className="flex flex-col h-full">
                            <label className="block text-sm font-medium text-charcoal-300 mb-2">Letra da Música</label>
                            <textarea
                                name="lyrics"
                                className="flex-1 min-h-[400px] w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-gold-500/50 font-mono text-sm leading-relaxed"
                                placeholder="Cole a letra ou cifra aqui..."
                                value={formData.lyrics}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex items-center justify-end space-x-4 border-t border-charcoal-800 pt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 text-charcoal-400 hover:text-white transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="gold-bg-gradient text-charcoal-950 font-bold px-8 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>{uploadProgress || 'Favor aguarde...'}</span>
                                </>
                            ) : (
                                <span>{song ? 'Atualizar Música' : 'Salvar Música'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default SongModal
