import { useState, useEffect, useRef } from 'react'
import useProducts from './useProducts'
import ProductList from './ProductList'
import {
  GREEN,
  imgSrc,
  priceText,
  clamp2,
  NoImage,
  CondBadge,
  DiscountBadge,
  discountPercent,
} from './productUi'

function MainHeader({ user, token }) {
  const { products, loading, error, reload } = useProducts()

  // สถานะสไลด์
  const [slide, setSlide] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [paused, setPaused] = useState(false)
  const wrapRef = useRef(null)
  const startX = useRef(0)

  // สินค้าลดราคา (ลดมากสุดก่อน) สูงสุด 5 ชิ้น
  const promo = products
    .filter((p) => discountPercent(p) > 0)
    .sort((a, b) => discountPercent(b) - discountPercent(a))
    .slice(0, 5)

  // สินค้าที่ประกาศล่าสุด สูงสุด 5 ชิ้น (ไม่ซ้ำกับสินค้าลดราคาข้างบน)
  const latest = products.filter((p) => !promo.some((x) => x.id === p.id)).slice(0, 5)

  // สไลด์: อันแรก = ข้อความหลัก แล้วตามด้วยสินค้าลดราคา และสินค้าล่าสุด
  const slides = [...promo, ...latest]
  const total = 1 + slides.length

  // เลื่อนอัตโนมัติทุก 4 วินาที (หยุดเมื่อเอาเมาส์วางหรือกำลังลาก)
  useEffect(() => {
    if (total <= 1 || paused || dragging) return
    const t = setInterval(() => setSlide((s) => (s + 1) % total), 4000)
    return () => clearInterval(t)
  }, [total, paused, dragging, slide])

  // ถ้าจำนวนสไลด์ลดลง (เช่น ลบสินค้า) ไม่ให้ค้างอยู่เกินจำนวน
  useEffect(() => {
    if (slide >= total) setSlide(0)
  }, [total, slide])

  // ลากด้วยเมาส์ / นิ้ว
  const onPointerDown = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    startX.current = e.clientX
    setDragging(true)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e) => {
    if (!dragging) return
    setDragX(e.clientX - startX.current)
  }

  const endDrag = () => {
    if (!dragging) return
    const w = wrapRef.current ? wrapRef.current.offsetWidth : 1
    if (dragX < -w * 0.12) setSlide((s) => (s + 1) % total)
    else if (dragX > w * 0.12) setSlide((s) => (s - 1 + total) % total)
    setDragX(0)
    setDragging(false)
  }

  return (
    <div className="text-white">
      {/* ===== สไลด์ ===== */}
      <div
        className="position-relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          ref={wrapRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          style={{
            overflow: 'hidden',
            cursor: dragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'pan-y',
          }}
        >
          <div
            style={{
              display: 'flex',
              transform: `translateX(calc(${-slide * 100}% + ${dragX}px))`,
              transition: dragging ? 'none' : 'transform 0.6s ease',
            }}
          >
            {/* สไลด์ที่ 1: ข้อความหลัก */}
            <div
              className="d-flex align-items-center"
              style={{
                flex: '0 0 100%',
                minHeight: 360,
                background:
                  'radial-gradient(circle at bottom right, rgba(0,245,106,0.12), transparent 45%), linear-gradient(135deg, #2a303b 0%, #141922 55%, #0a0d12 100%)',
              }}
            >
              <div className="container py-5">
                <span
                  className="d-inline-flex align-items-center rounded-pill px-3 py-1 mb-3 fw-semibold"
                  style={{
                    color: GREEN,
                    fontSize: 14,
                    backgroundColor: 'rgba(0,245,106,0.1)',
                    border: '1px solid rgba(0,245,106,0.35)',
                  }}
                >
                  <i className="bi bi-fire me-2" style={{ color: '#ff7a1a' }}></i>
                  ตลาดคอมพิวเตอร์ฮาร์ดแวร์
                </span>
                <h1 className="fw-bold mb-3" style={{ fontSize: 42, lineHeight: 1.25 }}>
                  จัดเต็มฮาร์ดแวร์{' '}
                  <span style={{ color: GREEN }}>มือ 1 &amp; มือ 2</span> การันตีคุณภาพ
                </h1>
                <p className="fs-6 mb-0" style={{ color: '#9aa3b2', maxWidth: 700 }}>
                  ซื้อ-ขาย การ์ดจอ, CPU, Mainboard, RAM และ SSD/Hard disk
                  พร้อมประกันคุ้มครองสูงสุด เช็กสเปกง่าย จัดส่งไวลุยได้ทันที!
                </p>
              </div>
            </div>

            {/* สไลด์ที่ 2 เป็นต้นไป: สินค้าลดราคา แล้วตามด้วยสินค้าที่ประกาศล่าสุด */}
            {slides.map((p) => {
              const src = imgSrc(p.image_url)
              const discounted = discountPercent(p) > 0
              return (
                <div
                  key={p.id}
                  className="position-relative"
                  style={{ flex: '0 0 100%', minHeight: 360, background: '#0a0d12' }}
                >
                  <div className="position-absolute top-0 start-0 w-100 h-100">
                    {src ? (
                      <img
                        src={src}
                        alt={`${p.brand} ${p.model}`}
                        draggable={false}
                        className="w-100 h-100"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <NoImage size={72} />
                    )}
                  </div>

                  <div
                    className="position-absolute bottom-0 start-0 w-100 pt-5 pb-5"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.92), transparent)' }}
                  >
                    <div className="container">
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <CondBadge condition={p.condition} />
                        {discounted && (
                          <>
                            <DiscountBadge product={p} />
                            <span className="small fw-semibold" style={{ color: '#ff8a96' }}>
                              <i className="bi bi-lightning-charge-fill me-1"></i>
                              สินค้าลดราคา
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="fw-bold fs-3 mt-2 mb-1">
                        {p.brand} {p.model}
                      </h2>
                      <p className="mb-1 small" style={{ color: '#c3cad6', ...clamp2 }}>
                        {p.description}
                      </p>
                      <div className="d-flex align-items-baseline gap-3">
                        <span className="fw-bold fs-4" style={{ color: GREEN }}>
                          {priceText(p.price)}
                        </span>
                        {discounted && (
                          <span
                            className="text-decoration-line-through"
                            style={{ color: '#9aa3b2' }}
                          >
                            {priceText(p.original_price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* จุดบอกตำแหน่งสไลด์ (วางนอกส่วนที่ลากได้ เพื่อให้กดได้) */}
        {total > 1 && (
          <div
            className="position-absolute bottom-0 start-50 translate-middle-x d-flex gap-2 pb-2"
            style={{ zIndex: 2 }}
          >
            {Array.from({ length: total }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`สไลด์ที่ ${i + 1}`}
                onClick={() => setSlide(i)}
                className="border-0 rounded-circle p-0"
                style={{
                  width: 12,
                  height: 12,
                  backgroundColor: i === slide ? GREEN : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ===== แถบหมวดหมู่ + การ์ดสินค้า ===== */}
      <ProductList
        products={products}
        loading={loading}
        error={error}
        user={user}
        token={token}
        onReload={reload}
      />
    </div>
  )
}

export default MainHeader