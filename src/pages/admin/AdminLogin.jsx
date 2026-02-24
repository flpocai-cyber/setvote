import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Music, Lock, Mail, Loader2 } from 'lucide-react'

const AdminLogin = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await signIn(email, password)

        if (error) {
            setError('Credenciais inválidas. Tente novamente.')
            setLoading(false)
        } else {
            navigate('/admin/dashboard')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-charcoal-950 p-4">
            <div className="max-w-md w-full glass rounded-2xl p-8 border-gold-500/20 shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-500/10 mb-4">
                        <Music className="w-8 h-8 text-gold-500" />
                    </div>
                    <h1 className="text-3xl font-display font-bold gold-gradient">SetVote Admin</h1>
                    <p className="text-charcoal-400 mt-2">Acesse seu painel administrativo</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-charcoal-300 mb-2">E-mail</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-500" />
                            <input
                                type="email"
                                required
                                className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                                placeholder="seu-email@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-charcoal-300 mb-2">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-charcoal-500" />
                            <input
                                type="password"
                                required
                                className="w-full bg-charcoal-900 border border-charcoal-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-gold-500/50 transition-colors"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full gold-bg-gradient text-charcoal-950 font-bold py-3 rounded-xl shadow-lg shadow-gold-500/20 hover:opacity-90 transition-all flex items-center justify-center space-x-2"
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <span>Entrar no Dashboard</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AdminLogin
