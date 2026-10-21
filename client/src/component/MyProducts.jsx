import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  API,
  BG,
  BORDER,
  GREEN,
  imgSrc,
  priceText,
  NoImage,
  CondBadge,
  DiscountBadge,
  discountPercent,
} from './productUi'

const RED = '#ff4d5e'
const MUTED = '#9aa3b2'
const BOX = '#0e1218'

const STATUS = {
  available: { text: 'กำลังขาย', color: GREEN },
  sold: { text: 'ขายแล้ว', color: '#fbbf24' },
  hidden: { text: 'ซ่อนอยู่', color: MUTED },
}

function MyProducts({ token, onExpired }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState({ type: '', text: '' })

  const [editing, setEditing] = useState(null) // สินค้าที่กำลังปรับราคา
  const [newPrice, setNewPrice] = useState('')
  const [deleting, setDeleting] = useState(null) // สินค้าที่กำลังจะลบ
  const [busy, setBusy] = useState(false)
  const [modalMsg, setModalMsg] = useState('')

  // โหลดสินค้าที่ผู้ใช้ประกาศขาย
  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/my-products`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        onExpired()
        return
      }
      if (!res.ok) throw new Error('fail')
      setItems(await res.json())
    } catch {
      setNotice({ type: 'danger', text: 'โหลดสินค้าของคุณไม่สำเร็จ ตรวจสอบว่า server ทำงานอยู่' })
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  // กด Esc เพื่อปิดหน้าต่างที่เปิดอยู่
  useEffect(() => {
    if (!editing && !deleting) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) {
        setEditing(null)
        setDeleting(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing, deleting, busy])

  const openEdit = (p) => {
    setEditing(p)
    setNewPrice(String(Number(p.price)))
    setModalMsg('')
  }

  // ราคาปกติที่ใช้เทียบ (ถ้าเคยลดราคาไว้ ใช้ราคาปกติเดิม)
  const base = editing
    ? editing.original_price != null
      ? Number(editing.original_price)
      : Number(editing.price)
    : 0
  const np = Number(newPrice)
  const valid = Number.isFinite(np) && np > 0 && np <= 99999999
  const pct = valid && np < base ? Math.max(1, Math.round((1 - np / base) * 100)) : 0

  // บันทึกราคา (ใช้ทั้งตอนลดราคา และตอนยกเลิกส่วนลด)
  const savePrice = async (value) => {
    setBusy(true)
    setModalMsg('')
    try {
      const res = await fetch(`${API}/api/products/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ price: value }),
      })
      if (res.status === 401) {
        onExpired()
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setModalMsg(data.message)
        return
      }
      setEditing(null)
      setNotice({ type: 'success', text: data.message })
      await load()
    } catch {
      setModalMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setBusy(false)
    }
  }

  // ลบสินค้า
  const confirmDelete = async () => {
    setBusy(true)
    setModalMsg('')
    try {
      const res = await fetch(`${API}/api/products/${deleting.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        onExpired()
        return
      }
      const data = await res.json()
      if (!res.ok) {
        setModalMsg(data.message)
        return
      }
      setDeleting(null)
      setNotice({ type: 'success', text: data.message })
      await load()
    } catch {
      setModalMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้')
    } finally {
      setBusy(false)
    }
  }

  const overlay = {
    backgroundColor: 'rgba(0,0,0,0.7)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    zIndex: 1060,
  }

  return (
    <div className="text-white">
      {/* หัวข้อหน้า */}
      <div className="container-fluid px-3 px-lg-5 pt-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{
              width: 52,
              height: 52,
              fontSize: 24,
              color: GREEN,
              backgroundColor: BG,
              border: `1px solid ${BORDER}`,
            }}
          >
            <i className="bi bi-pencil-square"></i>
          </div>
          <div>
            <h2 className="fw-bold mb-0">แก้ไขสินค้าที่ประกาศขาย</h2>
            <div className="small text-secondary">
              ลดราคาหรือลบสินค้าของคุณ · ทั้งหมด{' '}
              <span className="fw-bold" style={{ color: GREEN }}>
                {items.length}
              </span>{' '}
              รายการ
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid px-3 px-lg-5 py-4">
        {notice.text && (
          <div className={`alert alert-${notice.type} py-2 small`}>{notice.text}</div>
        )}

        {loading && <p className="text-secondary text-center py-5">กำลังโหลดสินค้า...</p>}

        {!loading && items.length === 0 && (
          <div className="text-center py-5" style={{ color: MUTED }}>
            คุณยังไม่มีสินค้าที่ประกาศขาย{' '}
            <Link to="/sell" className="fw-bold text-decoration-none" style={{ color: GREEN }}>
              ลงประกาศขายสินค้า
            </Link>
          </div>
        )}

        <div className="row g-3">
          {items.map((p) => {
            const src = imgSrc(p.image_url)
            const discounted = discountPercent(p) > 0
            const st = STATUS[p.status] || STATUS.available
            return (
              <div key={p.id} className="col-12">
                <div
                  className="d-flex flex-wrap align-items-center gap-3 rounded-4 p-3"
                  style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
                >
                  {/* รูป */}
                  <div
                    className="rounded-3 overflow-hidden flex-shrink-0"
                    style={{ width: 84, height: 84, border: `1px solid ${BORDER}` }}
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={`${p.brand} ${p.model}`}
                        className="w-100 h-100"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <NoImage size={28} />
                    )}
                  </div>

                  {/* ชื่อ + ป้าย */}
                  <div className="flex-grow-1" style={{ minWidth: 200 }}>
                    <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                      <CondBadge condition={p.condition} />
                      <DiscountBadge product={p} />
                      <span
                        className="rounded-2 px-2 py-1 fw-bold"
                        style={{
                          fontSize: 12,
                          color: st.color,
                          border: `1px solid ${st.color}66`,
                          backgroundColor: `${st.color}1a`,
                        }}
                      >
                        {st.text}
                      </span>
                    </div>
                    <div className="fw-bold">
                      {p.brand} {p.model}
                    </div>
                    <div className="small" style={{ color: MUTED }}>
                      {p.category} ·{' '}
                      <i className="bi bi-heart-fill" style={{ color: RED }}></i> {p.like_count}{' '}
                      ถูกใจ
                    </div>
                  </div>

                  {/* ราคา */}
                  <div className="text-end">
                    {discounted && (
                      <div
                        className="small text-decoration-line-through"
                        style={{ color: MUTED }}
                      >
                        {priceText(p.original_price)}
                      </div>
                    )}
                    <div className="fw-bold fs-5" style={{ color: GREEN }}>
                      {priceText(p.price)}
                    </div>
                  </div>

                  {/* ปุ่ม */}
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="btn btn-sm fw-semibold px-3 py-2"
                      style={{
                        color: GREEN,
                        backgroundColor: BOX,
                        border: `1px solid ${GREEN}`,
                      }}
                    >
                      <i className="bi bi-tag-fill me-1"></i>
                      ลดราคา
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleting(p)
                        setModalMsg('')
                      }}
                      className="btn btn-sm fw-semibold px-3 py-2"
                      style={{ color: RED, backgroundColor: BOX, border: `1px solid ${RED}` }}
                    >
                      <i className="bi bi-trash-fill me-1"></i>
                      ลบ
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ===== หน้าต่างปรับราคา / ลดราคา ===== */}
      {editing && (
        <div
          onClick={() => !busy && setEditing(null)}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={overlay}
        >
          <div
            data-bs-theme="dark"
            onClick={(e) => e.stopPropagation()}
            className="w-100 rounded-4 p-4"
            style={{ maxWidth: 460, backgroundColor: BG, border: `1px solid ${BORDER}` }}
          >
            <div className="d-flex align-items-start justify-content-between mb-3">
              <div>
                <h5 className="fw-bold mb-1">
                  <i className="bi bi-tag-fill me-2" style={{ color: GREEN }}></i>
                  ลดราคาสินค้า
                </h5>
                <div className="small" style={{ color: MUTED }}>
                  {editing.brand} {editing.model}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                aria-label="ปิด"
                className="btn fs-5 p-0 lh-1"
                style={{ color: MUTED }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div
              className="d-flex justify-content-between rounded-3 px-3 py-2 mb-3 small"
              style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
            >
              <span style={{ color: MUTED }}>ราคาปกติ</span>
              <span className="fw-bold">{priceText(base)}</span>
            </div>

            <label className="form-label small fw-semibold">ราคาใหม่ (บาท)</label>
            <input
              type="number"
              min="1"
              step="any"
              autoFocus
              className="form-control text-white shadow-none py-2 mb-2"
              style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
            />

            <div className="small mb-3" style={{ minHeight: 22 }}>
              {valid && pct > 0 && (
                <span style={{ color: GREEN }}>
                  <i className="bi bi-arrow-down-circle-fill me-1"></i>
                  ลด {pct}% (ประหยัด {priceText(base - np)}) สินค้าจะขึ้นป้ายลดราคาที่หน้าแรก
                </span>
              )}
              {valid && pct === 0 && (
                <span style={{ color: MUTED }}>
                  ราคาไม่ต่ำกว่าราคาปกติ จะไม่มีป้ายลดราคา
                </span>
              )}
              {!valid && newPrice !== '' && (
                <span style={{ color: RED }}>กรุณากรอกราคาที่มากกว่า 0</span>
              )}
            </div>

            {modalMsg && <div className="alert alert-danger py-2 small">{modalMsg}</div>}

            <div className="d-flex flex-wrap gap-2 justify-content-end">
              {editing.original_price != null && (
                <button
                  type="button"
                  onClick={() => savePrice(editing.original_price)}
                  disabled={busy}
                  className="btn text-white px-3 py-2 me-auto"
                  style={{ backgroundColor: BORDER }}
                >
                  ยกเลิกส่วนลด
                </button>
              )}
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                className="btn text-white px-3 py-2"
                style={{ backgroundColor: BORDER }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => savePrice(newPrice)}
                disabled={busy || !valid}
                className="btn fw-bold text-dark px-4 py-2"
                style={{ backgroundColor: GREEN }}
              >
                {busy ? 'กำลังบันทึก...' : 'บันทึกราคา'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== หน้าต่างยืนยันการลบ ===== */}
      {deleting && (
        <div
          onClick={() => !busy && setDeleting(null)}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={overlay}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-100 rounded-4 p-4 text-center"
            style={{ maxWidth: 420, backgroundColor: BG, border: `1px solid ${RED}` }}
          >
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: 44, color: RED }}></i>
            <h5 className="fw-bold mt-2 mb-1">ลบสินค้านี้?</h5>
            <div className="fw-semibold">
              {deleting.brand} {deleting.model}
            </div>
            <div className="small mt-2 mb-3" style={{ color: MUTED }}>
              รีวิวและยอดถูกใจของสินค้านี้จะถูกลบไปด้วย และไม่สามารถกู้คืนได้
            </div>

            {modalMsg && <div className="alert alert-danger py-2 small">{modalMsg}</div>}

            <div className="d-flex gap-2 justify-content-center">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                disabled={busy}
                className="btn text-white px-4 py-2"
                style={{ backgroundColor: BORDER }}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={busy}
                className="btn fw-bold text-white px-4 py-2"
                style={{ backgroundColor: RED }}
              >
                {busy ? 'กำลังลบ...' : 'ลบสินค้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyProducts