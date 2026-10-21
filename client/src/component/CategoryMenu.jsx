import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import useProducts from './useProducts'
import LikeButton from './LikeButton'
import { useCart } from './Cart'
import { BG, BORDER, GREEN, priceText } from './productUi'
import { CATEGORIES } from './categories'

const PANEL = '#161c27'
const BOX = '#0a0d12'
const MUTED = '#9aa3b2'

function CategoryMenu({ open, onOpen, onClose, links = [] }) {
  const navigate = useNavigate()
  const { products, reload } = useProducts()
  const { addToCart } = useCart()

  const [category, setCategory] = useState(null) // หมวดที่เปิดตารางอยู่ (null = ปิด)
  const [selected, setSelected] = useState([]) // id สินค้าที่ติ๊กไว้
  const [slideIn, setSlideIn] = useState(false)

  const active = open || category !== null
  const cat = CATEGORIES.find((c) => c.value === category)
  const list = category ? products.filter((p) => p.category === category) : []
  const count = selected.length

  // เลื่อนแผงเข้ามาทางซ้าย
  useEffect(() => {
    if (!open) {
      setSlideIn(false)
      return
    }
    const id = requestAnimationFrame(() => setSlideIn(true))
    return () => cancelAnimationFrame(id)
  }, [open])

  // กด Esc เพื่อปิด และล็อกการเลื่อนหน้าด้านหลัง
  useEffect(() => {
    if (!active) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose()
        setCategory(null)
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [active, onClose])

  const openCategory = (value) => {
    reload() // โหลดสินค้าล่าสุดก่อนแสดงตาราง
    setCategory(value)
    onClose()
  }

  const backToMenu = () => {
    setCategory(null)
    onOpen()
  }

  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const searchSelected = () => {
    if (count === 0) return
    setCategory(null)
    navigate(`/selected?ids=${selected.join(',')}`)
  }

  return (
    <>
      {/* ===== แผงหมวดหมู่ (รูปที่ 1) ===== */}
      {open &&
        createPortal(
          <div
            onClick={onClose}
            className="position-fixed top-0 start-0 w-100 h-100"
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
                borderRight: `1px solid ${BORDER}`,
                transform: slideIn ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
              }}
            >
              {/* หัวแผง */}
              <div
                className="d-flex align-items-center justify-content-between px-4 py-3"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <h5 className="fw-bold mb-0">
                  <i className="bi bi-boxes me-2" style={{ color: GREEN }}></i>
                  หมวดหมู่อุปกรณ์คอมพิวเตอร์
                </h5>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="ปิด"
                  className="btn fs-5 p-0 lh-1"
                  style={{ color: MUTED }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* เนื้อหา */}
              <div className="flex-grow-1 overflow-auto px-4 py-3">
                {/* ลิงก์เมนูหลัก (แสดงเฉพาะจอเล็ก เพราะเมนูบน Header ถูกซ่อน) */}
                {links.length > 0 && (
                  <div className="d-lg-none mb-3">
                    <div className="small mb-2" style={{ color: MUTED }}>
                      เมนูหลัก
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {links.map((l) => (
                        <Link
                          key={l.name}
                          to={l.to}
                          onClick={onClose}
                          className="text-decoration-none text-white small fw-semibold rounded-pill px-3 py-2"
                          style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
                        >
                          <i className={`bi ${l.icon} me-1`} style={{ color: l.color }}></i>
                          {l.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="d-flex flex-column gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => openCategory(c.value)}
                      className="btn d-flex align-items-center gap-3 text-start text-white rounded-4 p-3 w-100"
                      style={{ backgroundColor: PANEL, border: `1px solid ${BORDER}` }}
                    >
                      <span
                        className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                        style={{
                          width: 50,
                          height: 50,
                          fontSize: 24,
                          color: c.color,
                          backgroundColor: `${c.color}22`,
                          border: `1px solid ${c.color}66`,
                        }}
                      >
                        <i className={`bi ${c.icon}`}></i>
                      </span>
                      <span className="flex-grow-1">
                        <span className="d-block fw-bold">{c.title}</span>
                        <span className="d-block small" style={{ color: MUTED }}>
                          {c.sub}
                        </span>
                      </span>
                      <i className="bi bi-chevron-right" style={{ color: MUTED }}></i>
                    </button>
                  ))}
                </div>
              </div>

              {/* ท้ายแผง */}
              <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid ${BORDER}` }}>
                <div className="small" style={{ color: MUTED }}>
                  ADBanaHaveCPU Market System v2.5
                </div>
                <div className="small fw-bold" style={{ color: GREEN }}>
                  รับประกันสินค้าทุกชิ้น พร้อมศูนย์บริการ 24 ชม.
                </div>
              </div>
            </aside>
          </div>,
          document.body
        )}

      {/* ===== ป็อบอัพตารางเลือกสินค้า (รูปที่ 2) ===== */}
      {cat &&
        createPortal(
          <div
            onClick={() => setCategory(null)}
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
            style={{
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              zIndex: 1060,
            }}
          >
            <div
              data-bs-theme="dark"
              onClick={(e) => e.stopPropagation()}
              className="w-100 d-flex flex-column rounded-4 text-white"
              style={{
                maxWidth: 860,
                maxHeight: '90vh',
                backgroundColor: BG,
                border: `1px solid ${BORDER}`,
                boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
              }}
            >
              {/* หัวป็อบอัพ */}
              <div
                className="d-flex align-items-center gap-3 px-4 py-3"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <button
                  type="button"
                  onClick={backToMenu}
                  title="กลับไปเลือกหมวดหมู่"
                  className="btn p-0 fs-5 lh-1"
                  style={{ color: MUTED }}
                >
                  <i className="bi bi-arrow-left"></i>
                </button>
                <span
                  className="d-flex align-items-center justify-content-center rounded-3"
                  style={{
                    width: 40,
                    height: 40,
                    fontSize: 20,
                    color: cat.color,
                    backgroundColor: `${cat.color}22`,
                    border: `1px solid ${cat.color}66`,
                  }}
                >
                  <i className={`bi ${cat.icon}`}></i>
                </span>
                <div className="flex-grow-1">
                  <h5 className="fw-bold mb-0">{cat.title}</h5>
                  <div className="small" style={{ color: MUTED }}>
                    พบสินค้า{' '}
                    <span className="fw-bold" style={{ color: GREEN }}>
                      {list.length}
                    </span>{' '}
                    รายการ ติ๊กเลือกสินค้าที่ต้องการได้เลย
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  aria-label="ปิด"
                  className="btn fs-5 p-0 lh-1"
                  style={{ color: MUTED }}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>

              {/* ตารางสินค้า */}
              <div className="flex-grow-1 overflow-auto px-3">
                <table
                  className="table align-middle mb-0"
                  style={{
                    '--bs-table-bg': 'transparent',
                    '--bs-table-border-color': BORDER,
                    '--bs-table-color': '#fff',
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        { t: 'ยี่ห้อ', c: '' },
                        { t: 'รุ่น', c: '' },
                        { t: 'สเปก', c: 'd-none d-md-table-cell' },
                        { t: 'ราคา', c: 'text-end' },
                        { t: 'จัดการ', c: 'text-center' },
                      ].map((h) => (
                        <th
                          key={h.t}
                          className={h.c}
                          style={{
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                            backgroundColor: BG,
                            color: '#fff',
                          }}
                        >
                          {h.t}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-5" style={{ color: MUTED }}>
                          ยังไม่มีสินค้าในหมวดนี้
                        </td>
                      </tr>
                    )}

                    {list.map((p) => {
                      const checked = selected.includes(p.id)
                      return (
                        <tr
                          key={p.id}
                          style={{
                            '--bs-table-bg': checked ? 'rgba(0,245,106,0.08)' : 'transparent',
                          }}
                        >
                          <td className="fw-semibold">{p.brand}</td>
                          <td className="fw-bold">{p.model}</td>
                          <td className="d-none d-md-table-cell small">
                            <div className="text-truncate" style={{ maxWidth: 220, color: MUTED }}>
                              {p.description}
                            </div>
                          </td>
                          <td className="text-end fw-bold text-nowrap" style={{ color: GREEN }}>
                            {priceText(p.price)}
                          </td>
                          <td>
                            <div className="d-flex justify-content-center align-items-center gap-2">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggle(p.id)}
                                aria-label={`เลือก ${p.brand} ${p.model}`}
                                style={{
                                  width: 20,
                                  height: 20,
                                  accentColor: GREEN,
                                  cursor: 'pointer',
                                }}
                              />
                              <LikeButton product={p} size={15} className="p-0" />
                              <button
                                type="button"
                                title="ใส่ตะกร้า"
                                onClick={() => addToCart(p)}
                                className="btn btn-sm lh-1"
                                style={{
                                  backgroundColor: BOX,
                                  border: `1px solid ${BORDER}`,
                                  color: GREEN,
                                }}
                              >
                                <i className="bi bi-cart-fill"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* ปุ่มด้านล่าง */}
              <div
                className="d-flex flex-wrap align-items-center justify-content-end gap-2 px-4 py-3"
                style={{ borderTop: `1px solid ${BORDER}` }}
              >
                <span className="me-auto small" style={{ color: MUTED }}>
                  เลือกแล้ว{' '}
                  <span className="fw-bold" style={{ color: GREEN }}>
                    {count}
                  </span>{' '}
                  รายการ
                </span>

                <button
                  type="button"
                  onClick={searchSelected}
                  disabled={count === 0}
                  className="btn fw-bold text-dark px-4 py-2 rounded-3"
                  style={{
                    backgroundColor: GREEN,
                    boxShadow: count ? '0 0 18px rgba(0,245,106,0.4)' : 'none',
                  }}
                >
                  ค้นหารายการที่เลือก{count > 0 ? ` (${count})` : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setSelected([])}
                  disabled={count === 0}
                  className="btn text-white px-4 py-2 rounded-3"
                  style={{ backgroundColor: BORDER }}
                >
                  ลบทิ้งหมด
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}

export default CategoryMenu