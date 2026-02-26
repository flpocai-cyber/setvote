import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
    Settings, User, QrCode, Music, LayoutDashboard,
    LogOut, Save, Loader2, Camera, Share2, Download, Users, CreditCard, UserCircle, BarChart2
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

const AdminSettings = () => {
    const { user } = useAuth()
    const [profile, setProfile] = useState({
        musician_name: '',
        welcome_text: '',
        voting_active: true,
        profile_image_url: '',
        pix_key: '',
        pix_name: ''
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [file, setFile] = useState(null)
    const [previewUrl, setPreviewUrl] = useState(null)

    useEffect(() => {
        fetchProfile()
    }, [user])

    const fetchProfile = async () => {
        if (!user) return
        setLoading(true)
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error)
        } else if (data) {
            setProfile(data)
        }
        setLoading(false)
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setProfile(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
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
                const filePath = `${fileName}`

                const { error: uploadError } = await supabase.storage
                    .from('profiles')
                    .upload(filePath, file, { upsert: true })

                if (uploadError) throw uploadError

                const { data: { publicUrl } } = supabase.storage
                    .from('profiles')
                    .getPublicUrl(filePath)

                profile_image_url = publicUrl
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    musician_name: profile.musician_name,
                    welcome_text: profile.welcome_text,
                    voting_active: profile.voting_active,
                    profile_image_url,
                    pix_key: profile.pix_key,
                    pix_name: profile.pix_name,
                    updated_at: new Date()
                })

            if (error) throw error
            alert('Perfil atualizado com sucesso!')
        } catch (err) {
            console.error('Error saving profile:', err)
            alert('Erro ao salvar perfil: ' + err.message)
        } finally {
            setSaving(false)
        }
    }

    const publicUrl = window.location.origin

    return (
        <div className="min-h-screen bg-charcoal-950 flex">
            {/* Sidebar (same as dashboard) */}
            <aside className="w-64 bg-charcoal-900 border-r border-charcoal-800 flex flex-col hidden lg:flex">
                <div className="p-6">
                    <h2 className="text-xl font-display font-bold gold-gradient flex items-center space-x-2">
                        <Music className="text-gold-500" />
                        <span>SetVote Admin</span>
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    <Link to="/admin/dashboard" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </Link>
                    <Link to="/admin/musicas" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Music size={20} />
                        <span>Músicas</span>
                    </Link>
                    <Link to="/admin/patrocinadores" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <Users size={20} />
                        <span>Patrocinadores</span>
                    </Link>
                    <Link to="/admin/sobre" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <UserCircle size={20} />
                        <span>Sobre o Músico</span>
                    </Link>
                    <Link to="/admin/estatisticas" className="flex items-center space-x-3 text-charcoal-400 hover:text-gold-500 hover:bg-gold-500/5 px-4 py-3 rounded-xl transition-all">
                        <BarChart2 size={20} />
                        <span>Estatísticas</span>
                    </Link>
                    <Link to="/admin/configuracoes" className="flex items-center space-x-3 text-gold-500 bg-gold-500/10 px-4 py-3 rounded-xl transition-all">
                        <Settings size={20} />
                        <span>Configurações</span>
                    </Link>
                </nav>

                <div className="p-4 mt-auto">
                    <button
                        onClick={() => supabase.auth.signOut()}
                        className="flex items-center space-x-3 text-charcoal-500 hover:text-red-400 px-4 py-3 transition-colors w-full"
                    >
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl font-display font-bold text-white mb-10">Configurações</h1>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Profile Form */}
                        <div className="md:col-span-2 space-y-8">
                            <section className="glass rounded-3xl p-8 border border-charcoal-800">
                                <div className="flex items-center space-x-3 mb-8">
                                    <User className="text-gold-500" />
                                    <h2 className="text-xl font-display font-bold text-white">Perfil do Músico</h2>
                                </div>

                                <form onSubmit={handleSave} className="space-y-6">
                                    <div className="flex flex-col md:flex-row gap-8">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-3xl bg-charcoal-800 border-2 border-charcoal-700 overflow-hidden flex items-center justify-center relative">
                                                {(previewUrl || profile.profile_image_url) ? (
                                                    <img src={previewUrl || profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="w-12 h-12 text-charcoal-600" />
                                                )}
                                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <Camera className="text-white" />
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                                </label>
                                            </div>
                                            <p className="text-[10px] text-charcoal-500 mt-2 text-center uppercase tracking-wider">
                                                {previewUrl ? '✓ Foto selecionada' : 'Alterar Foto'}
                                            </p>
                                        </div>

                                        <div className="flex-1 space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-400 mb-2">Nome do Músico / Banda</label>
                                                <input
                                                    type="text"
                                                    name="musician_name"
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                                    value={profile.musician_name}
                                                    onChange={handleChange}
                                                    placeholder="Ex: João e Banda"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-charcoal-400 mb-2">Texto de Boas-vindas</label>
                                                <textarea
                                                    name="welcome_text"
                                                    rows="3"
                                                    className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50 resize-none"
                                                    value={profile.welcome_text}
                                                    onChange={handleChange}
                                                    placeholder="Olá! Vote na sua música favorita..."
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-charcoal-800 flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full bg-charcoal-800">
                                                <input
                                                    type="checkbox"
                                                    name="voting_active"
                                                    id="voting_active"
                                                    className="absolute w-6 h-6 rounded-full bg-white border-4 border-charcoal-800 appearance-none cursor-pointer peer checked:translate-x-6 transition-all"
                                                    checked={profile.voting_active}
                                                    onChange={handleChange}
                                                />
                                                <label htmlFor="voting_active" className={`absolute inset-0 rounded-full cursor-pointer transition-colors ${profile.voting_active ? 'bg-green-500' : 'bg-charcoal-800'}`}></label>
                                            </div>
                                            <span className="text-sm font-medium text-charcoal-300">Votação Pública Ativa</span>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="gold-bg-gradient text-charcoal-950 font-bold px-8 py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:scale-[1.02] transition-all flex items-center space-x-2 disabled:opacity-50"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            <span>Salvar Alterações</span>
                                        </button>
                                    </div>
                                </form>
                            </section>

                            {/* PIX / Couvert Artístico */}
                            <section className="glass rounded-3xl p-8 border border-charcoal-800">
                                <div className="flex items-center space-x-3 mb-6">
                                    <CreditCard className="text-gold-500" />
                                    <h2 className="text-xl font-display font-bold text-white">Couvert Artístico (PIX)</h2>
                                </div>
                                <p className="text-sm text-charcoal-400 mb-6 leading-relaxed">
                                    Os visitantes poderão clicar em <strong className="text-charcoal-300">"Couvert Artístico"</strong> e ver sua chave PIX para fazer uma doação.
                                </p>
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-400 mb-2">Chave PIX</label>
                                        <input
                                            type="text"
                                            name="pix_key"
                                            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                            value={profile.pix_key || ''}
                                            onChange={handleChange}
                                            placeholder="CPF, e-mail, telefone ou chave aleatória"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-charcoal-400 mb-2">Nome do Recebedor</label>
                                        <input
                                            type="text"
                                            name="pix_name"
                                            className="w-full bg-charcoal-800 border border-charcoal-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-gold-500/50"
                                            value={profile.pix_name || ''}
                                            onChange={handleChange}
                                            placeholder="Ex: Rinaldo Zamai"
                                        />
                                    </div>
                                    <p className="text-xs text-charcoal-600">Clique em "Salvar Alterações" acima para aplicar.</p>
                                </div>
                            </section>
                        </div>

                        {/* QR Code Sharing */}
                        <div className="space-y-8">
                            <section className="glass rounded-3xl p-8 border border-gold-500/20 bg-gold-500/[0.02]">
                                <div className="flex items-center space-x-3 mb-6">
                                    <QrCode className="text-gold-500" />
                                    <h2 className="text-xl font-display font-bold text-white">Compartilhar</h2>
                                </div>

                                <div className="bg-white p-4 rounded-2xl flex items-center justify-center mb-6">
                                    <QRCodeSVG
                                        value={publicUrl}
                                        size={200}
                                        fgColor="#1a1a1a"
                                        level="H"
                                        includeMargin={false}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs text-charcoal-400 text-center leading-relaxed">
                                        Exiba este QR Code no palco ou telão para seu público acessar o SetVote instantaneamente.
                                    </p>

                                    <div className="grid grid-cols-2 gap-3">
                                        <button className="flex items-center justify-center space-x-2 bg-charcoal-900 border border-charcoal-800 text-charcoal-300 py-3 rounded-xl text-sm hover:text-white transition-colors">
                                            <Download size={16} />
                                            <span>Baixar</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(publicUrl)
                                                alert('Link copiado!')
                                            }}
                                            className="flex items-center justify-center space-x-2 bg-charcoal-900 border border-charcoal-800 text-charcoal-300 py-3 rounded-xl text-sm hover:text-white transition-colors"
                                        >
                                            <Share2 size={16} />
                                            <span>Copiar Link</span>
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="glass rounded-3xl p-6 border border-charcoal-800">
                                <div className="flex items-center space-x-3 mb-4">
                                    <LayoutDashboard className="text-charcoal-500" size={18} />
                                    <h3 className="text-sm font-bold text-charcoal-400 uppercase tracking-wider">Status do App</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center bg-charcoal-900/50 p-3 rounded-xl border border-charcoal-800">
                                        <span className="text-xs text-charcoal-500 font-medium">Versão</span>
                                        <span className="text-xs font-bold text- gold-500">1.0.0</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-charcoal-900/50 p-3 rounded-xl border border-charcoal-800">
                                        <span className="text-xs text-charcoal-500 font-medium">Licença</span>
                                        <span className="text-xs font-bold text-gold-500">Premium</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

export default AdminSettings
