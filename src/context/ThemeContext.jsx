import { createContext, useContext, useState } from 'react'

const ThemeContext = createContext(null)

export const ThemeProvider = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('admin_dark_mode')
        return saved === null ? true : saved === 'true'
    })

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev
            localStorage.setItem('admin_dark_mode', String(next))
            return next
        })
    }

    return (
        <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </ThemeContext.Provider>
    )
}

export const useTheme = () => {
    const ctx = useContext(ThemeContext)
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
    return ctx
}
