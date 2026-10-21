import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { API } from './productUi'

const FavoritesContext = createContext(null)

export const useFavorites = () => useContext(FavoritesContext)

export function FavoritesProvider({ user, token, onExpired, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [favorites, setFavorites] = useState([]) // สินค้าที่ผู้ใช้คนนี้กดถูกใจ
  const [counts, setCounts] = useState({}) // ยอดถูกใจล่าสุดของสินค้าที่เพิ่งกด
  const [wishlistOpen, setWishlistOpen] = useState(false)

  const loggedIn = !!(user && token)

  // ล็อกอิน: โหลดรายการที่ถูกใจ / ออกจากระบบ: ล้างทิ้ง
  useEffect(() => {
    if (!loggedIn) {
      setFavorites([])
      return
    }

    let alive = true
    fetch(`${API}/api/favorites`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => {
        if (r.status === 401) {
          onExpired()
          throw new Error('expired')
        }
        if (!r.ok) throw new Error('fail')
        return r.json()
      })
      .then((data) => alive && setFavorites(data))
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [loggedIn, token])

  const likedIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites])

  const isLiked = (id) => likedIds.has(id)

  // ยอดถูกใจ: ใช้ค่าล่าสุดที่เพิ่งกด ถ้ายังไม่เคยกดให้ใช้ค่าจากรายการสินค้า
  const likeCount = (p) => counts[p.id] ?? p.like_count ?? 0

  // กดถูกใจ / เอาออก
  const toggleLike = async (product) => {
    if (!loggedIn) {
      navigate('/login', {
        state: { from: location.pathname + location.search, reason: 'like' },
      })
      return
    }

    const liked = likedIds.has(product.id)

    try {
      const res = await fetch(`${API}/api/products/${product.id}/favorite`, {
        method: liked ? 'DELETE' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401) {
        onExpired()
        return
      }
      if (!res.ok) return

      const data = await res.json()
      setCounts((c) => ({ ...c, [product.id]: data.like_count }))
      setFavorites((list) =>
        liked
          ? list.filter((f) => f.id !== product.id)
          : [{ ...product, like_count: data.like_count }, ...list.filter((f) => f.id !== product.id)]
      )
    } catch {
      // เครือข่ายมีปัญหา: ไม่เปลี่ยนสถานะ
    }
  }

  const value = {
    loggedIn,
    favorites,
    isLiked,
    likeCount,
    toggleLike,
    wishlistOpen,
    openWishlist: () => setWishlistOpen(true),
    closeWishlist: () => setWishlistOpen(false),
  }

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}