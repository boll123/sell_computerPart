import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

const BG = '#141922'
const INPUT_BG = '#0a0d12'
const BORDER = '#2a3140'
const GREEN = '#00f56a'

function Login({ onLogin }) {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const reason = location.state?.reason

  const [mode, setMode] = useState('login') // 'login' | 'reset'

  // ---- ฟอร์มเข้าสู่ระบบ ----
  const [form, setForm] = useState({ identifier: '', password: '' })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  // ---- ฟอร์มลืมรหัสผ่าน ----
  const [reset, setReset] = useState({ email: '', phone: '', password: '', confirm: '' })
  const [resetMsg, setResetMsg] = useState({ type: '', text: '' })
  const [resetting, setResetting] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (res.ok) {
        onLogin(data.user, data.token)
        navigate(from || '/')
      } else {
        setMessage({ type: 'danger', text: data.message })
      }
    } catch (err) {
      setMessage({ type: 'danger', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' })
    } finally {
      setLoading(false)
    }
  }

  const goReset = () => {
    setResetMsg({ type: '', text: '' })
    setMode('reset')
  }

  const goLogin = () => {
    setMessage({ type: '', text: '' })
    setMode('login')
  }

  const handleResetChange = (e) => {
    let { name, value } = e.target
    if (name === 'phone') value = value.replace(/\D/g, '').slice(0, 10)
    setReset({ ...reset, [name]: value })
  }

  const handleReset = async (e) => {
    e.preventDefault()

    if (reset.password !== reset.confirm) {
      setResetMsg({ type: 'danger', text: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน' })
      return
    }

    setResetting(true)
    setResetMsg({ type: '', text: '' })

    try {
      const res = await fetch('http://localhost:3001/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: reset.email,
          phone: reset.phone,
          new_password: reset.password,
        }),
      })
      const data = await res.json()

      if (res.ok) {
        // กลับหน้าเข้าสู่ระบบ พร้อมเติมอีเมลให้ และแจ้งว่าสำเร็จ
        setForm({ identifier: reset.email, password: '' })
        setMessage({ type: 'success', text: data.message })
        setReset({ email: '', phone: '', password: '', confirm: '' })
        setShowPw(false)
        setMode('login')
      } else {
        setResetMsg({ type: 'danger', text: data.message })
      }
    } catch (err) {
      setResetMsg({ type: 'danger', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' })
    } finally {
      setResetting(false)
    }
  }

  const inputStyle = {
    backgroundColor: INPUT_BG,
    border: `1px solid ${BORDER}`,
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-sm-10 col-md-7 col-lg-5 col-xl-4">
          <div
            className="rounded-4 p-4 text-white position-relative"
            style={{ backgroundColor: BG, border: `1px solid ${BORDER}` }}
          >
            {/* ปุ่มปิด กลับหน้าหลัก */}
            <Link to="/" className="position-absolute top-0 end-0 m-3 text-secondary fs-5">
              <i className="bi bi-x-lg"></i>
            </Link>

            {/* ไอคอน + หัวข้อ */}
            <div className="text-center mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-3 mb-3"
                style={{
                  width: 52,
                  height: 52,
                  color: GREEN,
                  fontSize: 26,
                  backgroundColor: 'rgba(0,245,106,0.1)',
                  border: '1px solid rgba(0,245,106,0.35)',
                }}
              >
                <i className={`bi ${mode === 'login' ? 'bi-box-arrow-in-right' : 'bi-key-fill'}`}></i>
              </div>
              <h3 className="fw-bold mb-1">{mode === 'login' ? 'เข้าสู่ระบบ' : 'ลืมรหัสผ่าน'}</h3>
              <p className="mb-0 small text-secondary">
                {mode === 'login'
                  ? 'ยินดีต้อนรับสู่ ADBanaHaveCPU'
                  : 'ยืนยันตัวตนด้วยอีเมลและเบอร์โทรที่ลงทะเบียนไว้ แล้วตั้งรหัสผ่านใหม่'}
              </p>
            </div>

            {mode === 'login' ? (
              <>
                {/* แจ้งเตือน: ถูกพามาหน้านี้เพราะต้องล็อกอินก่อน */}
                {from && (
                  <div className="alert alert-warning py-2 small">
                    {reason === 'like'
                      ? 'กรุณาเข้าสู่ระบบก่อนกดถูกใจสินค้า'
                      : reason === 'cart'
                        ? 'กรุณาเข้าสู่ระบบก่อนเพิ่มสินค้าลงตะกร้า'
                        : reason === 'manage'
                          ? 'กรุณาเข้าสู่ระบบก่อนแก้ไขสินค้าของคุณ'
                          : 'กรุณาเข้าสู่ระบบก่อนลงประกาศขายสินค้า'}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    {/* Username / Email */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold">ชื่อผู้ใช้ หรือ อีเมล</label>
                      <input
                        type="text"
                        name="identifier"
                        className="form-control text-white shadow-none py-2"
                        style={inputStyle}
                        placeholder="Username / Email"
                        value={form.identifier}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Password + ลิงก์ลืมรหัสผ่าน */}
                    <div className="col-12">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small fw-semibold mb-0">รหัสผ่าน</label>
                        <button
                          type="button"
                          onClick={goReset}
                          className="btn btn-link p-0 small fw-semibold text-decoration-none"
                          style={{ color: GREEN }}
                        >
                          ลืมรหัสผ่าน?
                        </button>
                      </div>
                      <input
                        type="password"
                        name="password"
                        className="form-control text-white shadow-none py-2"
                        style={inputStyle}
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* ข้อความแจ้งเตือนผลล็อกอิน / ผลรีเซ็ตรหัสผ่าน */}
                    {message.text && (
                      <div className="col-12">
                        <div className={`alert alert-${message.type} py-2 mb-0 small`}>
                          {message.text}
                        </div>
                      </div>
                    )}

                    {/* ปุ่มเข้าสู่ระบบ */}
                    <div className="col-12 mt-3">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn w-100 fw-bold text-dark py-2 rounded-3"
                        style={{
                          backgroundColor: GREEN,
                          boxShadow: '0 0 20px rgba(0,245,106,0.4)',
                        }}
                      >
                        {loading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
                      </button>
                    </div>

                    {/* ลิงก์ลงทะเบียน */}
                    <div className="col-12 text-center small text-secondary">
                      ยังไม่มีบัญชี?{' '}
                      <Link
                        to="/register"
                        className="fw-bold text-decoration-none"
                        style={{ color: GREEN }}
                      >
                        ลงทะเบียน
                      </Link>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <form onSubmit={handleReset}>
                <div className="row g-3">
                  {/* อีเมลที่ลงทะเบียน */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold">อีเมลที่ลงทะเบียนไว้</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control text-white shadow-none py-2"
                      style={inputStyle}
                      placeholder="example@domain.com"
                      value={reset.email}
                      onChange={handleResetChange}
                      required
                    />
                  </div>

                  {/* เบอร์โทรที่ลงทะเบียน */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold">เบอร์โทรศัพท์ที่ลงทะเบียนไว้</label>
                    <input
                      type="tel"
                      name="phone"
                      inputMode="numeric"
                      className="form-control text-white shadow-none py-2"
                      style={inputStyle}
                      placeholder="0812345678"
                      value={reset.phone}
                      onChange={handleResetChange}
                      pattern="0[0-9]{9}"
                      title="เบอร์โทรศัพท์ 10 หลัก ขึ้นต้นด้วย 0"
                      maxLength={10}
                      required
                    />
                  </div>

                  {/* รหัสผ่านใหม่ */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold">รหัสผ่านใหม่</label>
                    <div className="position-relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        name="password"
                        className="form-control text-white shadow-none py-2 pe-5"
                        style={inputStyle}
                        placeholder="อย่างน้อย 6 ตัวอักษร"
                        value={reset.password}
                        onChange={handleResetChange}
                        minLength={6}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                        className="btn p-0 position-absolute top-50 end-0 translate-middle-y me-3 lh-1"
                        style={{ color: '#9aa3b2' }}
                      >
                        <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                      </button>
                    </div>
                  </div>

                  {/* ยืนยันรหัสผ่านใหม่ */}
                  <div className="col-12">
                    <label className="form-label small fw-semibold">ยืนยันรหัสผ่านใหม่</label>
                    <input
                      type={showPw ? 'text' : 'password'}
                      name="confirm"
                      className="form-control text-white shadow-none py-2"
                      style={inputStyle}
                      placeholder="พิมพ์รหัสผ่านใหม่อีกครั้ง"
                      value={reset.confirm}
                      onChange={handleResetChange}
                      minLength={6}
                      required
                    />
                  </div>

                  {resetMsg.text && (
                    <div className="col-12">
                      <div className={`alert alert-${resetMsg.type} py-2 mb-0 small`}>
                        {resetMsg.text}
                      </div>
                    </div>
                  )}

                  <div className="col-12 mt-3">
                    <button
                      type="submit"
                      disabled={resetting}
                      className="btn w-100 fw-bold text-dark py-2 rounded-3"
                      style={{
                        backgroundColor: GREEN,
                        boxShadow: '0 0 20px rgba(0,245,106,0.4)',
                      }}
                    >
                      {resetting ? 'กำลังบันทึก...' : 'ตั้งรหัสผ่านใหม่'}
                    </button>
                  </div>

                  <div className="col-12 text-center small">
                    <button
                      type="button"
                      onClick={goLogin}
                      className="btn btn-link p-0 small text-decoration-none text-secondary"
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      กลับไปเข้าสู่ระบบ
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login