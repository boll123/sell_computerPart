export const API = 'http://localhost:3001'
export const BG = '#141922'
export const BORDER = '#2a3140'
export const GREEN = '#00f56a'

// รูปที่อัปโหลดเก็บเป็น path (/uploads/...) ส่วนรูปแบบ URL เดิมขึ้นต้นด้วย http
export const imgSrc = (url) => (!url ? null : url.startsWith('http') ? url : `${API}${url}`)
export const priceText = (v) => `฿${Number(v).toLocaleString('th-TH')}`

// ตัดข้อความไม่เกิน 2 บรรทัด
export const clamp2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

// เปอร์เซ็นต์ส่วนลดของสินค้า (0 = ไม่ได้ลดราคา)
export const discountPercent = (p) => {
  const original = Number(p.original_price)
  const price = Number(p.price)
  if (!p.original_price || !(original > price)) return 0
  return Math.max(1, Math.round((1 - price / original) * 100))
}

export function NoImage({ size = 48 }) {
  return (
    <div
      className="w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: '#0e1218', color: '#3a4254', fontSize: size }}
    >
      <i className="bi bi-image"></i>
    </div>
  )
}

export function CondBadge({ condition }) {
  const isNew = condition === 'new'
  const color = isNew ? GREEN : '#ffc107'
  return (
    <span
      className="d-inline-block rounded-2 px-2 py-1 fw-bold"
      style={{
        fontSize: 12,
        color,
        backgroundColor: isNew ? 'rgba(0,245,106,0.15)' : 'rgba(255,193,7,0.15)',
        border: `1px solid ${isNew ? 'rgba(0,245,106,0.5)' : 'rgba(255,193,7,0.5)'}`,
      }}
    >
      {isNew ? 'มือ 1' : 'มือ 2'}
    </span>
  )
}

// ป้ายลดราคา เช่น -15% (ไม่แสดงถ้าสินค้าไม่ได้ลดราคา)
export function DiscountBadge({ product, className = '' }) {
  const pct = discountPercent(product)
  if (!pct) return null
  return (
    <span
      className={`d-inline-block rounded-2 px-2 py-1 fw-bold text-white ${className}`}
      style={{ fontSize: 12, backgroundColor: '#ff4d5e' }}
    >
      -{pct}%
    </span>
  )
}

// ราคาขาย (ถ้าลดราคา จะมีราคาเดิมขีดฆ่าอยู่ด้านบน)
export function Price({ product, size = 20 }) {
  const pct = discountPercent(product)
  return (
    <div className="text-end lh-1">
      {pct > 0 && (
        <div className="small text-decoration-line-through mb-1" style={{ color: '#9aa3b2' }}>
          {priceText(product.original_price)}
        </div>
      )}
      <span className="fw-bold" style={{ color: GREEN, fontSize: size }}>
        {priceText(product.price)}
      </span>
    </div>
  )
}