import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useFavorites } from './FavoritesContext'
import { useCart } from './Cart'
import ProductModal from './ProductModal'
import { BG, BORDER, GREEN, imgSrc, priceText, NoImage } from './productUi'

const RED = '#ff4d5e'
const MUTED = '#9aa3b2'

function WishlistModal({ user, token }) {
  const { loggedIn, favorites, likeCount, toggleLike, wishlistOpen, closeWishlist } =
    useFavorites()
  const { addToCart } = useCart()
  const { pathname } = useLocation()
  const [selected, setSelected] = useState(null) // สินค้าที่เปิดดูรายละเอียด

  // เปลี่ยนหน้า (เช่น ถูกพาไปหน้า login) ให้ปิดป็อบอัพสินค้าที่เปิดค้างไว้
  useEffect(() => {
    setSelected(null)
  }, [pathname])

  // กด Esc เพื่อปิด และล็อกการเลื่อนหน้าด้านหลัง
  useEffect(() => {
    if (!wishlistOpen) return
    const onKey = (e) => e.key === 'Escape' && closeWishlist()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [wishlistOpen])

  // กดที่สินค้า: ปิด Wishlist แล้วเปิดป็อบอัพรายละเอียดสินค้า
  const openDetail = (p) => {
    closeWishlist()
    setSelected(p)
  }

  return (
    <>
      {wishlistOpen &&
        createPortal(
          <div
            onClick={closeWishlist}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{
              backgroundColor: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1060,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-100 d-flex flex-column rounded-5 text-white position-relative"
              style={{
                maxWidth: 840,
                maxHeight: '90vh',
                backgroundColor: BG,
                border: `1px solid ${BORDER}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              }}
            >
              {/* หัวข้อ */}
              <div className="d-flex align-items-center justify-content-between px-4 pt-4 pb-3">
                <h4 className="fw-bold mb-0">
                  <i className="bi bi-heart-fill me-2" style={{ color: RED }}></i>
                  รายการสินค้าที่ถูกใจ (Wishlist)
                </h4>
                <button
                  type="button"
                  onClick={closeWishlist}
                  aria-label="ปิด"
                  className="btn fs-5 p-0 lh-1"
                  style={{ color: MUTED }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* รายการ */}
              <div className="px-4 pb-4 overflow-auto">
                {!loggedIn ? (
                  <div className="text-center py-5" style={{ color: MUTED }}>
                    <Link
                      to="/login"
                      onClick={closeWishlist}
                      className="fw-bold text-decoration-none"
                      style={{ color: GREEN }}
                    >
                      เข้าสู่ระบบ
                    </Link>{' '}
                    เพื่อดูรายการสินค้าที่ถูกใจของคุณ
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-5" style={{ color: MUTED }}>
                    ยังไม่มีสินค้าที่ถูกใจ กดไอคอนหัวใจที่สินค้าเพื่อเก็บไว้ที่นี่
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {favorites.map((p) => {
                      const src = imgSrc(p.image_url)
                      return (
                        <div
                          key={p.id}
                          className="d-flex align-items-center gap-3 rounded-4 p-3"
                          style={{ backgroundColor: '#0e1218', border: `1px solid ${BORDER}` }}
                        >
                          {/* รูป + ชื่อ + ราคา (กดเพื่อดูรายละเอียด) */}
                          <button
                            type="button"
                            onClick={() => openDetail(p)}
                            className="btn p-0 border-0 d-flex align-items-center gap-3 text-start flex-grow-1 text-white"
                            style={{ minWidth: 0 }}
                          >
                            <div
                              className="rounded-3 overflow-hidden flex-shrink-0"
                              style={{ width: 70, height: 70, border: `1px solid ${BORDER}` }}
                            >
                              {src ? (
                                <img
                                  src={src}
                                  alt={`${p.brand} ${p.model}`}
                                  className="w-100 h-100"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <NoImage size={26} />
                              )}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <div className="fw-bold small text-truncate">
                                {p.brand} {p.model}
                              </div>
                              <div className="fw-bold" style={{ color: GREEN }}>
                                {priceText(p.price)}
                              </div>
                              <div className="small" style={{ color: RED }}>
                                <i className="bi bi-heart-fill me-1"></i>
                                {likeCount(p)} คนถูกใจ
                              </div>
                            </div>
                          </button>

                          {/* + ตะกร้า */}
                          <button
                            type="button"
                            onClick={() => addToCart(p)}
                            className="btn btn-sm fw-bold text-dark px-3 py-2 rounded-3 text-nowrap"
                            style={{ backgroundColor: GREEN }}
                          >
                            + ตะกร้า
                          </button>

                          {/* เอาออกจากรายการ */}
                          <button
                            type="button"
                            title="เอาออกจากรายการที่ถูกใจ"
                            onClick={() => toggleLike(p)}
                            className="btn p-1 fs-5 lh-1"
                            style={{ color: RED }}
                          >
                            <i className="bi bi-trash-fill"></i>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ป็อบอัพรายละเอียดสินค้า (เปิดจากการกดสินค้าใน Wishlist) */}
      {selected &&
        createPortal(
          <ProductModal
            product={selected}
            user={user}
            token={token}
            onClose={() => setSelected(null)}
          />,
          document.body
        )}
    </>
  )
}

export default WishlistModal