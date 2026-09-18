import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import IndexPage from './pages/IndexPage'
import AdminApp from './pages/AdminApp'
import StoreSettings from './components/admin/StoreSettings'
import AdminCatalog from './components/admin/AdminCatalog'
import DomainsManager from './components/admin/DomainsManager'
import MembershipsManager from './components/admin/MembershipsManager'
import StoresManager from './components/admin/StoresManager'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/admin" element={<AdminApp />}>
            <Route index element={<StoreSettings />} />
            <Route path="catalogo" element={<AdminCatalog />} />
            <Route path="dominios" element={<DomainsManager />} />
            <Route path="miembros" element={<MembershipsManager />} />
            <Route path="tiendas" element={<StoresManager />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}