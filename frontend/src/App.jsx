import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/auth.store'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import CreateFundraiserPage from './pages/CreateFundraiserPage'
import FundraiserDetailPage from './pages/FundraiserDetailPage'
import UnmatchedResolvePage from './pages/UnmatchedResolvePage'
import ExportPage from './pages/ExportPage'
import SettingsPage from './pages/SettingsPage'
import ContributorRegistrationPage from './pages/ContributorRegistrationPage'

const PrivateRoute = ({ children }) => {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/register/:token" element={<ContributorRegistrationPage />} />

        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/fundraisers/new" element={<PrivateRoute><CreateFundraiserPage /></PrivateRoute>} />
        <Route path="/fundraisers/:id" element={<PrivateRoute><FundraiserDetailPage /></PrivateRoute>} />
        <Route path="/fundraisers/:id/unmatched" element={<PrivateRoute><UnmatchedResolvePage /></PrivateRoute>} />
        <Route path="/fundraisers/:id/export" element={<PrivateRoute><ExportPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
