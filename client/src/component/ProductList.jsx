import { useState } from 'react'
import ProductModal, { Stars } from './ProductModal'
import LikeButton from './LikeButton'
import { useCart } from './Cart'
import {
  BG,
  BORDER,
  GREEN,
  imgSrc,
  clamp2,
  NoImage,
  CondBadge,
  DiscountBadge,
  Price,
} from './productUi'

// value ต้องตรงกับค่า category ที่เก็บในฐานข้อมูล
const TABS = [
  { value: 'ทั้งหมด', label: 'ทั้งหมด', icon: '' },
  { value: 'การ์ดจอ', label: 'การ์ดจอ (GPU)', icon: 'bi-gpu-card' },
  { value: 'CPU', label: 'CPU', icon: '' },
  { value: 'Mainboard', label: 'Mainboard', icon: '' },
  { value: 'RAM', label: 'RAM', icon: 'bi-memory' },
  { value: 'SSD / Hard disk', label: 'SSD/Hard disk', icon: 'bi-device-hdd' },
]

// แถบหมวดหมู่ + จำนวนสินค้า + การ์ดสินค้า + ป็อบอัพดูสินค้า
function ProductList({
  products,
  loading,
  error,
  user,
  token,
  onReload,
  emptyText = 'ยังไม่มีสินค้าในหมวดนี้',
}) {
  const [tab, setTab] = useState('ทั้งหมด')
  const [selected, setSelected] = useState(null)
  const [hoverId, setHoverId] = useState(null) // การ์ดที่เมาส์วางอยู่
  const { addToCart } = useCart()

  // กรองตามหมวดหมู่
  const shown = tab === 'ทั้งหมด' ? products : products.filter((p) => p.category === tab)

  return (
    <>
      {/* ===== แท็บหมวดหมู่ + จำนวนสินค้า ===== */}
      <div className="container-fluid px-3 px-lg-5 pt-4">
        <div className="row align-items-center g-3">
          <div className="col-12 col-lg">
            <div className="d-flex gap-2 overflow-auto pb-1">
              {TABS.map((t) => {
                const active = tab === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    className="btn fw-semibold rounded-4 px-3 py-2 text-nowrap"
                    style={{
                      backgroundColor: active ? GREEN : BG,
                      color: active ? '#000' : '#fff',
                      border: `1px solid ${active ? GREEN : BORDER}`,
                      boxShadow: active ? '0 0 15px rgba(0,245,106,0.4)' : 'none',
                    }}
                  >
                    {t.icon && (
                      <i
                        className={`bi ${t.icon} me-2`}
                        style={{ color: active ? '#000' : GREEN }}
                      ></i>
                    )}
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="col-12 col-lg-auto text-secondary">
            พบสินค้า{' '}
            <span className="fw-bold" style={{ color: GREEN }}>
              {shown.length}
            </span>{' '}
            รายการ
          </div>
        </div>
      </div>

      {/* ===== การ์ดสินค้า ===== */}
      <div className="container-fluid px-3 px-lg-5 py-4">
        {loading && <p className="text-secondary text-center py-5">กำลังโหลดสินค้า...</p>}

        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && !error && shown.length === 0 && (
          <p className="text-secondary text-center py-5">{emptyText}</p>
        )}

        <div className="row g-3">
          {shown.map((p) => {
            const src = imgSrc(p.image_url)
            const hover = hoverId === p.id
            return (
              <div key={p.id} className="col-12 col-sm-6 col-lg-4 col-xl-3">
                {/* คลิกที่ไหนก็ได้บนการ์ดเพื่อเปิดป็อบอัพดูสินค้า */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelected(p)}
                  onKeyDown={(e) => {
                    // รับเฉพาะตอนโฟกัสอยู่ที่การ์ดเอง (ไม่ใช่ปุ่มข้างใน)
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault()
                      setSelected(p)
                    }
                  }}
                  onMouseEnter={() => setHoverId(p.id)}
                  onMouseLeave={() => setHoverId(null)}
                  className="h-100 rounded-4 overflow-hidden d-flex flex-column"
                  style={{
                    backgroundColor: BG,
                    border: `1px solid ${hover ? GREEN : BORDER}`,
                    cursor: 'pointer',
                    transform: hover ? 'translateY(-4px)' : 'none',
                    boxShadow: hover ? '0 8px 24px rgba(0,245,106,0.15)' : 'none',
                    transition:
                      'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                >
                  {/* รูป + ป้ายสภาพ/ลดราคา + ปุ่มถูกใจ (พร้อมยอดคนกดใจ) */}
                  <div className="position-relative" style={{ height: 170 }}>
                    {src ? (
                      <img
                        src={src}
                        alt={`${p.brand} ${p.model}`}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <NoImage />
                    )}
                    <div className="position-absolute top-0 start-0 m-2 d-flex flex-column align-items-start gap-1">
                      <CondBadge condition={p.condition} />
                      <DiscountBadge product={p} />
                    </div>
                    <div className="position-absolute top-0 end-0 m-2">
                      <LikeButton
                        product={p}
                        className="rounded-pill px-2 py-1"
                        style={{
                          backgroundColor: 'rgba(10,13,18,0.85)',
                          border: `1px solid ${BORDER}`,
                        }}
                      />
                    </div>
                  </div>

                  {/* รายละเอียด */}
                  <div className="p-3 d-flex flex-column flex-grow-1">
                    <h6 className="fw-bold mb-1 text-white" style={clamp2}>
                      {p.brand} {p.model}
                    </h6>

                    {/* ดาวเฉลี่ย */}
                    <div className="d-flex align-items-center gap-2 mb-2" style={{ minHeight: 20 }}>
                      {p.review_count > 0 ? (
                        <>
                          <Stars value={p.avg_rating} size={14} />
                          <span className="fw-bold small" style={{ color: '#ffc107' }}>
                            {p.avg_rating.toFixed(1)}
                          </span>
                          <span className="small text-secondary">({p.review_count})</span>
                        </>
                      ) : (
                        <span className="small text-secondary">ยังไม่มีรีวิว</span>
                      )}
                    </div>

                    <p className="small mb-3" style={{ color: '#9aa3b2', ...clamp2 }}>
                      {p.description}
                    </p>

                    {/* ราคา (ถ้าลดราคา จะมีราคาเดิมขีดฆ่า) */}
                    <div className="d-flex justify-content-between align-items-end mt-auto mb-3">
                      <span className="small text-secondary">ราคา</span>
                      <Price product={p} size={20} />
                    </div>

                    <div className="row g-2">
                      <div className="col-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelected(p)
                          }}
                          className="btn btn-sm w-100 text-white fw-semibold py-2"
                          style={{ backgroundColor: '#0a0d12', border: `1px solid ${BORDER}` }}
                        >
                          <i className="bi bi-eye me-1"></i>
                          ดูสินค้า
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            addToCart(p)
                          }}
                          className="btn btn-sm w-100 fw-semibold py-2"
                          style={{
                            backgroundColor: '#0a0d12',
                            border: `1px solid ${BORDER}`,
                            color: GREEN,
                          }}
                        >
                          <i className="bi bi-cart-plus-fill me-1"></i>
                          ใส่ตะกร้า
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== หน้าต่างดูรายละเอียดสินค้า ===== */}
      {selected && (
        <ProductModal
          product={selected}
          user={user}
          token={token}
          onClose={() => setSelected(null)}
          onReviewed={onReload}
        />
      )}
    </>
  )
}

export default ProductList