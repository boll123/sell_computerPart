import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/logo.png'
import SearchBox from './SearchBox'
import CategoryMenu from './CategoryMenu'
import { useFavorites } from './FavoritesContext'
import { useCart } from './Cart'
import { useContact } from './Contact'
import { API } from './productUi'

const BG = '#141922'
const BORDER = '#2a3140'
const GREEN = '#00f56a'
const YELLOW = '#ffc107'
const LIGHT = '#d5d9e0'
const RED = '#ff4d5e'

// to = หน้าที่จะไป (null = ไม่ได้ไปหน้าไหน: ติดต่อเรา จะเปิดป็อบอัพแทน)
const menus = [
  { name: 'หน้าแรก', icon: 'bi-house-fill', color: GREEN, to: '/' },
  { name: 'สินค้ามือ1', icon: 'bi-gift-fill', color: GREEN, to: '/new' },
  { name: 'สินค้ามือ2', icon: 'bi-recycle', color: YELLOW, to: '/used' },
  { name: 'ติดต่อเรา', icon: 'bi-headset', color: GREEN, to: null },
]

// เมนูสำหรับคนที่เคยประกาศขายสินค้า
const EDIT_MENU = { name: 'แก้ไขสินค้า', icon: 'bi-pencil-square', color: '#38bdf8', to: '/my-products' }

function Header({ user, token, onLogout }) {
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hasListings, setHasListings] = useState(false)
  const { favorites, openWishlist } = useFavorites()
  const { count, openCart } = useCart()
  const { openContact, contactOpen } = useContact()

  // ตรวจว่าผู้ใช้เคยประกาศขายสินค้าหรือไม่ (ตรวจใหม่ทุกครั้งที่เปลี่ยนหน้า)
  useEffect(() => {
    if (!user || !token) {
      setHasListings(false)
      return
    }

    let alive = true
    fetch(`${API}/api/my-products/count`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => (r.ok ? r.json() : { count: 0 }))
      .then((d) => alive && setHasListings(d.count > 0))
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [user, token, pathname])

  // อยู่ที่หน้าแก้ไขสินค้า ให้เมนูค้างไว้แม้เพิ่งลบสินค้าชิ้นสุดท้าย
  const showEdit = !!user && (hasListings || pathname === '/my-products')

  // เมนูติดต่อเรา ให้อยู่ท้ายสุด ต่อจากเมนูแก้ไขสินค้า
  const navMenus = showEdit ? [...menus, EDIT_MENU] : menus

  // ลิงก์ที่จะแสดงในแผงหมวดหมู่บนจอเล็ก
  // (ติดต่อเรา บนจอเล็ก เปิดได้จากไอคอนโทรศัพท์ในหน้าต่างแชทมุมขวาล่าง)
  const mobileLinks = [
    ...menus.filter((m) => m.to),
    ...(showEdit ? [EDIT_MENU] : []),
    { name: 'ประกาศขาย', icon: 'bi-tag-fill', color: GREEN, to: '/sell' },
  ]

  return (
    <header
      className="sticky-top py-2 px-3 text-white"
      style={{
        backgroundColor: BG,
        borderBottom: `1px solid ${BORDER}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      <div className="container-fluid">
        <div className="row align-items-center g-2">
          {/* ปุ่ม ☰ เปิดแผงหมวดหมู่ */}
          <div className="col-auto">
            <button
              className="btn fs-3 p-0 lh-1"
              style={{ color: LIGHT }}
              onClick={() => setMenuOpen(true)}
              title="หมวดหมู่สินค้า"
            >
              <i className="bi bi-list"></i>
            </button>
          </div>

          {/* โลโก้ 100x100 (กดกลับหน้าแรก) */}
          <div className="col-auto">
            <Link to="/">
              <img
                src={logo}
                alt="logo"
                className="rounded-circle d-block"
                style={{ width: 100, height: 100, objectFit: 'cover' }}
              />
            </Link>
          </div>

          {/* ช่องค้นหา + แผงผลลัพธ์ (ยืดหดตามพื้นที่ที่เหลือ) */}
          <div className="col-12 col-lg order-4 order-lg-0" style={{ minWidth: 200 }}>
            <SearchBox user={user} token={token} />
          </div>

          {/* เมนูหลัก + ประกาศขาย (เฉพาะจอใหญ่) */}
          <div className="col-lg-auto d-none d-lg-flex flex-wrap align-items-center gap-2">
            {navMenus.map((m) => {
              const isActive = m.to ? pathname === m.to : contactOpen
              const style = {
                color: isActive ? GREEN : '#fff',
                borderBottom: `2px solid ${isActive ? GREEN : 'transparent'}`,
              }
              const content = (
                <>
                  <i className={`bi ${m.icon} me-1`} style={{ color: m.color }}></i>
                  {m.name}
                </>
              )

              return m.to ? (
                <Link
                  key={m.name}
                  to={m.to}
                  className="text-decoration-none fw-semibold px-2 pb-1"
                  style={style}
                >
                  {content}
                </Link>
              ) : (
                <a
                  key={m.name}
                  href="#!"
                  onClick={(e) => {
                    e.preventDefault()
                    openContact()
                  }}
                  className="text-decoration-none fw-semibold px-2 pb-1"
                  style={style}
                >
                  {content}
                </a>
              )
            })}

            <Link
              to="/sell"
              className="text-decoration-none fw-semibold rounded-pill px-3 py-1"
              style={{
                color: GREEN,
                backgroundColor: 'rgba(0,245,106,0.1)',
                border: '1px solid rgba(0,245,106,0.35)',
              }}
            >
              <i className="bi bi-tag-fill me-1"></i>
              ประกาศขาย
            </Link>
          </div>

          {/* ขวา: หัวใจ / ตะกร้า / เข้าสู่ระบบ / ลงทะเบียน */}
          <div className="col-auto ms-auto order-3 order-lg-0 d-flex align-items-center gap-3">
            {/* หัวใจ: เปิดรายการที่ถูกใจ (Wishlist) */}
            <button
              className="btn fs-5 p-0 lh-1 position-relative"
              style={{ color: RED }}
              title="รายการที่ถูกใจ"
              onClick={openWishlist}
            >
              <i className="bi bi-heart-fill"></i>
              {favorites.length > 0 && (
                <span
                  className="position-absolute top-0 start-100 translate-middle rounded-pill d-flex align-items-center justify-content-center fw-bold text-white"
                  style={{
                    backgroundColor: RED,
                    minWidth: 18,
                    height: 18,
                    fontSize: 11,
                    padding: '0 5px',
                  }}
                >
                  {favorites.length}
                </span>
              )}
            </button>

            {/* ตะกร้า */}
            <button
              className="btn fs-5 p-0 lh-1 position-relative"
              style={{ color: LIGHT }}
              title="ตะกร้า"
              onClick={openCart}
            >
              <i className="bi bi-cart-fill"></i>
              <span
                className="position-absolute top-0 start-100 translate-middle rounded-pill d-flex align-items-center justify-content-center fw-bold text-dark"
                style={{
                  backgroundColor: GREEN,
                  minWidth: 18,
                  height: 18,
                  fontSize: 11,
                  padding: '0 5px',
                }}
              >
                {count}
              </span>
            </button>

            {user ? (
              <>
                <span className="text-white fw-semibold d-none d-sm-inline">
                  <i className="bi bi-person-circle me-1" style={{ color: GREEN }}></i>
                  {user.username}
                </span>
                <button
                  onClick={onLogout}
                  className="btn btn-sm text-white fw-semibold px-3"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
                >
                  ออกจากระบบ
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="btn btn-sm text-white fw-semibold px-3 d-none d-sm-inline-block"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
                >
                  เข้าสู่ระบบ
                </Link>
                <Link
                  to="/register"
                  className="btn btn-sm fw-bold px-3 text-dark d-none d-sm-inline-block"
                  style={{ backgroundColor: GREEN }}
                >
                  ลงทะเบียน
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* แผงหมวดหมู่ + ป็อบอัพเลือกสินค้า */}
      <CategoryMenu
        open={menuOpen}
        onOpen={() => setMenuOpen(true)}
        onClose={() => setMenuOpen(false)}
        links={mobileLinks}
      />
    </header>
  )
}

export default Header