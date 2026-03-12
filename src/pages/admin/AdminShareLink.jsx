import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useTheme } from '../../context/ThemeContext'
import { Share2, Copy, RefreshCw, Trash2, Eye, Link as LinkIcon } from 'lucide-react'
import AdminLayout from '../../components/admin/AdminLayout'

const STORAGE_KEY = 'musician_share_token'

const AdminShareLink = () => {
    const { darkMode } = useTheme()
    const [token, setToken] = useState(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const savedToken = localStorage.getItem(STORAGE_KEY)
        if (savedToken) setToken(savedToken)
    }, [])

    const generateToken = () => {
        if (token && !window.confirm('Existe um link ativo. Deseja gerar um NOVO link e revogar o antigo?')) return
        const newToken = crypto.randomUUID()
        localStorage.setItem(STORAGE_KEY, newToken)
        setToken(newToken); setCopied(false)
    }

    const copyLink = () => {
        if (!token) return
        const url = `${window.location.origin}/setlist/${token}`
        navigator.clipboard.writeText(url)
            .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
            .catch(() => alert('Não foi possível copiar o link.'))
    }

    const revokeToken = () => {
        if (window.confirm('Tem certeza? Isso fará com que o link atual pare de funcionar imediatamente para todos os músicos.')) {
            localStorage.removeItem(STORAGE_KEY); setToken(null); setCopied(false)
        }
    }

    const publicUrl = token ? `${window.location.origin}/setlist/${token}` : ''

    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        card: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        infoCard: darkMode ? 'bg-charcoal-900 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        cardTitle: darkMode ? 'text-white' : 'text-gray-900',
        inputBg: darkMode ? 'bg-charcoal-900 border-charcoal-700 text-charcoal-300' : 'bg-gray-50 border-gray-200 text-gray-700',
        btn: darkMode ? 'border-charcoal-700 text-charcoal-300 hover:text-white hover:bg-charcoal-800' : 'border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100',
        listDot: darkMode ? 'bg-charcoal-800 text-charcoal-400' : 'bg-gray-100 text-gray-500',
        listTitle: darkMode ? 'text-white' : 'text-gray-900',
        listSub: darkMode ? 'text-charcoal-500' : 'text-gray-500',
        divider: darkMode ? 'border-charcoal-800' : 'border-gray-100',
        previewBtn: darkMode ? 'bg-charcoal-800 text-white hover:bg-gold-500 hover:text-black' : 'bg-gray-100 text-gray-700 hover:bg-gold-500 hover:text-black',
        noTokenBg: darkMode ? 'bg-charcoal-800/50 text-charcoal-400 border-charcoal-700' : 'bg-gray-100 text-gray-500 border-gray-200',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-10">
                        <h1 className={`text-4xl font-display font-bold mb-3 ${t.heading}`}>Link para Músicos</h1>
                        <p className={`text-lg ${t.sub}`}>Gere um link especial para seus músicos acompanharem a setlist em tempo real.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Status Card */}
                        <div className={`rounded-3xl p-8 border-2 ${t.card}`}>
                            <div className="w-14 h-14 rounded-2xl bg-gold-500/10 flex items-center justify-center mb-6">
                                <LinkIcon className="text-gold-500 w-7 h-7" />
                            </div>
                            <h2 className={`text-2xl font-display font-bold mb-2 ${t.cardTitle}`}>Status do Link</h2>

                            {token ? (
                                <div className="space-y-6">
                                    <div className="bg-green-500/10 text-green-400 px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                        Link Ativo e Funcionando
                                    </div>
                                    <div className="space-y-3">
                                        <label className={`text-xs font-bold uppercase tracking-wider ${t.sub}`}>Compartilhe este link:</label>
                                        <div className={`flex border rounded-xl overflow-hidden p-1 ${t.inputBg}`}>
                                            <input type="text" readOnly value={publicUrl} className="bg-transparent border-none w-full px-4 outline-none text-sm font-mono" />
                                            <button onClick={copyLink} className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shrink-0 ${copied ? 'bg-green-500/20 text-green-400' : 'gold-bg-gradient text-charcoal-950 hover:opacity-90'}`}>
                                                <Copy size={16} />
                                                {copied ? 'Copiado!' : 'Copiar'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className={`flex flex-wrap gap-3 pt-4 border-t ${t.divider}`}>
                                        <button onClick={generateToken} className={`px-5 py-3 rounded-xl font-medium text-sm border transition-all flex items-center gap-2 ${t.btn}`}>
                                            <RefreshCw size={16} /> Gerar Novo Link
                                        </button>
                                        <button onClick={revokeToken} className="px-5 py-3 rounded-xl font-medium text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-2 ml-auto">
                                            <Trash2 size={16} /> Revogar Link
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className={`px-4 py-3 rounded-xl font-medium flex items-center gap-2 border border-dashed ${t.noTokenBg}`}>
                                        Nenhum link ativo no momento
                                    </div>
                                    <p className={`text-sm leading-relaxed ${t.sub}`}>
                                        Ao gerar um link, seus músicos poderão abrir a página no celular e ver a setlist sendo atualizada ao vivo conforme você toca as músicas.
                                    </p>
                                    <button onClick={generateToken} className="w-full gold-bg-gradient text-charcoal-950 font-bold px-6 py-4 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                        <Share2 size={20} /> Gerar Link para Músicos
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Info Card */}
                        <div className={`rounded-3xl p-8 border ${t.infoCard}`}>
                            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${t.cardTitle}`}>
                                <Eye className="text-gold-500" /> O que os músicos vêem?
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    { n: 1, t: 'Acesso Direto (Sem Login)', d: 'Os músicos não precisam criar conta nem fazer login. É só clicar no link e a tela abre.' },
                                    { n: 2, t: 'Setlist ao Vivo', d: 'A lista de músicas atualiza automaticamente para eles assim que você marca como tocada.' },
                                    { n: 3, t: 'Links de Partituras', d: 'Eles podem abrir as partituras em PDF ou link externo diretamente da lista.' },
                                    { n: 4, t: '100% Seguro', d: 'A tela deles é somente leitura. Não há botões para editar, excluir ou marcar músicas.' },
                                ].map(item => (
                                    <li key={item.n} className="flex gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${t.listDot}`}>{item.n}</div>
                                        <div>
                                            <p className={`font-medium mb-1 ${t.listTitle}`}>{item.t}</p>
                                            <p className={`text-sm ${t.listSub}`}>{item.d}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                            {token && (
                                <div className={`mt-8 pt-6 border-t ${t.divider}`}>
                                    <a href={publicUrl} target="_blank" rel="noreferrer"
                                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium transition-colors ${t.previewBtn}`}>
                                        <Eye size={18} /> Ver Preview da Tela
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminShareLink
