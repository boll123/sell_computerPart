import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { API, BG, BORDER, GREEN, priceText } from './productUi'
import { matchProducts } from './searchUtils'

const BOX = '#0e1218'
const MUTED = '#9aa3b2'

/* =====================================================
   ตั้งค่า: ข้อมูลติดต่อ (แก้ให้ตรงกับร้านจริงได้ที่นี่)
   ===================================================== */
const CONTACTS = [
  {
    label: 'โทรศัพท์',
    value: '02-000-0000',
    href: 'tel:020000000',
    icon: 'bi-telephone-fill',
    color: GREEN,
  },
  {
    label: 'LINE Official',
    value: '@adbanahavecpu',
    href: 'https://line.me/R/ti/p/@adbanahavecpu',
    icon: 'bi-line',
    color: '#06c755',
  },
  {
    label: 'Facebook Messenger',
    value: 'ADBanaHaveCPU',
    href: 'https://m.me/ADBanaHaveCPU',
    icon: 'bi-messenger',
    color: '#38a1ff',
  },
  {
    label: 'อีเมล',
    value: 'support@adbanahavecpu.com',
    href: 'mailto:support@adbanahavecpu.com',
    icon: 'bi-envelope-fill',
    color: '#fbbf24',
  },
]

const OPEN_HOURS = 'ทุกวัน 09:00 - 21:00 น.'

/* =====================================================
   ตั้งค่า: คำถามที่พบบ่อยและคำตอบของแชทบอท
   keys = คำสำคัญ (ตัวพิมพ์เล็ก) ถ้าข้อความมีคำใดคำหนึ่งก็ตอบด้วย answer
   action: 'contact' = แสดงปุ่มเปิดช่องทางติดต่อใต้คำตอบ
   ===================================================== */
const FAQ = [
  {
    keys: ['สั่งซื้อ', 'วิธีซื้อ', 'ซื้อยังไง', 'ซื้ออย่างไร', 'สั่งยังไง', 'order'],
    answer:
      'วิธีสั่งซื้อ\n1) เข้าสู่ระบบ แล้วกด "ใส่ตะกร้า" ที่สินค้าที่ต้องการ\n2) กดไอคอนตะกร้าที่มุมขวาบน แล้วเลือก "ดำเนินการชำระเงิน"\n3) กรอกที่อยู่จัดส่ง (กด "ดึงข้อมูลอัตโนมัติ" เพื่อใช้ที่อยู่ในบัญชีได้) เลือกช่องทางชำระเงิน แล้วกด "ยืนยันการสั่งซื้อ"',
  },
  {
    keys: ['ค่าส่ง', 'ค่าจัดส่ง', 'จัดส่ง', 'ส่งฟรี', 'ขนส่ง', 'shipping'],
    answer:
      'ค่าจัดส่งฟรีทุกคำสั่งซื้อครับ ส่วนระยะเวลาจัดส่งโปรดสอบถามทีมงานหรือผู้ขายโดยตรงอีกครั้ง',
    action: 'contact',
  },
  {
    keys: ['ชำระ', 'จ่ายเงิน', 'โอนเงิน', 'พร้อมเพย์', 'promptpay', 'บัตรเครดิต', 'เดบิต', 'cod', 'ปลายทาง'],
    answer:
      'มีช่องทางชำระเงิน 3 แบบ ได้แก่ พร้อมเพย์ (QR PromptPay), บัตรเครดิต/เดบิต และเก็บเงินปลายทาง (COD) เลือกได้ในหน้าชำระเงินครับ',
  },
  {
    keys: ['ลงประกาศ', 'ประกาศขาย', 'ลงขาย', 'ขายของ', 'อยากขาย', 'วิธีขาย', 'ขายสินค้า'],
    answer:
      'วิธีลงประกาศขาย\n1) เข้าสู่ระบบ\n2) กดปุ่ม "ประกาศขาย" บน Header\n3) กรอกหมวดหมู่ ยี่ห้อ รุ่น สภาพ รายละเอียด ราคา ข้อมูลติดต่อ และอัปโหลดรูป (ไม่บังคับ) แล้วกด "ยืนยันการลงประกาศขาย"\nหลังประกาศแล้ว จะลดราคาหรือลบสินค้าได้ที่เมนู "แก้ไขสินค้า"',
  },
  {
    keys: ['ประกัน', 'เคลม', 'warranty'],
    answer:
      'สินค้ามีการรับประกันตามที่ร้านระบุไว้ แต่เงื่อนไขของสินค้าแต่ละชิ้นอาจต่างกัน แนะนำให้สอบถามทีมงานหรือผู้ขายก่อนสั่งซื้อครับ',
    action: 'contact',
  },
  {
    keys: ['ลดราคา', 'โปรโมชั่น', 'โปรโมชัน', 'ส่วนลด', 'promotion', 'sale'],
    answer:
      'สินค้าที่ลดราคาจะมีป้ายสีแดง เช่น -15% พร้อมราคาเดิมขีดฆ่า และจะแสดงในสไลด์หน้าแรกด้วย ลองดูที่หน้าแรกได้เลยครับ',
  },
  {
    keys: ['ถูกใจ', 'รายการโปรด', 'wishlist', 'หัวใจ'],
    answer:
      'กดไอคอนหัวใจที่สินค้าเพื่อกดถูกใจ (ต้องเข้าสู่ระบบ) และดูรายการที่ถูกใจทั้งหมดได้ที่ไอคอนหัวใจบน Header ครับ',
  },
  {
    keys: ['สมัคร', 'ลงทะเบียน', 'เข้าสู่ระบบ', 'ล็อกอิน', 'login', 'register'],
    answer:
      'กด "ลงทะเบียน" ที่มุมขวาบนเพื่อสมัครสมาชิก (ใช้ชื่อผู้ใช้ อีเมล เบอร์โทร รหัสผ่าน และที่อยู่) จากนั้นกด "เข้าสู่ระบบ" เพื่อใช้งานได้เลยครับ',
  },
  {
    keys: [
      'ติดต่อ', 'เจ้าหน้าที่', 'พนักงาน', 'แอดมิน', 'เบอร์', 'โทร', 'ไลน์',
      'messenger', 'เมสเซนเจอร์', 'อีเมล', 'email', 'เวลาทำการ', 'เปิดกี่โมง', 'ปิดกี่โมง',
    ],
    answer: `ทีมงานพร้อมให้บริการ${OPEN_HOURS}\nโทร ${CONTACTS[0].value}\nLINE ${CONTACTS[1].value}\nอีเมล ${CONTACTS[3].value}`,
    action: 'contact',
  },
]

const GREETING =
  'สวัสดีครับ ยินดีต้อนรับสู่ ADBanaHaveCPU\nผมเป็นผู้ช่วยตอบอัตโนมัติ เลือกหัวข้อด้านล่าง หรือพิมพ์ชื่อสินค้าที่ต้องการค้นหาได้เลยครับ'

const FALLBACK =
  'ขออภัยครับ ผมยังไม่เข้าใจคำถามนี้ ลองเลือกหัวข้อด้านล่าง หรือพิมพ์ชื่อสินค้า เช่น "rtx 4090" หรือติดต่อทีมงานโดยตรงได้เลยครับ'

const QUICK = [
  'วิธีสั่งซื้อ',
  'ค่าจัดส่ง',
  'ช่องทางชำระเงิน',
  'วิธีลงประกาศขาย',
  'การรับประกัน',
  'ติดต่อเจ้าหน้าที่',
]

// คำที่ตัดทิ้งก่อนค้นหาสินค้า (เรียงจากยาวไปสั้น)
const STOP_WORDS = ['อยากได้', 'เท่าไหร่', 'เท่าไร', 'สินค้า', 'ขอดู', 'หน่อย', 'มีไหม', 'ราคา', 'ครับ', 'ไหม', 'ค่ะ', 'คะ']
const STOP_RE = new RegExp(STOP_WORDS.join('|'), 'g')

// สร้างคำตอบของบอท
function buildReply(text, products) {
  const t = text.toLowerCase()

  // 1) ตรงหัวข้อที่เตรียมไว้
  const hit = FAQ.find((f) => f.keys.some((k) => t.includes(k)))
  if (hit) return { text: hit.answer, action: hit.action }

  // 2) ทักทาย / ขอบคุณ
  if (/^(สวัสดี|หวัดดี|hello|hey|hi)(\s|$|ครับ|ค่ะ|คะ|!)/.test(t)) {
    return { text: GREETING }
  }
  if (/ขอบคุณ|thank/.test(t)) {
    return { text: 'ยินดีครับ มีอะไรให้ช่วยอีก ถามได้เลย' }
  }

  // 3) ลองค้นหาเป็นชื่อสินค้า
  const q = t.replace(STOP_RE, ' ').replace(/\s+/g, ' ').trim()
  if (q) {
    const found = matchProducts(products, q)
    if (found.length) {
      return {
        text: `พบสินค้าที่ตรงกับ “${q}” ${found.length} รายการ`,
        items: found.slice(0, 3),
        query: q,
      }
    }
  }

  // 4) ไม่เข้าใจ
  return { text: FALLBACK, action: 'contact' }
}

/* =====================================================
   สถานะเปิด/ปิดของป็อบอัพติดต่อและหน้าต่างแชท (Context)
   ===================================================== */
const ContactContext = createContext(null)

export const useContact = () => useContext(ContactContext)

export function ContactProvider({ children }) {
  const [contactOpen, setContactOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  const value = {
    contactOpen,
    chatOpen,
    openContact: () => setContactOpen(true),
    closeContact: () => setContactOpen(false),
    // เริ่มแชท: ปิดป็อบอัพติดต่อ แล้วเปิดหน้าต่างแชท
    openChat: () => {
      setContactOpen(false)
      setChatOpen(true)
    },
    toggleChat: () => setChatOpen((o) => !o),
    closeChat: () => setChatOpen(false),
  }

  return (
    <ContactContext.Provider value={value}>
      {children}
      <ContactModal />
      <ChatWidget />
    </ContactContext.Provider>
  )
}

/* =====================================================
   ป็อบอัพช่องทางติดต่อ
   ===================================================== */
function ContactModal() {
  const { contactOpen, closeContact, openChat } = useContact()
  const [hover, setHover] = useState(-1)

  // กด Esc เพื่อปิด และล็อกการเลื่อนหน้าด้านหลัง
  useEffect(() => {
    if (!contactOpen) return
    const onKey = (e) => e.key === 'Escape' && closeContact()
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [contactOpen])

  if (!contactOpen) return null

  return createPortal(
    <div
      onClick={closeContact}
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3 overflow-auto"
      style={{
        backgroundColor: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 1060,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-100 rounded-5 p-4 text-white position-relative"
        style={{
          maxWidth: 640,
          backgroundColor: BG,
          border: `1px solid ${BORDER}`,
          boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {/* หัวข้อ */}
        <div
          className="d-flex align-items-center gap-3 pb-3 mb-3"
          style={{ borderBottom: `1px solid ${BORDER}` }}
        >
          <div
            className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
            style={{
              width: 56,
              height: 56,
              fontSize: 26,
              color: GREEN,
              backgroundColor: 'rgba(0,245,106,0.1)',
              border: `1px solid ${GREEN}`,
              boxShadow: '0 0 14px rgba(0,245,106,0.3)',
            }}
          >
            <i className="bi bi-headset"></i>
          </div>
          <div className="flex-grow-1">
            <h4 className="fw-bold mb-0">ติดต่อเรา</h4>
            <div className="small" style={{ color: MUTED }}>
              ทีมงาน ADBanaHaveCPU พร้อมให้คำปรึกษา
            </div>
          </div>
          <button
            type="button"
            onClick={closeContact}
            aria-label="ปิด"
            className="btn fs-5 p-0 lh-1 align-self-start"
            style={{ color: MUTED }}
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* ช่องทางติดต่อ */}
        <div className="d-flex flex-column gap-2 mb-3">
          {CONTACTS.map((c, i) => {
            const external = c.href.startsWith('http')
            return (
              <a
                key={c.label}
                href={c.href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noopener noreferrer' : undefined}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(-1)}
                className="d-flex align-items-center gap-3 rounded-4 p-3 text-decoration-none text-white"
                style={{
                  backgroundColor: BOX,
                  border: `1px solid ${hover === i ? c.color : BORDER}`,
                  transition: 'border-color 0.2s ease',
                }}
              >
                <span
                  className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
                  style={{
                    width: 48,
                    height: 48,
                    fontSize: 22,
                    color: c.color,
                    backgroundColor: '#161c27',
                    border: `1px solid ${BORDER}`,
                  }}
                >
                  <i className={`bi ${c.icon}`}></i>
                </span>
                <span className="flex-grow-1" style={{ minWidth: 0 }}>
                  <span className="d-block small" style={{ color: MUTED }}>
                    {c.label}
                  </span>
                  <span className="d-block fw-bold text-truncate">{c.value}</span>
                </span>
                <i className="bi bi-chevron-right" style={{ color: MUTED }}></i>
              </a>
            )
          })}
        </div>

        {/* เวลาทำการ */}
        <div
          className="d-flex align-items-center gap-2 rounded-4 px-3 py-3 mb-3 small"
          style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
        >
          <i className="bi bi-clock" style={{ color: GREEN }}></i>
          <span style={{ color: MUTED }}>เวลาทำการ:</span>
          <span className="fw-bold">{OPEN_HOURS}</span>
        </div>

        <button
          type="button"
          onClick={openChat}
          className="btn w-100 fw-bold text-dark py-3 rounded-4"
          style={{ backgroundColor: GREEN, boxShadow: '0 0 20px rgba(0,245,106,0.4)' }}
        >
          <i className="bi bi-chat-dots-fill me-2"></i>
          เริ่มแชทกับเรา
        </button>
      </div>
    </div>,
    document.body
  )
}

/* =====================================================
   ปุ่มแชทลอยมุมขวาล่าง + หน้าต่างแชทบอท
   ===================================================== */
function ChatWidget() {
  const { chatOpen, toggleChat, closeChat, openContact } = useContact()

  const [products, setProducts] = useState([])
  const [messages, setMessages] = useState([{ id: 0, from: 'bot', text: GREETING }])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(0) // จำนวนคำตอบที่บอทกำลังพิมพ์
  const boxRef = useRef(null)
  const timers = useRef([])
  const nextId = useRef(1)

  // เปิดแชททุกครั้ง โหลดสินค้าล่าสุดไว้ให้บอทค้นหา
  useEffect(() => {
    if (!chatOpen) return
    let alive = true
    fetch(`${API}/api/products`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => alive && setProducts(data))
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [chatOpen])

  // เลื่อนลงล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages, pending, chatOpen])

  // กด Esc เพื่อปิดหน้าต่างแชท
  useEffect(() => {
    if (!chatOpen) return
    const onKey = (e) => e.key === 'Escape' && closeChat()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [chatOpen])

  // เคลียร์ตัวจับเวลาตอนปิดหน้าเว็บ
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // ส่งข้อความ แล้วให้บอทตอบหลังหน่วงเล็กน้อย
  const send = (raw) => {
    const text = raw.trim()
    if (!text) return

    const userMsg = { id: nextId.current++, from: 'user', text }
    const botMsg = { id: nextId.current++, from: 'bot', ...buildReply(text, products) }

    setMessages((m) => [...m, userMsg])
    setInput('')
    setPending((n) => n + 1)

    const t = setTimeout(() => {
      setMessages((m) => [...m, botMsg])
      setPending((n) => n - 1)
    }, 600 + Math.random() * 500)
    timers.current.push(t)
  }

  return (
    <>
      {/* ===== หน้าต่างแชท ===== */}
      {chatOpen && (
        <div
          className="position-fixed d-flex flex-column rounded-4 overflow-hidden text-white"
          style={{
            right: 24,
            bottom: 104,
            width: 'min(380px, calc(100vw - 32px))',
            height: 'min(540px, calc(100vh - 150px))',
            backgroundColor: BG,
            border: `1px solid ${BORDER}`,
            boxShadow: '0 16px 50px rgba(0,0,0,0.7)',
            zIndex: 1040,
          }}
        >
          {/* หัวหน้าต่าง */}
          <div
            className="d-flex align-items-center gap-3 px-3 py-3"
            style={{ borderBottom: `1px solid ${BORDER}`, backgroundColor: '#161c27' }}
          >
            <span
              className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
              style={{ width: 40, height: 40, fontSize: 20, backgroundColor: GREEN, color: '#000' }}
            >
              <i className="bi bi-robot"></i>
            </span>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <div className="fw-bold text-truncate">ผู้ช่วย ADBanaHaveCPU</div>
              <div className="small" style={{ color: GREEN }}>
                <i className="bi bi-circle-fill me-1" style={{ fontSize: 8 }}></i>
                ตอบกลับอัตโนมัติ
              </div>
            </div>
            <button
              type="button"
              onClick={openContact}
              title="ช่องทางติดต่อทีมงาน"
              className="btn p-1 fs-5 lh-1"
              style={{ color: MUTED }}
            >
              <i className="bi bi-telephone-fill"></i>
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="ปิดแชท"
              className="btn p-1 fs-5 lh-1"
              style={{ color: MUTED }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          {/* ข้อความ */}
          <div ref={boxRef} className="flex-grow-1 overflow-auto px-3 py-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`d-flex mb-2 ${m.from === 'user' ? 'justify-content-end' : ''}`}
              >
                <div
                  className="rounded-4 px-3 py-2 small"
                  style={{
                    maxWidth: '85%',
                    whiteSpace: 'pre-line',
                    backgroundColor: m.from === 'user' ? GREEN : '#1d2430',
                    color: m.from === 'user' ? '#000' : '#fff',
                  }}
                >
                  {m.text}

                  {/* สินค้าที่ค้นเจอ */}
                  {m.items && (
                    <div className="mt-2 d-flex flex-column gap-2">
                      {m.items.map((p) => (
                        <Link
                          key={p.id}
                          to={`/search?q=${encodeURIComponent(`${p.brand} ${p.model}`)}`}
                          className="d-flex justify-content-between gap-2 rounded-3 px-2 py-2 text-decoration-none text-white"
                          style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
                        >
                          <span className="text-truncate">
                            {p.brand} {p.model}
                          </span>
                          <span className="fw-bold text-nowrap" style={{ color: GREEN }}>
                            {priceText(p.price)}
                          </span>
                        </Link>
                      ))}
                      <Link
                        to={`/search?q=${encodeURIComponent(m.query)}`}
                        className="text-decoration-none fw-semibold"
                        style={{ color: GREEN }}
                      >
                        ดูผลการค้นหาทั้งหมด <i className="bi bi-chevron-right"></i>
                      </Link>
                    </div>
                  )}

                  {/* ปุ่มเปิดช่องทางติดต่อ */}
                  {m.action === 'contact' && (
                    <button
                      type="button"
                      onClick={openContact}
                      className="btn btn-sm fw-semibold rounded-pill mt-2 d-block"
                      style={{ color: GREEN, border: `1px solid ${GREEN}` }}
                    >
                      <i className="bi bi-headset me-1"></i>
                      เปิดช่องทางติดต่อทีมงาน
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* กำลังพิมพ์ */}
            {pending > 0 && (
              <div className="d-flex mb-2">
                <div
                  className="rounded-4 px-3 py-2 small"
                  style={{ backgroundColor: '#1d2430', color: MUTED }}
                >
                  กำลังพิมพ์ <i className="bi bi-three-dots"></i>
                </div>
              </div>
            )}
          </div>

          {/* คำถามด่วน */}
          <div
            className="d-flex gap-2 overflow-auto px-3 py-2"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => send(q)}
                className="btn btn-sm rounded-pill text-nowrap flex-shrink-0"
                style={{ color: GREEN, border: `1px solid ${GREEN}66` }}
              >
                {q}
              </button>
            ))}
          </div>

          {/* ช่องพิมพ์ */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="d-flex align-items-center gap-2 p-3"
            style={{ borderTop: `1px solid ${BORDER}` }}
          >
            <input
              type="text"
              className="form-control text-white shadow-none rounded-pill px-3"
              style={{ backgroundColor: BOX, border: `1px solid ${BORDER}` }}
              placeholder="พิมพ์ข้อความหรือชื่อสินค้า..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="ส่งข้อความ"
              className="btn rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0"
              style={{ width: 42, height: 42, backgroundColor: GREEN, color: '#000' }}
            >
              <i className="bi bi-send-fill"></i>
            </button>
          </form>
        </div>
      )}

      {/* ===== ปุ่มแชทลอยมุมขวาล่าง ===== */}
      <button
        type="button"
        onClick={toggleChat}
        aria-label={chatOpen ? 'ปิดแชท' : 'เปิดแชท'}
        className="btn position-fixed rounded-circle p-0 d-flex align-items-center justify-content-center"
        style={{
          right: 24,
          bottom: 24,
          width: 64,
          height: 64,
          fontSize: 28,
          backgroundColor: GREEN,
          color: '#000',
          boxShadow: '0 0 24px rgba(0,245,106,0.55)',
          zIndex: 1040,
        }}
      >
        <i className={`bi ${chatOpen ? 'bi-x-lg' : 'bi-chat-dots-fill'}`}></i>
      </button>
    </>
  )
}