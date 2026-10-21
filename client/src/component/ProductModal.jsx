import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import LikeButton from './LikeButton'
import { useCart } from './Cart'
import { DiscountBadge, discountPercent } from './productUi'

const API = 'http://localhost:3001'
const PANEL = '#0f131a'
const BOX = '#0a0d12'
const BORDER = '#2a3140'
const GREEN = '#00f56a'
const GOLD = '#ffc107'

const imgSrc = (url) => (!url ? null : url.startsWith('http') ? url : `${API}${url}`)
const priceText = (v) => `฿${Number(v).toLocaleString('th-TH')}`
const productCode = (id) => `AD${String(id).padStart(6, '0')}`
// แตกรายละเอียดเป็นข้อๆ โดยตัดที่ , / หรือขึ้นบรรทัดใหม่
const specList = (text) =>
  String(text || '')
    .split(/[,/\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)

// ดาวแบบแสดงผล (รองรับครึ่งดาวสำหรับค่าเฉลี่ย) ใช้ร่วมกับหน้าหลัก
export function Stars({ value, size = 16 }) {
  return (
    <span style={{ color: GOLD, fontSize: size, letterSpacing: 2 }} aria-label={`${value} จาก 5 ดาว`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i
          key={i}
          className={`bi ${
            value >= i ? 'bi-star-fill' : value >= i - 0.5 ? 'bi-star-half' : 'bi-star'
          }`}
        ></i>
      ))}
    </span>
  )
}

// ดาวแบบให้กดเลือก
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div className="d-inline-flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i} ดาว`}
          onMouseEnter={() => setHover(i)}
          onClick={() => onChange(i)}
          className="btn p-0 border-0 lh-1"
          style={{ color: GOLD, fontSize: 30 }}
        >
          <i className={`bi ${shown >= i ? 'bi-star-fill' : 'bi-star'}`}></i>
        </button>
      ))}
    </div>
  )
}

function Pill({ children, color = '#fff' }) {
  return (
    <span
      className="d-inline-block rounded-pill px-3 py-1 small fw-semibold"
      style={{ backgroundColor: BOX, border: `1px solid ${BORDER}`, color }}
    >
      {children}
    </span>
  )
}

function Row({ label, children }) {
  return (
    <div className="d-flex align-items-center gap-3 mb-2">
      <span className="fw-bold small" style={{ minWidth: 95 }}>
        {label} :
      </span>
      <div className="d-flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function ProductModal({ product: p, user, token, onClose, onReviewed }) {
  const [qty, setQty] = useState(1)
  const { addToCart, buyNow } = useCart()
  const [data, setData] = useState({ average: 0, count: 0, reviews: [] })
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  const src = imgSrc(p.image_url)
  const isNew = p.condition === 'new'
  const isSeller = !!user && user.username === p.seller
  const mine = user ? data.reviews.find((r) => r.user_id === user.id) : null
  const specs = specList(p.description)

  // ปิดด้วยปุ่ม Esc และล็อกการเลื่อนหน้าหลังป็อบอัพ
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  // โหลดรีวิวของสินค้านี้
  const loadReviews = async () => {
    try {
      const res = await fetch(`${API}/api/products/${p.id}/reviews`)
      if (!res.ok) throw new Error('fail')
      const json = await res.json()
      setData(json)

      // ถ้าเคยรีวิวแล้ว เติมค่าเดิมในฟอร์มให้แก้ไขได้
      const old = user ? json.reviews.find((r) => r.user_id === user.id) : null
      if (old) {
        setRating(old.rating)
        setComment(old.comment)
      }
    } catch {
      setMsg({ type: 'danger', text: 'โหลดรีวิวไม่สำเร็จ' })
    } finally {
      setLoadingReviews(false)
    }
  }

  useEffect(() => {
    loadReviews()
  }, [p.id])

  const submitReview = async (e) => {
    e.preventDefault()
    if (!rating) {
      setMsg({ type: 'danger', text: 'กรุณาให้ดาวก่อนส่งรีวิว' })
      return
    }

    setSending(true)
    setMsg({ type: '', text: '' })

    try {
      const res = await fetch(`${API}/api/products/${p.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ rating, comment }),
      })
      const json = await res.json()

      if (res.ok) {
        setMsg({ type: 'success', text: json.message })
        await loadReviews()
        // แจ้งหน้าหลักให้โหลดสินค้าใหม่ เพื่ออัปเดตดาวเฉลี่ยบนการ์ด
        if (onReviewed) onReviewed()
      } else {
        setMsg({ type: 'danger', text: json.message })
      }
    } catch {
      setMsg({ type: 'danger', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' })
    } finally {
      setSending(false)
    }
  }

  const badgeStyle = isNew
    ? { color: GREEN, backgroundColor: 'rgba(0,245,106,0.15)', border: '1px solid rgba(0,245,106,0.5)' }
    : { color: GOLD, backgroundColor: 'rgba(255,193,7,0.15)', border: '1px solid rgba(255,193,7,0.5)' }

  return (
    <div
      onClick={onClose}
      className="position-fixed top-0 start-0 w-100 h-100 overflow-auto p-3"
      style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1050 }}
    >
      <div
        data-bs-theme="dark"
        onClick={(e) => e.stopPropagation()}
        className="mx-auto my-3 position-relative rounded-4 p-3 p-md-4 text-white"
        style={{ maxWidth: 980, backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
      >
        {/* ปุ่มปิด */}
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="btn btn-dark rounded-circle position-absolute top-0 end-0 m-3 p-0 d-flex align-items-center justify-content-center"
          style={{ width: 36, height: 36, zIndex: 2, border: `1px solid ${BORDER}` }}
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <div className="row g-4">
          {/* ===== ซ้าย: รูปสินค้า ===== */}
          <div className="col-12 col-md-6">
            <div
              className="position-relative rounded-4 p-2"
              style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
            >
              <span
                className="position-absolute top-0 start-0 m-3 rounded-2 px-2 py-1 fw-bold"
                style={{ zIndex: 1, fontSize: 12, ...badgeStyle }}
              >
                {isNew ? 'มือ 1' : 'มือ 2'}
              </span>

              <div style={{ height: 330 }}>
                {src ? (
                  <img
                    src={src}
                    alt={`${p.brand} ${p.model}`}
                    className="w-100 h-100 rounded-3"
                    style={{ objectFit: 'contain' }}
                  />
                ) : (
                  <div
                    className="w-100 h-100 d-flex align-items-center justify-content-center"
                    style={{ color: '#3a4254', fontSize: 72 }}
                  >
                    <i className="bi bi-image"></i>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ===== ขวา: รายละเอียด ===== */}
          <div className="col-12 col-md-6">
            <div className="pe-4">
              <div className="fw-bold small text-uppercase" style={{ color: GREEN }}>
                {p.brand}
              </div>
              <h3 className="fw-bold mt-1 mb-1">
                {p.brand} {p.model}
              </h3>
              <div className="small text-secondary mb-3">รหัสสินค้า : {productCode(p.id)}</div>
            </div>

            {/* กล่องราคา (ถ้าลดราคา จะมีป้าย -X% และราคาเดิมขีดฆ่า) */}
            <div
              className="d-flex justify-content-between align-items-center rounded-4 px-3 py-3 mb-3"
              style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
            >
              <span className="fw-bold">
                ราคาขาย
                <DiscountBadge product={p} className="ms-2" />
              </span>
              <div className="text-end lh-1">
                {discountPercent(p) > 0 && (
                  <div className="text-decoration-line-through text-secondary mb-1">
                    {priceText(p.original_price)}
                  </div>
                )}
                <span
                  className="fw-bold"
                  style={{ color: GREEN, fontSize: 34, textShadow: '0 0 14px rgba(0,245,106,0.55)' }}
                >
                  {priceText(p.price)}
                </span>
              </div>
            </div>

            {/* กล่องสเปก */}
            <div
              className="rounded-4 px-3 py-3 mb-3"
              style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
            >
              {specs.map((s, i) => (
                <div key={i} className="d-flex align-items-start gap-2 mb-1 small">
                  <i className="bi bi-circle-fill mt-1" style={{ color: GREEN, fontSize: 6 }}></i>
                  <span>{s}</span>
                </div>
              ))}
            </div>

            <Row label="สภาพสินค้า">
              <Pill color={isNew ? GREEN : GOLD}>{isNew ? 'มือ 1 (สินค้าใหม่)' : 'มือ 2 (สินค้าใช้แล้ว)'}</Pill>
            </Row>
            <Row label="หมวดหมู่">
              <Pill>{p.category}</Pill>
            </Row>
            <Row label="ผู้ขาย">
              <Pill>{p.seller}</Pill>
            </Row>
            <Row label="ติดต่อ">
              <Pill color={GREEN}>{p.contact}</Pill>
            </Row>

            <hr className="my-3" style={{ borderColor: BORDER, opacity: 1 }} />

            {/* จำนวน */}
            <div className="d-flex align-items-center justify-content-between mb-3">
              <span className="fw-bold">จำนวน :</span>
              <div
                className="d-inline-flex align-items-center rounded-pill p-1"
                style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
              >
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="btn btn-dark rounded-circle p-0 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36 }}
                  aria-label="ลดจำนวน"
                >
                  <i className="bi bi-dash-lg"></i>
                </button>
                <span className="px-4 fw-bold">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(99, q + 1))}
                  className="btn btn-dark rounded-circle p-0 d-flex align-items-center justify-content-center"
                  style={{ width: 36, height: 36 }}
                  aria-label="เพิ่มจำนวน"
                >
                  <i className="bi bi-plus-lg"></i>
                </button>
              </div>
            </div>

            {/* ปุ่มต่างๆ */}
            <div className="row g-2">
              <div className="col-auto">
                <LikeButton
                  product={p}
                  size={18}
                  className="py-2 px-3"
                  style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
                />
              </div>
              <div className="col">
                <button
                  type="button"
                  onClick={() => addToCart(p, qty)}
                  className="btn w-100 fw-bold py-2"
                  style={{ backgroundColor: BOX, color: GREEN, border: `1px solid ${GREEN}` }}
                >
                  <i className="bi bi-cart-plus-fill me-2"></i>
                  เพิ่มลงตะกร้า
                </button>
              </div>
              <div className="col">
                <button
                  type="button"
                  onClick={() => {
                    if (buyNow(p, qty)) onClose()
                  }}
                  className="btn w-100 fw-bold text-dark py-2"
                  style={{ backgroundColor: GREEN, boxShadow: '0 0 18px rgba(0,245,106,0.45)' }}
                >
                  <i className="bi bi-bag-fill me-2"></i>
                  ซื้อเลย
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ===== รีวิวสินค้า ===== */}
        <hr className="my-4" style={{ borderColor: BORDER, opacity: 1 }} />

        <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
          <h5 className="fw-bold mb-0">รีวิวสินค้า</h5>
          {data.count > 0 && (
            <div className="d-flex align-items-center gap-2">
              <Stars value={data.average} size={18} />
              <span className="fw-bold" style={{ color: GOLD }}>
                {data.average.toFixed(1)}
              </span>
              <span className="small text-secondary">({data.count} รีวิว)</span>
            </div>
          )}
        </div>

        {/* ฟอร์มเขียนรีวิว */}
        {!user ? (
          <div
            className="rounded-4 p-3 text-center small mb-4"
            style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
          >
            <Link
              to="/login"
              onClick={onClose}
              className="fw-bold text-decoration-none"
              style={{ color: GREEN }}
            >
              เข้าสู่ระบบ
            </Link>{' '}
            เพื่อเขียนรีวิวสินค้านี้
          </div>
        ) : isSeller ? (
          <div
            className="rounded-4 p-3 text-center small text-secondary mb-4"
            style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
          >
            คุณเป็นผู้ขายสินค้านี้ จึงไม่สามารถรีวิวสินค้าของตัวเองได้
          </div>
        ) : (
          <form
            onSubmit={submitReview}
            className="rounded-4 p-3 mb-4"
            style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
          >
            <div className="fw-semibold small mb-2">
              {mine ? 'แก้ไขรีวิวของคุณ' : 'ให้คะแนนและเขียนรีวิว'}
            </div>

            <div className="d-flex align-items-center gap-3 mb-2">
              <StarInput value={rating} onChange={setRating} />
              <span className="small text-secondary">{rating ? `${rating} / 5 ดาว` : 'แตะเพื่อให้ดาว'}</span>
            </div>

            <textarea
              rows={3}
              maxLength={1000}
              className="form-control text-white shadow-none rounded-3 mb-2"
              style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
              placeholder="เล่าประสบการณ์เกี่ยวกับสินค้านี้..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />

            {msg.text && (
              <div className={`alert alert-${msg.type} py-2 small`}>{msg.text}</div>
            )}

            <button
              type="submit"
              disabled={sending}
              className="btn fw-bold text-dark px-4"
              style={{ backgroundColor: GREEN }}
            >
              <i className="bi bi-send-fill me-2"></i>
              {sending ? 'กำลังบันทึก...' : mine ? 'บันทึกการแก้ไข' : 'ส่งรีวิว'}
            </button>
          </form>
        )}

        {/* รายการรีวิว */}
        {loadingReviews ? (
          <p className="text-secondary small mb-0">กำลังโหลดรีวิว...</p>
        ) : data.reviews.length === 0 ? (
          <p className="text-secondary small text-center mb-0">
            ยังไม่มีรีวิว เป็นคนแรกที่รีวิวสินค้านี้
          </p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {data.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-4 p-3"
                style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
              >
                <div className="d-flex align-items-center gap-3 mb-2">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-dark text-uppercase"
                    style={{ width: 38, height: 38, backgroundColor: GREEN }}
                  >
                    {r.username.charAt(0)}
                  </div>
                  <div className="flex-grow-1">
                    <div className="fw-semibold small">
                      {r.username}
                      {user && r.user_id === user.id && (
                        <span className="ms-2 small" style={{ color: GREEN }}>
                          (คุณ)
                        </span>
                      )}
                    </div>
                    <Stars value={r.rating} size={14} />
                  </div>
                  <span className="small text-secondary">
                    {new Date(r.created_at).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="mb-0 small" style={{ color: '#c3cad6', whiteSpace: 'pre-wrap' }}>
                  {r.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductModal