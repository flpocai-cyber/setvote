import { useState, useRef } from 'react'
import { X, Copy, Upload, Loader2, Check, Search, Music } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../../lib/supabase'

const DedicateModal = ({ isOpen, onClose, profile, songs = [] }) => {
    const [form, setForm] = useState({ name: '', phone: '', message: '' })
    const [selectedSong, setSelectedSong] = useState(null)
    const [receiptFile, setReceiptFile] = useState(null)
    const [receiptUploading, setReceiptUploading] = useState(false)
    const [receiptUrl, setReceiptUrl] = useState(null)
    const [receiptName, setReceiptName] = useState(null)
    const [search, setSearch] = useState('')
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [pixCopied, setPixCopied] = useState(false)
    const fileRef = useRef(null)

    const price = profile?.dedication_price ?? 10
    const pixKey = profile?.pix_key || ''

    const filteredSongs = songs.filter(s =>
        s.title?.toLowerCase().includes(search.toLowerCase()) ||
        s.artist?.toLowerCase().includes(search.toLowerCase())
    )

    const canSubmit = form.name.trim() && form.phone.trim() && receiptUrl && selectedSong

    const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

    const copyPix = () => {
        if (!pixKey) return
        navigator.clipboard.writeText(pixKey)
        setPixCopied(true)
        setTimeout(() => setPixCopied(false), 2000)
    }

    const handleReceiptChange = async (e) => {
        const f = e.target.files?.[0]
        if (!f) return
        setReceiptUploading(true)
        try {
            const ext = f.name.split('.').pop()
            const path = `receipt_${Date.now()}.${ext}`
            const { error } = await supabase.storage.from('dedications').upload(path, f)
            if (error) throw error
            const { data: { publicUrl } } = supabase.storage.from('dedications').getPublicUrl(path)
            setReceiptUrl(publicUrl)
            setReceiptName(f.name)
        } catch (err) {
            alert('Erro ao enviar comprovante: ' + err.message)
        } finally {
            setReceiptUploading(false)
        }
    }

    const handleSubmit = async () => {
        if (!canSubmit) return
        setSending(true)
        try {
            const { error } = await supabase.from('dedications').insert({
                song_id: selectedSong.id,
                song_title: selectedSong.title,
                song_artist: selectedSong.artist,
                name: form.name.trim(),
                phone: form.phone.trim(),
                message: form.message.trim(),
                receipt_url: receiptUrl,
            })
            if (error) throw error
            setSent(true)
        } catch (err) {
            alert('Erro ao enviar: ' + err.message)
        } finally {
            setSending(false)
        }
    }

    const handleClose = () => {
        setForm({ name: '', phone: '', message: '' })
        setSelectedSong(null)
        setReceiptFile(null)
        setReceiptUrl(null)
        setReceiptName(null)
        setSearch('')
        setSent(false)
        onClose()
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                        className="relative w-full sm:max-w-md bg-charcoal-950 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-charcoal-700 flex flex-col max-h-[92vh]"
                    >
                        {/* Close */}
                        <button onClick={handleClose}
                            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-charcoal-800 hover:bg-charcoal-700 flex items-center justify-center text-charcoal-400 hover:text-white transition-all">
                            <X size={16} />
                        </button>

                        {sent ? (
                            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                                    <Check className="text-green-500" size={32} />
                                </div>
                                <h2 className="text-2xl font-display font-bold text-white mb-2">Dedicação enviada! 🎵</h2>
                                <p className="text-charcoal-400 text-sm">Sua música será tocada em breve. Obrigado!</p>
                                <button onClick={handleClose} className="mt-8 gold-bg-gradient text-charcoal-950 font-bold px-8 py-3 rounded-xl">Fechar</button>
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="px-6 pt-6 pb-4 border-b border-charcoal-800 flex-shrink-0">
                                    <h2 className="text-3xl font-display font-black text-white leading-tight">💝 Dedique<br />uma Canção</h2>
                                    <div className="flex items-center gap-3 mt-3">
                                        <p className="text-2xl font-bold text-gold-500">
                                            R$ {Number(price).toFixed(2).replace('.', ',')}
                                        </p>
                                        {pixKey && (
                                            <button onClick={copyPix}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${pixCopied
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/40'
                                                    : 'bg-charcoal-800 text-charcoal-300 hover:text-white border border-charcoal-700 hover:border-charcoal-600'
                                                }`}>
                                                {pixCopied ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar PIX</>}
                                            </button>
                                        )}
                                    </div>
                                    {pixKey && (
                                        <p className="text-xs text-charcoal-500 mt-1 font-mono truncate">{pixKey}</p>
                                    )}
                                </div>

                                {/* Scrollable body */}
                                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                                    {/* Message */}
                                    <div>
                                        <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Mensagem</label>
                                        <textarea
                                            name="message"
                                            rows={3}
                                            value={form.message}
                                            onChange={handleChange}
                                            placeholder="Ex: Para a minha amada no nosso aniversário..."
                                            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-4 py-3 text-white text-sm placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50 resize-none"
                                        />
                                    </div>

                                    {/* Name + Phone */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Nome *</label>
                                            <input
                                                name="name" type="text" required
                                                value={form.name} onChange={handleChange}
                                                placeholder="Seu nome"
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-3 text-white text-sm placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Telefone *</label>
                                            <input
                                                name="phone" type="tel" required
                                                value={form.phone} onChange={handleChange}
                                                placeholder="(11) 99999-9999"
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl px-3 py-3 text-white text-sm placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50"
                                            />
                                        </div>
                                    </div>

                                    {/* Receipt upload */}
                                    <div>
                                        <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">Comprovante PIX *</label>
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-xl border-2 border-dashed transition-all text-sm font-medium ${receiptUrl
                                                ? 'border-green-500/40 bg-green-500/5 text-green-400'
                                                : 'border-charcoal-700 hover:border-gold-500/40 text-charcoal-400 hover:text-white'
                                            }`}
                                        >
                                            {receiptUploading ? (
                                                <><Loader2 className="animate-spin" size={16} /> Enviando...</>
                                            ) : receiptUrl ? (
                                                <><Check size={16} /> {receiptName || 'Comprovante anexado'}</>
                                            ) : (
                                                <><Upload size={16} /> Anexar comprovante (PDF ou imagem)</>
                                            )}
                                        </button>
                                        <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleReceiptChange} />
                                    </div>

                                    {/* Song list */}
                                    <div>
                                        <label className="block text-xs font-semibold text-charcoal-400 uppercase tracking-wider mb-2">
                                            Escolha a Música *
                                            {selectedSong && <span className="ml-2 text-gold-500 normal-case font-normal tracking-normal">— {selectedSong.title}</span>}
                                        </label>
                                        <div className="relative mb-2">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-500" />
                                            <input
                                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                                placeholder="Pesquisar música ou artista..."
                                                className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl pl-8 pr-4 py-2.5 text-sm text-white placeholder-charcoal-600 focus:outline-none focus:border-gold-500/50"
                                            />
                                        </div>
                                        <div className="space-y-2 max-h-52 overflow-y-auto pr-1 custom-scrollbar">
                                            {filteredSongs.map(song => {
                                                const isSelected = selectedSong?.id === song.id
                                                return (
                                                    <button
                                                        key={song.id}
                                                        type="button"
                                                        onClick={() => setSelectedSong(isSelected ? null : song)}
                                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isSelected
                                                            ? 'border-gold-500 bg-gold-500/10'
                                                            : 'border-charcoal-700 bg-charcoal-800/50 hover:border-charcoal-600'
                                                        }`}
                                                    >
                                                        {song.image_url ? (
                                                            <img src={song.image_url} alt={song.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-lg bg-charcoal-700 flex items-center justify-center flex-shrink-0">
                                                                <Music size={16} className="text-charcoal-500" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className={`font-semibold text-sm truncate ${isSelected ? 'text-gold-400' : 'text-white'}`}>{song.title}</p>
                                                            {song.artist && <p className="text-xs text-charcoal-500 truncate">{song.artist}</p>}
                                                        </div>
                                                        {isSelected && <Check size={16} className="text-gold-500 flex-shrink-0" />}
                                                    </button>
                                                )
                                            })}
                                            {filteredSongs.length === 0 && (
                                                <p className="text-center text-charcoal-600 py-4 text-sm">Nenhuma música encontrada</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="px-6 pb-6 pt-3 border-t border-charcoal-800 flex-shrink-0">
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!canSubmit || sending}
                                        className="w-full gold-bg-gradient text-charcoal-950 font-black py-4 rounded-2xl text-base shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {sending ? <Loader2 className="animate-spin" size={20} /> : '💝'}
                                        {sending ? 'Enviando...' : 'Enviar Dedicação'}
                                    </button>
                                    {!canSubmit && (
                                        <p className="text-center text-xs text-charcoal-600 mt-2">
                                            Preencha nome, telefone, comprovante e escolha uma música
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}

export default DedicateModal
