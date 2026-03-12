import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import {
    Settings, User, QrCode, Music,
    Save, Loader2, Camera, Download, CreditCard, Share2
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import AdminLayout from '../../components/admin/AdminLayout'

const AdminSettings = () => {
    const { user } = useAuth()
    const { darkMode } = useTheme()
    const [profile, setProfile] = useState({
        musician_name: '', welcome_text: '', voting_active: true,
        profile_image_url: '', pix_key: '', pix_name: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [file, setFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    useEffect(() => { fetchProfile() }, [user])

    const fetchProfile = async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        if (error && error.code !== 'PGRST116') console.error('Error fetching profile:', error)
        else if (data) setProfile(data)
        setLoading(false)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setProfile(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    }

    const handleFileChange = (e) => {
        if (e.target.files?.[0]) {
            const selected = e.target.files[0]
            setFile(selected)
            setPreviewUrl(URL.createObjectURL(selected))
        }
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            let profile_image_url = profile.profile_image_url
            if (file) {
                const fileExt = file.name.split('.').pop()
                const fileName = `${user.id}.${fileExt}`
                const { error: uploadError } = await supabase.storage.from('profiles').upload(fileName, file, { upsert: true })
                if (uploadError) throw uploadError
                const { data: { publicUrl } } = supabase.storage.from('profiles').getPublicUrl(fileName)
                profile_image_url = publicUrl
            }
            const { error } = await supabase.from('profiles').upsert({
                id: user.id, musician_name: profile.musician_name, welcome_text: profile.welcome_text,
                voting_active: profile.voting_active, profile_image_url, pix_key: profile.pix_key,
                pix_name: profile.pix_name, updated_at: new Date()
            })
            if (error) throw error
            alert('Perfil atualizado com sucesso!')
        } catch (err) {
            alert('Erro ao salvar perfil: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const publicUrl = window.location.origin

    // Theme helpers
    const t = {
        heading: darkMode ? 'text-white' : 'text-gray-900',
        section: darkMode ? 'bg-charcoal-900/40 border-charcoal-800' : 'bg-white border-gray-200 shadow-sm',
        sectionTitle: darkMode ? 'text-white' : 'text-gray-900',
        label: darkMode ? 'text-charcoal-400' : 'text-gray-600',
        input: darkMode
            ? 'bg-charcoal-800 border-charcoal-700 text-white focus:border-gold-500/50'
            : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-gold-500/50',
        sub: darkMode ? 'text-charcoal-400' : 'text-gray-500',
        divider: darkMode ? 'border-charcoal-800' : 'border-gray-100',
        toggleTrack: darkMode ? 'bg-charcoal-800' : 'bg-gray-200',
        toggleLabel: darkMode ? 'text-charcoal-300' : 'text-gray-700',
        infoCard: darkMode ? 'bg-charcoal-900/50 border-charcoal-800' : 'bg-gray-50 border-gray-200',
    }

    return (
        <AdminLayout>
            <div className="p-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className={`text-4xl font-display font-bold mb-10 ${t.heading}`}>Configurações</h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Profile Form */}
                        <div className="md:col-span-2 space-y-8">
                            <section className={`rounded-3xl p-8 border ${t.section}`}>
                                <div className="flex items-center space-x-3 mb-8">
                                    <User className="text-gold-500" />
                                    <h2 className={`text-xl font-display font-bold ${t.sectionTitle}`}>Perfil do Músico</h2>
                                </div>

                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="relative group">
                                            <div className={`w-32 h-32 rounded-3xl border-2 overflow-hidden flex items-center justify-center relative ${darkMode ? 'bg-charcoal-800 border-charcoal-700' : 'bg-gray-100 border-gray-200'}`}>
                                                {(previewUrl || profile.profile_image_url) ? (
                                                    <img src={previewUrl || profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className={`w-12 h-12 ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`} />
                                                )}
                                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <Camera className="text-white" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                            </div>
                                            <p className={`text-[10px] mt-2 text-center uppercase tracking-wider ${darkMode ? 'text-charcoal-500' : 'text-gray-400'}`}>
                                                {previewUrl ? '✓ Foto selecionada' : 'Alterar Foto'}
                                            </p>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${t.label}`}>Nome do Músico / Banda</label>
                                                <input type="text" name="musician_name"
                                                    className={`w-full border rounded-xl py-3 px-4 focus:outline-none transition-all ${t.input}`}
                                                    value={profile.musician_name} onChange={handleChange} placeholder="Ex: João e Banda" />
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-2 ${t.label}`}>Texto de Boas-vindas</label>
                                                <textarea name="welcome_text" rows="3"
                                                    className={`w-full border rounded-xl py-3 px-4 focus:outline-none resize-none transition-all ${t.input}`}
                                                    value={profile.welcome_text} onChange={handleChange} placeholder="Olá! Vote na sua música favorita..." />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`pt-6 border-t flex items-center justify-between ${t.divider}`}>
                                        <div className="flex items-center space-x-3">
                                            <div className={`relative inline-block w-12 h-6 rounded-full ${t.toggleTrack}`}>
                                                <input type="checkbox" name="voting_active" id="voting_active"
                                                    className="absolute w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer peer checked:translate-x-6 transition-all"
                                                    style={{ borderColor: darkMode ? '#2a2a2a' : '#e5e7eb' }}
                                                    checked={profile.voting_active} onChange={handleChange} />
                                                <label htmlFor="voting_active" className={`absolute inset-0 rounded-full cursor-pointer transition-colors ${profile.voting_active ? 'bg-green-500' : darkMode ? 'bg-charcoal-800' : 'bg-gray-300'}`}></label>
                                            </div>
                                            <span className={`text-sm font-medium ${t.toggleLabel}`}>Votação Pública Ativa</span>
                                        </div>
                                        <button type="submit" disabled={saving}
                                            className="gold-bg-gradient text-charcoal-950 font-bold px-8 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50">
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            <span>Salvar Alterações</span>
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* PIX */}
                            <section className={`rounded-3xl p-8 border ${t.section}`}>
                                <div className="flex items-center space-x-3 mb-6">
                                    <CreditCard className="text-gold-500" />
                                    <h2 className={`text-xl font-display font-bold ${t.sectionTitle}`}>Couvert Artístico (PIX)</h2>
                                </div>
                                <p className={`text-sm mb-6 leading-relaxed ${t.sub}`}>
                                    Os visitantes poderão clicar em <strong className={darkMode ? 'text-charcoal-300' : 'text-gray-700'}>"Couvert Artístico"</strong> e ver sua chave PIX para fazer uma doação.
                                </p>
                                <div className="space-y-5">
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${t.label}`}>Chave PIX</label>
                                        <input type="text" name="pix_key"
                                            className={`w-full border rounded-xl py-3 px-4 focus:outline-none transition-all ${t.input}`}
                                            value={profile.pix_key || ''} onChange={handleChange} placeholder="CPF, e-mail, telefone ou chave aleatória" />
                                    </div>
                                    <div>
                                        <label className={`block text-sm font-medium mb-2 ${t.label}`}>Nome do Recebedor</label>
                                        <input type="text" name="pix_name"
                                            className={`w-full border rounded-xl py-3 px-4 focus:outline-none transition-all ${t.input}`}
                                            value={profile.pix_name || ''} onChange={handleChange} placeholder="Ex: Rinaldo Zamai" />
                                    </div>
                                    <p className={`text-xs ${darkMode ? 'text-charcoal-600' : 'text-gray-400'}`}>Clique em "Salvar Alterações" acima para aplicar.</p>
                                </div>
                            </section>
                        </div>

                        {/* QR Code */}
                        <div className="space-y-8">
                            <section className={`rounded-3xl p-8 border ${t.section}`}>
                                <div className="flex items-center space-x-3 mb-6">
                                    <QrCode className="text-gold-500" />
                                    <h2 className={`text-xl font-display font-bold ${t.sectionTitle}`}>Compartilhar</h2>
                                </div>
                                <div className="bg-white p-4 rounded-2xl flex items-center justify-center mb-6">
                                    <QRCodeSVG value={publicUrl} size={200} fgColor="#1a1a1a" level="H" includeMargin={false} />
                                </div>
                                <div className="space-y-4">
                                    <p className={`text-xs text-center leading-relaxed ${t.sub}`}>
                                        Exiba este QR Code no palco ou telão para seu público acessar o SetVote instantaneamente.
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button className={`flex items-center justify-center space-x-2 border py-3 rounded-xl text-sm hover:text-gold-500 transition-colors ${darkMode ? 'bg-charcoal-900 border-charcoal-800 text-charcoal-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            <Download size={16} /><span>Baixar</span>
                                        </button>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(publicUrl); alert('Link copiado!') }}
                                            className={`flex items-center justify-center space-x-2 border py-3 rounded-xl text-sm hover:text-gold-500 transition-colors ${darkMode ? 'bg-charcoal-900 border-charcoal-800 text-charcoal-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                            <Share2 size={16} /><span>Copiar Link</span>
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className={`rounded-3xl p-6 border ${t.section}`}>
                                <div className="flex items-center space-x-3 mb-4">
                                    <Music className={darkMode ? 'text-charcoal-500' : 'text-gray-400'} size={18} />
                                    <h3 className={`text-sm font-bold uppercase tracking-wider ${t.label}`}>Status do App</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className={`flex justify-between items-center p-3 rounded-xl border ${t.infoCard}`}>
                                        <span className={`text-xs font-medium ${t.sub}`}>Versão</span>
                                        <span className="text-xs font-bold text-gold-500">1.0.0</span>
                                    </div>
                                    <div className={`flex justify-between items-center p-3 rounded-xl border ${t.infoCard}`}>
                                        <span className={`text-xs font-medium ${t.sub}`}>Licença</span>
                                        <span className="text-xs font-bold text-gold-500">Premium</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    )
}

export default AdminSettings
