import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import useProducts from './useProducts'
import ProductModal from './ProductModal'
import { BG, BORDER, GREEN, imgSrc, priceText, NoImage } from './productUi'
import { splitWords, matchProducts } from './searchUtils'

const LIGHT = '#d5d9e0'
const MAX_PRODUCTS = 6
const MAX_SUGGEST = 5

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// ทำตัวหนาสีขาวเฉพาะคำที่ตรงกับที่พิมพ์
function Highlight({ text, words }) {
  if (!words.length) return text
  const re = new RegExp(`(${words.map(escapeRe).join('|')})`, 'gi')
  return text.split(re).map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} style={{ color: '#fff' }}>
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function SearchBox({ user, token }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const q = params.get('q') || ''

  const { products, loading, reload } = useProducts()
  const [keyword, setKeyword] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [hoverId, setHoverId] = useState(null)
  const wrapRef = useRef(null)

  // อยู่หน้าค้นหา: แสดงคำค้นในช่อง / หน้าอื่น: ล้างช่อง
  // และปิดแผงกับป็อบอัพสินค้าทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    setKeyword(pathname === '/search' ? q : '')
    setOpen(false)
    setSelected(null)
  }, [pathname, q])

  // กดนอกช่องค้นหา ให้ปิดแผง
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const text = keyword.trim()
  const words = splitWords(text)
  const matched = text ? matchProducts(products, text) : []
  const suggestions = [...new Set(matched.map((p) => `${p.brand} ${p.model}`))].slice(0, MAX_SUGGEST)
  const list = matched.slice(0, MAX_PRODUCTS)

  const goSearch = (value) => {
    const v = value.trim()
    if (!v) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(v)}`)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    goSearch(keyword)
  }

  return (
    <div ref={wrapRef}>
      {/* ช่องค้นหา */}
      <form
        onSubmit={handleSubmit}
        className="d-flex align-items-center rounded-3 px-3"
        style={{ backgroundColor: '#0e1218', border: `1px solid ${BORDER}` }}
      >
        <button
          type="submit"
          title="ค้นหา"
          className="btn p-0 border-0 lh-1"
          style={{ color: LIGHT }}
        >
          <i className="bi bi-search"></i>
        </button>
        <input
          type="text"
          className="form-control border-0 shadow-none bg-transparent text-white"
          placeholder="ค้นหา CPU, การ์ดจอ,"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value)
            setOpen(true)
          }}
          onFocus={() => {
            setOpen(true)
            reload() // โหลดสินค้าล่าสุดทุกครั้งที่คลิกช่องค้นหา
          }}
          onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
          autoComplete="off"
        />
      </form>

      {/* แผงผลลัพธ์ (วางเทียบกับขอบล่างของ Header) */}
      {open && text && (
        <div
          className="position-absolute top-100 text-white rounded-4"
          style={{
            left: 12,
            right: 12,
            margin: '4px auto 0',
            maxWidth: 1100,
            backgroundColor: BG,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 12px 40px rgba(0,0,0,0.7)',
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
          }}
        >
          {loading && matched.length === 0 ? (
            <div className="text-center text-secondary py-5">กำลังค้นหา...</div>
          ) : matched.length === 0 ? (
            // ไม่พบสินค้า
            <div className="text-center py-5 px-3">
              <i className="bi bi-search" style={{ fontSize: 36, color: '#3a4254' }}></i>
              <div className="fw-bold fs-5 mt-2">ไม่พบสินค้า</div>
              <div className="small text-secondary">
                ไม่พบสินค้าที่ตรงกับ “{text}” ลองใช้คำค้นอื่น
              </div>
            </div>
          ) : (
            <div className="row g-0">
              {/* ซ้าย: ชื่อสินค้าที่ตรงกับคำค้น (ซ่อนบนจอเล็ก) */}
              <div
                className="d-none d-lg-block col-lg-4 p-4"
                style={{ borderRight: `1px solid ${BORDER}` }}
              >
                <h6 className="fw-bold pb-2 mb-2" style={{ borderBottom: `1px solid ${BORDER}` }}>
                  ตรงกับสินค้าที่ค้นหา
                </h6>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => goSearch(s)}
                    className="btn w-100 text-start px-1 py-2 small text-truncate border-0 rounded-0"
                    style={{ color: '#9aa3b2', borderBottom: `1px solid ${BORDER}` }}
                  >
                    <Highlight text={s} words={words} />
                  </button>
                ))}
              </div>

              {/* ขวา: สินค้าที่เกี่ยวข้อง */}
              <div className="col-12 col-lg-8 p-3 p-lg-4">
                <div
                  className="d-flex justify-content-between align-items-center pb-2 mb-2"
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <h6 className="fw-bold mb-0">
                    สินค้าที่เกี่ยวข้อง{' '}
                    <span className="small fw-normal text-secondary">({matched.length})</span>
                  </h6>
                  <button
                    type="button"
                    onClick={() => goSearch(text)}
                    className="btn btn-sm rounded-pill px-3"
                    style={{ color: GREEN, border: `1px solid ${GREEN}` }}
                  >
                    ดูทั้งหมด <i className="bi bi-chevron-right"></i>
                  </button>
                </div>

                {list.map((p) => {
                  const src = imgSrc(p.image_url)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelected(p)
                        setOpen(false)
                      }}
                      onMouseEnter={() => setHoverId(p.id)}
                      onMouseLeave={() => setHoverId(null)}
                      className="btn w-100 text-start d-flex align-items-center gap-3 p-2 rounded-3 border-0 text-white"
                      style={{ backgroundColor: hoverId === p.id ? '#1d2430' : 'transparent' }}
                    >
                      <div
                        className="rounded-3 overflow-hidden flex-shrink-0"
                        style={{ width: 64, height: 64, border: `1px solid ${BORDER}` }}
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
                        <div className="small fw-semibold text-uppercase" style={{ color: GREEN }}>
                          {p.brand}
                        </div>
                        <div className="fw-bold text-truncate">
                          {p.brand} {p.model}
                        </div>
                        <div className="small text-truncate" style={{ color: '#9aa3b2' }}>
                          {p.description}
                        </div>
                      </div>

                      <div className="fw-bold text-nowrap" style={{ color: GREEN }}>
                        {priceText(p.price)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ป็อบอัพรายละเอียดสินค้า (วางที่ body เพื่อไม่ให้ติดข้อจำกัดของ Header) */}
      {selected &&
        createPortal(
          <ProductModal
            product={selected}
            user={user}
            token={token}
            onClose={() => setSelected(null)}
            onReviewed={reload}
          />,
          document.body
        )}
    </div>
  )
}

export default SearchBox