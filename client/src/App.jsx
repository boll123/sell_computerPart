import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import Header from './component/Header'
import MainHeader from './component/MainHeader'
import ProductsPage from './component/ProductsPage'
import SearchPage from './component/SearchPage'
import SelectedPage from './component/SelectedPage'
import MyProducts from './component/MyProducts'
import Register from './component/Register'
import Login from './component/Login'
import Sell from './component/Sell'
import { FavoritesProvider } from './component/FavoritesContext'
import WishlistModal from './component/WishlistModal'
import { CartProvider, CartDrawer, CheckoutModal } from './component/Cart'
import { ContactProvider } from './component/Contact'

// เปลี่ยนหน้า (หรือค้นคำใหม่) แล้วเลื่อนกลับขึ้นบนสุด
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname, search])
  return null
}

function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  const handleLogin = (userData, jwtToken) => {
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('token', jwtToken)
    setUser(userData)
    setToken(jwtToken)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setToken(null)
  }

  const loggedIn = user && token

  return (
    <FavoritesProvider user={user} token={token} onExpired={handleLogout}>
      <CartProvider user={user} token={token}>
        <ContactProvider>
          <div className="min-vh-100 bg-black">
            <ScrollToTop />
            <Header user={user} token={token} onLogout={handleLogout} />
            <WishlistModal user={user} token={token} />
            <CartDrawer />
            <CheckoutModal token={token} onExpired={handleLogout} />
            <Routes>
              <Route path="/" element={<MainHeader user={user} token={token} />} />
              <Route
                path="/new"
                element={<ProductsPage key="new" condition="new" user={user} token={token} />}
              />
              <Route
                path="/used"
                element={<ProductsPage key="used" condition="used" user={user} token={token} />}
              />
              <Route path="/search" element={<SearchPage user={user} token={token} />} />
              <Route path="/selected" element={<SelectedPage user={user} token={token} />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login onLogin={handleLogin} />} />
              <Route
                path="/sell"
                element={
                  loggedIn ? (
                    <Sell token={token} onExpired={handleLogout} />
                  ) : (
                    <Navigate to="/login" replace state={{ from: '/sell' }} />
                  )
                }
              />
              <Route
                path="/my-products"
                element={
                  loggedIn ? (
                    <MyProducts token={token} onExpired={handleLogout} />
                  ) : (
                    <Navigate
                      to="/login"
                      replace
                      state={{ from: '/my-products', reason: 'manage' }}
                    />
                  )
                }
              />
              {/* URL ที่ไม่มีหน้ารองรับ */}
              <Route
                path="*"
                element={
                  <div className="text-white text-center py-5">
                    <h2 className="fw-bold">ไม่พบหน้านี้</h2>
                    <Link to="/" className="text-decoration-none" style={{ color: '#00f56a' }}>
                      กลับหน้าแรก
                    </Link>
                  </div>
                }
              />
            </Routes>
          </div>
        </ContactProvider>
      </CartProvider>
    </FavoritesProvider>
  )
}

export default App