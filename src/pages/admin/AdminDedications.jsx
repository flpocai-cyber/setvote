import { Navigate } from 'react-router-dom'

// "Dedique uma Canção" config page — the settings live in AdminSettings.
// Redirect the user there directly to the settings page.
const AdminDedications = () => <Navigate to="/admin/configuracoes" replace />

export default AdminDedications
