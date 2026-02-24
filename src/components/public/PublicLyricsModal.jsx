import { X, FileText, Music, ExternalLink } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PublicLyricsModal = ({ song, onClose }) => {
    if (!song) return null

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-sm">
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="bg-charcoal-900 w-full max-w-2xl h-[90vh] sm:h-auto sm:max-h-[85vh] overflow-hidden rounded-t-[2.5rem] sm:rounded-[2.5rem] border border-charcoal-800 flex flex-col shadow-2xl"
            >
                <div className="p-8 flex items-start justify-between border-b border-charcoal-800">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-2xl bg-charcoal-800 flex-shrink-0 overflow-hidden border border-charcoal-700">
                            {song.cover_image_url ? (
                                <img src={song.cover_image_url} alt={song.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Music className="text-gold-500/50" /></div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-display font-bold text-white leading-tight">{song.title}</h2>
                            <p className="text-gold-500 font-medium">{song.artist}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-charcoal-800 rounded-full text-charcoal-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {song.lyrics ? (
                        <div className="whitespace-pre-line text-charcoal-300 leading-relaxed font-sans text-lg">
                            {song.lyrics}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-charcoal-600 italic">
                            <Info className="w-12 h-12 mb-4 opacity-20" />
                            <p>A letra desta música ainda não foi cadastrada.</p>
                        </div>
                    )}
                </div>


            </motion.div>
        </div>
    )
}

export default PublicLyricsModal
