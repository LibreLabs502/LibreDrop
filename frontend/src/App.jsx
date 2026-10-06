import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './store/AuthContext'
import IndexPage from './pages/IndexPage'
import AdminApp from './pages/AdminApp'
import StoresManager from './components/admin/StoresManager'
import AdminCatalog from './components/admin/AdminCatalog'
import PublicStore from './pages/PublicStore'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<IndexPage />} />
          <Route path="/tienda/:slug" element={<PublicStore />} />
          <Route path="/admin" element={<AdminApp />}>
            <Route index element={<StoresManager />} />
            <Route path="catalogo" element={<AdminCatalog />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
