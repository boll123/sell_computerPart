import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { API, BG, BORDER, GREEN, imgSrc, priceText, NoImage } from './productUi'

const MUTED = '#9aa3b2'
const BOX = '#0e1218'
const PANEL = '#161c27'

/* =====================================================
   1) ข้อมูลตะกร้า (Context): ใช้ได้ทุกที่ด้วย useCart()
   ===================================================== */
const CartContext = createContext(null)

export const useCart = () => useContext(CartContext)

// เก็บเฉพาะข้อมูลสินค้าที่จำเป็นในตะกร้า
const slim = (p) => ({
  id: p.id,
  brand: p.brand,
  model: p.model,
  price: p.price,
  image_url: p.image_url,
  seller: p.seller,
})

export function CartProvider({ user, token, children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const [items, setItems] = useState([]) // [{ product, quantity }]
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const loggedIn = !!(user && token)
  const userId = user ? user.id : null

  // ล็อกอิน: โหลดตะกร้าของผู้ใช้คนนี้ / ออกจากระบบ: ล้างหน้าจอ (ของที่เก็บไว้ยังอยู่)
  useEffect(() => {
    if (!loggedIn) {
      setItems([])
      setCartOpen(false)
      setCheckoutOpen(false)
      return
    }
    try {
      setItems(JSON.parse(localStorage.getItem(`cart:${userId}`)) || [])
    } catch {
      setItems([])
    }
  }, [loggedIn, userId])

  // แก้ไขตะกร้าและบันทึกลงเบราว์เซอร์ทุกครั้ง
  const update = (fn) =>
    setItems((prev) => {
      const next = fn(prev)
      if (userId) localStorage.setItem(`cart:${userId}`, JSON.stringify(next))
      return next
    })

  const showToast = (text, type = 'success') => {
    clearTimeout(timer.current)
    setToast({ text, type })
    timer.current = setTimeout(() => setToast(null), 2200)
  }

  // ยังไม่ล็อกอิน: พาไปหน้า login แล้วกลับมาหน้าเดิม
  const requireLogin = () => {
    if (loggedIn) return false
    navigate('/login', {
      state: { from: location.pathname + location.search, reason: 'cart' },
    })
    return true
  }

  const addToCart = (product, quantity = 1, silent = false) => {
    if (requireLogin()) return false

    if (product.seller === user.username) {
      showToast('ไม่สามารถซื้อสินค้าของตัวเองได้', 'danger')
      return false
    }

    update((prev) => {
      const found = prev.find((i) => i.product.id === product.id)
      if (found) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(99, i.quantity + quantity) }
            : i
        )
      }
      return [...prev, { product: slim(product), quantity }]
    })

    if (!silent) showToast(`เพิ่ม ${product.brand} ${product.model} ลงตะกร้าแล้ว`)
    return true
  }

  const setQuantity = (id, qty) =>
    update((prev) =>
      prev.map((i) =>
        i.product.id === id ? { ...i, quantity: Math.max(1, Math.min(99, qty)) } : i
      )
    )

  const removeItem = (id) => update((prev) => prev.filter((i) => i.product.id !== id))

  const clearCart = () => update(() => [])

  const openCart = () => {
    if (!requireLogin()) setCartOpen(true)
  }

  // ซื้อเลย: ใส่ตะกร้าแล้วเปิดหน้าชำระเงินทันที
  const buyNow = (product, quantity = 1) => {
    if (!addToCart(product, quantity, true)) return false
    setCheckoutOpen(true)
    return true
  }

  const count = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = items.reduce((sum, i) => sum + Number(i.product.price) * i.quantity, 0)

  const value = {
    items,
    count,
    subtotal,
    addToCart,
    buyNow,
    setQuantity,
    removeItem,
    clearCart,
    cartOpen,
    openCart,
    closeCart: () => setCartOpen(false),
    checkoutOpen,
    openCheckout: () => setCheckoutOpen(true),
    closeCheckout: () => setCheckoutOpen(false),
  }

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* ข้อความแจ้งสั้นๆ ด้านล่างจอ */}
      {toast &&
        createPortal(
          <div
            className="position-fixed start-50 translate-middle-x"
            style={{ bottom: 24, zIndex: 1100 }}
          >
            <div
              className="rounded-pill px-4 py-2 small fw-semibold"
              style={{
                backgroundColor: toast.type === 'danger' ? '#2a1519' : '#0e1f17',
                border: `1px solid ${toast.type === 'danger' ? '#ff4d5e' : GREEN}`,
                color: toast.type === 'danger' ? '#ff8a96' : GREEN,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              }}
            >
              <i
                className={`bi ${
                  toast.type === 'danger' ? 'bi-x-circle-fill' : 'bi-check-circle-fill'
                } me-2`}
              ></i>
              {toast.text}
            </div>
          </div>,
          document.body
        )}
    </CartContext.Provider>
  )
}

/* =====================================================
   2) ลิ้นชักตะกร้า (รูปที่ 1)
   ===================================================== */
export function CartDrawer() {
  const { items, subtotal, cartOpen, closeCart, openCheckout, setQuantity, removeItem } =
    useCart()
  const [slideIn, setSlideIn] = useState(false)

  // เลื่อนลิ้นชักเข้ามาทางขวา
  useEffect(() => {
    if (!cartOpen) {
      setSlideIn(false)
      return
    }
    const id = requestAnimationFrame(() => setSlideIn(true))
    return () => cancelAnimationFrame(id)
  }, [cartOpen])

  // กด Esc เพื่อปิด และล็อกการเลื่อนหน้าด้านหลัง
  useEffect(() => {
    if (!cartOpen) return
    const onKey = (e) => e.key === 'Escape' && closeCart()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [cartOpen])

  if (!cartOpen) return null

  return createPortal(
    <div
      onClick={closeCart}
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-end"
      style={{
        backgroundColor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1060,
      }}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-100 d-flex flex-column text-white"
        style={{
          width: '100%',
          maxWidth: 440,
          backgroundColor: BG,
          borderLeft: `1px solid ${BORDER}`,
          transform: slideIn ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        {/* หัวลิ้นชัก */}
        <div
          className="d-flex align-items-center justify-content-between px-4 py-3"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <h5 className="fw-bold mb-0">
            <i className="bi bi-cart-fill me-2" style={{ color: GREEN }}></i>
            ตะกร้าสินค้าของฉัน
          </h5>
          <button
            type="button"
            onClick={closeCart}
            aria-label="ปิด"
            className="btn fs-5 p-0 lh-1"
            style={{ color: MUTED }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* รายการสินค้า */}
        <div className="flex-grow-1 overflow-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="text-center py-5" style={{ color: MUTED }}>
              <i className="bi bi-cart-x" style={{ fontSize: 48 }}></i>
              <div className="mt-2">ตะกร้าของคุณยังว่างอยู่</div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {items.map(({ product: p, quantity }) => {
                const src = imgSrc(p.image_url)
                return (
                  <div
                    key={p.id}
                    className="d-flex align-items-center gap-3 rounded-4 p-3"
                    style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
                  >
                    <div
                      className="rounded-3 overflow-hidden flex-shrink-0"
                      style={{ width: 60, height: 60 }}
                    >
                      {src ? (
                        <img
                          src={src}
                          alt={`${p.brand} ${p.model}`}
                          className="w-100 h-100"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <NoImage size={24} />
                      )}
                    </div>

                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                      <div className="fw-bold small text-truncate">
                        {p.brand} {p.model}
                      </div>
                      <div className="fw-bold small" style={{ color: GREEN }}>
                        {priceText(p.price)}
                      </div>
                    </div>

                    {/* ปรับจำนวน */}
                    <div
                      className="d-inline-flex align-items-center rounded-3 px-1 flex-shrink-0"
                      style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity(p.id, quantity - 1)}
                        disabled={quantity <= 1}
                        aria-label="ลดจำนวน"
                        className="btn btn-sm p-1 lh-1"
                        style={{ color: MUTED }}
                      >
                        <i className="bi bi-dash"></i>
                      </button>
                      <span className="px-2 fw-bold small">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(p.id, quantity + 1)}
                        aria-label="เพิ่มจำนวน"
                        className="btn btn-sm p-1 lh-1"
                        style={{ color: MUTED }}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    </div>

                    {/* ลบออกจากตะกร้า */}
                    <button
                      type="button"
                      onClick={() => removeItem(p.id)}
                      title="เอาออกจากตะกร้า"
                      className="btn p-1 lh-1 flex-shrink-0"
                      style={{ color: '#ff4d5e' }}
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* สรุปยอด + ปุ่มชำระเงิน */}
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${BORDER}` }}>
          <div className="d-flex justify-content-between mb-2">
            <span style={{ color: MUTED }}>ราคารวมสินค้า:</span>
            <span className="fw-bold">{priceText(subtotal)}</span>
          </div>
          <div className="d-flex justify-content-between mb-3">
            <span style={{ color: MUTED }}>ค่าจัดส่ง:</span>
            <span className="fw-bold" style={{ color: GREEN }}>
              ฟรี
            </span>
          </div>

          <div
            className="d-flex justify-content-between align-items-center pt-3 mb-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <span className="fw-bold fs-5">สุทธิ:</span>
            <span
              className="fw-bold"
              style={{ color: GREEN, fontSize: 28, textShadow: '0 0 14px rgba(0,245,106,0.5)' }}
            >
              {priceText(subtotal)}
            </span>
          </div>

          <button
            type="button"
            disabled={items.length === 0}
            onClick={() => {
              closeCart()
              openCheckout()
            }}
            className="btn w-100 fw-bold text-dark py-3 rounded-4"
            style={{ backgroundColor: GREEN, boxShadow: '0 0 20px rgba(0,245,106,0.4)' }}
          >
            <i className="bi bi-credit-card-2-front-fill me-2"></i>
            ดำเนินการชำระเงิน
          </button>
        </div>
      </aside>
    </div>,
    document.body
  )
}

/* =====================================================
   3) ป็อบอัพชำระเงินและจัดส่งสินค้า (รูปที่ 2)
   ===================================================== */
const PAYMENTS = [
  { value: 'promptpay', label: 'พร้อมเพย์ (QR PromptPay)', icon: 'bi-qr-code', color: GREEN, badge: 'แนะนำ' },
  { value: 'card', label: 'บัตรเครดิต / เดบิต', icon: 'bi-credit-card-2-front-fill', color: '#38bdf8' },
  { value: 'cod', label: 'เก็บเงินปลายทาง (COD)', icon: 'bi-cash-coin', color: '#fbbf24' },
]

export function CheckoutModal({ token, onExpired }) {
  const { items, subtotal, checkoutOpen, closeCheckout, clearCart } = useCart()

  const [address, setAddress] = useState('')
  const [payment, setPayment] = useState('promptpay')
  const [loadingAddr, setLoadingAddr] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })
  const [done, setDone] = useState(null) // ผลคำสั่งซื้อที่สำเร็จ

  // เปิดใหม่ทุกครั้ง เริ่มจากฟอร์มว่าง
  useEffect(() => {
    if (checkoutOpen) {
      setAddress('')
      setPayment('promptpay')
      setMsg({ type: '', text: '' })
      setDone(null)
    }
  }, [checkoutOpen])

  // กด Esc เพื่อปิด และล็อกการเลื่อนหน้าด้านหลัง
  useEffect(() => {
    if (!checkoutOpen) return
    const onKey = (e) => e.key === 'Escape' && closeCheckout()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [checkoutOpen])

  // ดึงที่อยู่ที่บันทึกไว้ในบัญชีจากฐานข้อมูล
  const autofill = async () => {
    setLoadingAddr(true)
    setMsg({ type: '', text: '' })
    try {
      const res = await fetch(`${API}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        onExpired()
        return
      }
      const data = await res.json()
      if (!res.ok) throw new Error(data.message)

      if (data.address) {
        setAddress(data.address)
      } else {
        setMsg({ type: 'warning', text: 'ยังไม่มีที่อยู่ที่บันทึกไว้ในบัญชีของคุณ' })
      }
    } catch {
      setMsg({ type: 'danger', text: 'ดึงข้อมูลที่อยู่ไม่สำเร็จ' })
    } finally {
      setLoadingAddr(false)
    }
  }

  // ยืนยันการสั่งซื้อ
  const confirmOrder = async () => {
    if (!address.trim()) {
      setMsg({ type: 'danger', text: 'กรุณากรอกที่อยู่จัดส่ง' })
      return
    }

    setSubmitting(true)
    setMsg({ type: '', text: '' })

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
          address,
          payment_method: payment,
        }),
      })

      if (res.status === 401) {
        onExpired()
        return
      }

      const data = await res.json()

      if (res.ok) {
        setDone({ id: data.order_id, total: data.total, payment })
        clearCart()
      } else {
        setMsg({ type: 'danger', text: data.message })
      }
    } catch {
      setMsg({ type: 'danger', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' })
    } finally {
      setSubmitting(false)
    }
  }

  if (!checkoutOpen) return null

  const payLabel = PAYMENTS.find((p) => p.value === (done ? done.payment : payment))?.label

  return createPortal(
    <div
      onClick={closeCheckout}
      className="position-fixed top-0 start-0 w-100 h-100 overflow-auto p-3"
      style={{
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1060,
      }}
    >
      <div
        data-bs-theme="dark"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto my-3 position-relative rounded-5 p-4 text-white"
        style={{
          maxWidth: 960,
          backgroundColor: BG,
          border: `1px solid ${GREEN}`,
          boxShadow: '0 0 40px rgba(0,245,106,0.2)',
        }}
      >
        {/* หัวข้อ */}
        <div
          className="d-flex align-items-center gap-3 pb-3 mb-4"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: 50,
              height: 50,
              fontSize: 24,
              color: GREEN,
              backgroundColor: 'rgba(0,245,106,0.1)',
              border: '1px solid rgba(0,245,106,0.5)',
            }}
          >
            <i className="bi bi-credit-card-2-front-fill"></i>
          </div>
          <div className="flex-grow-1">
            <h4 className="fw-bold mb-0">ชำระเงินและจัดส่งสินค้า</h4>
            <div className="small" style={{ color: MUTED }}>
              ตรวจสอบที่อยู่และเลือกช่องทางการชำระเงิน
            </div>
          </div>
          <button
            type="button"
            onClick={closeCheckout}
            aria-label="ปิด"
            className="btn fs-5 p-0 lh-1 align-self-start"
            style={{ color: MUTED }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {done ? (
          /* ===== สั่งซื้อสำเร็จ ===== */
          <div className="text-center py-5">
            <i className="bi bi-check-circle-fill" style={{ fontSize: 64, color: GREEN }}></i>
            <h3 className="fw-bold mt-3 mb-1">สั่งซื้อสำเร็จ</h3>
            <div style={{ color: MUTED }}>
              เลขที่คำสั่งซื้อ{' '}
              <span className="fw-bold text-white">OD{String(done.id).padStart(6, '0')}</span>
            </div>
            <div className="mt-3">
              ยอดชำระสุทธิ{' '}
              <span className="fw-bold fs-4" style={{ color: GREEN }}>
                {priceText(done.total)}
              </span>
            </div>
            <div className="small mt-1" style={{ color: MUTED }}>
              ช่องทางชำระเงิน: {payLabel} · สถานะ: รอดำเนินการ
            </div>
            <button
              type="button"
              onClick={closeCheckout}
              className="btn fw-bold text-dark px-5 py-2 rounded-3 mt-4"
              style={{ backgroundColor: GREEN }}
            >
              ปิด
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {/* ===== ซ้าย: ที่อยู่ + ช่องทางชำระเงิน ===== */}
            <div className="col-12 col-lg-6">
              <div
                className="rounded-4 p-3 mb-4"
                style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold small" style={{ color: GREEN }}>
                    <i className="bi bi-truck me-2"></i>
                    ที่อยู่จัดส่ง
                  </span>
                  <button
                    type="button"
                    onClick={autofill}
                    disabled={loadingAddr}
                    className="btn btn-sm p-0 border-0 small"
                    style={{ color: MUTED }}
                  >
                    <i className="bi bi-cloud-download me-1"></i>
                    {loadingAddr ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูลอัตโนมัติ'}
                  </button>
                </div>
                <textarea
                  rows={4}
                  maxLength={1000}
                  className="form-control text-white shadow-none rounded-3"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
                  placeholder="กรอกหรือแก้ไขที่อยู่จัดส่งที่นี่..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="fw-bold small mb-2">เลือกช่องทางชำระเงิน</div>
              {PAYMENTS.map((p) => {
                const on = payment === p.value
                return (
                  <label
                    key={p.value}
                    className="d-flex align-items-center gap-3 rounded-4 px-3 py-3 mb-2"
                    style={{
                      backgroundColor: BOX,
                      border: `1px solid ${on ? GREEN : BORDER}`,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={p.value}
                      checked={on}
                      onChange={() => setPayment(p.value)}
                      style={{ accentColor: GREEN, width: 18, height: 18 }}
                    />
                    <i className={`bi ${p.icon} fs-4`} style={{ color: p.color }}></i>
                    <span className="fw-bold flex-grow-1">{p.label}</span>
                    {p.badge && (
                      <span
                        className="rounded-2 px-2 py-1 fw-bold"
                        style={{
                          fontSize: 11,
                          color: GREEN,
                          backgroundColor: 'rgba(0,245,106,0.15)',
                        }}
                      >
                        {p.badge}
                      </span>
                    )}
                  </label>
                )
              })}
            </div>

            {/* ===== ขวา: สรุปรายการสั่งซื้อ ===== */}
            <div className="col-12 col-lg-6">
              <div
                className="rounded-4 p-3 h-100 d-flex flex-column"
                style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
              >
                <h6 className="fw-bold pb-2 mb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  สรุปรายการสั่งซื้อ
                </h6>

                <div className="flex-grow-1" style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {items.map(({ product: p, quantity }) => (
                    <div
                      key={p.id}
                      className="d-flex justify-content-between gap-3 py-2 small"
                      style={{ borderBottom: `1px solid ${BORDER}` }}
                    >
                      <span className="text-truncate">
                        {p.brand} {p.model}
                        {quantity > 1 && <span style={{ color: MUTED }}> ×{quantity}</span>}
                      </span>
                      <span className="fw-bold text-nowrap">
                        {priceText(Number(p.price) * quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pt-3" style={{ borderTop: `1px solid ${BORDER}` }}>
                  <div className="d-flex justify-content-between small mb-1">
                    <span style={{ color: MUTED }}>ราคารวม:</span>
                    <span className="fw-bold">{priceText(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between small mb-3">
                    <span style={{ color: MUTED }}>ค่าจัดส่งด่วนพิเศษ:</span>
                    <span className="fw-bold" style={{ color: GREEN }}>
                      ฟรี
                    </span>
                  </div>
                  <div
                    className="d-flex justify-content-between align-items-center pt-3 mb-3"
                    style={{ borderTop: `1px solid ${BORDER}` }}
                  >
                    <span className="fw-bold">ยอดชำระสุทธิ:</span>
                    <span
                      className="fw-bold"
                      style={{
                        color: GREEN,
                        fontSize: 26,
                        textShadow: '0 0 14px rgba(0,245,106,0.5)',
                      }}
                    >
                      {priceText(subtotal)}
                    </span>
                  </div>

                  {msg.text && (
                    <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>
                  )}

                  <button
                    type="button"
                    onClick={confirmOrder}
                    disabled={submitting || items.length === 0}
                    className="btn w-100 fw-bold text-dark py-3 rounded-4"
                    style={{ backgroundColor: GREEN, boxShadow: '0 0 20px rgba(0,245,106,0.4)' }}
                  >
                    <i className="bi bi-check-circle-fill me-2"></i>
                    {submitting ? 'กำลังบันทึกคำสั่งซื้อ...' : 'ยืนยันการสั่งซื้อ'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ข้อความแจ้งกรณีดึงที่อยู่ไม่ได้ ตอนยังไม่มีรายการให้แสดงผลสรุป */}
        {done && msg.text && (
          <div className={`alert alert-${msg.type} py-2 small mt-3`}>{msg.text}</div>
        )}
      </div>
    </div>,
    document.body
  )
}