import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const BG = '#141922'
const INPUT_BG = '#0e1218'
const BORDER = '#2a3140'
const GREEN = '#00f56a'

function Register() {
    const navigate = useNavigate()
    const [message, setMessage] = useState({ type: '', text: '' })
    const [loading, setLoading] = useState(false)

    const [form, setForm] = useState({
        username: '',
        email: '',
        phone: '',
        password: '',
        address: '',
    })

    const handleChange = (e) => {
        let { name, value } = e.target
        if (name === 'phone') {
            value = value.replace(/\D/g, '').slice(0, 10)
        }
        setForm({ ...form, [name]: value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage({ type: '', text: '' })

        try {
            const res = await fetch('http://localhost:3001/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            })
            const data = await res.json()

            if (res.ok) {
                setMessage({ type: 'success', text: data.message })
                setTimeout(() => navigate('/'), 1500)
            } else {
                setMessage({ type: 'danger', text: data.message })
            }
        } catch (err) {
            setMessage({ type: 'danger', text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้' })
        } finally {
            setLoading(false)
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
                        style={{ backgroundColor: BG, border: '2px solid #1eff4f' }}
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
                                    border: '1px solid rgba(0,245,106,0.5)',
                                }}
                            >
                                <i className="bi bi-person-plus-fill"></i>
                            </div>
                            <h3 className="fw-bold mb-1">ลงทะเบียนสมาชิก</h3>
                            <p className="mb-0 small text-secondary">
                                สร้างบัญชีเพื่อรับสิทธิพิเศษและบันทึกที่อยู่จัดส่งสินค้า
                            </p>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="row g-3">
                                {/* Username */}
                                <div className="col-12">
                                    <label className="form-label small fw-semibold">ชื่อผู้ใช้งาน (Username)</label>
                                    <input
                                        type="text"
                                        name="username"
                                        className="form-control text-white shadow-none py-2"
                                        style={inputStyle}
                                        placeholder="กรอกชื่อผู้ใช้..."
                                        value={form.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Email */}
                                <div className="col-12">
                                    <label className="form-label small fw-semibold">อีเมล (Email)</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-control text-white shadow-none py-2"
                                        style={inputStyle}
                                        placeholder="example@domain.com"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Password */}
                                <div className="col-12">
                                    <label className="form-label small fw-semibold">รหัสผ่าน (Password)</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-control text-white shadow-none py-2"
                                        style={inputStyle}
                                        placeholder="••••••••"
                                        value={form.password}
                                        onChange={handleChange}
                                        minLength={6}
                                        required
                                    />
                                </div>

                                {/* Address */}
                                <div className="col-12">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <label className="form-label small fw-semibold mb-0" style={{ color: GREEN }}>
                                            <i className="bi bi-geo-alt-fill me-1"></i>
                                            ที่อยู่สำหรับจัดส่ง (Address)
                                        </label>
                                        <span className="text-secondary" style={{ fontSize: 11 }}>
                                            *จำเป็นสำหรับจัดส่ง
                                        </span>
                                    </div>
                                    <textarea
                                        name="address"
                                        rows={3}
                                        className="form-control text-white shadow-none"
                                        style={inputStyle}
                                        placeholder="บ้านเลขที่, ถนน, ตำบล/แขวง, อำเภอ/เขต, จังหวัด, รหัสไปรษณีย์..."
                                        value={form.address}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                {/* Phone */}
                                <div className="col-12">
                                    <label className="form-label small fw-semibold">เบอร์โทรศัพท์ (Phone)</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        inputMode="numeric"
                                        className="form-control text-white shadow-none py-2"
                                        style={inputStyle}
                                        placeholder="0812345678"
                                        value={form.phone}
                                        onChange={handleChange}
                                        pattern="0[0-9]{9}"
                                        title="เบอร์โทรศัพท์ 10 หลัก ขึ้นต้นด้วย 0"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                {/* ข้อความแจ้งเตือน */}
                                {message.text && (
                                    <div className="col-12">
                                        <div className={`alert alert-${message.type} py-2 mb-0 small`}>
                                            {message.text}
                                        </div>
                                    </div>
                                )}

                                {/* ปุ่มยืนยัน */}
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
                                        {loading ? 'กำลังบันทึก...' : 'ยืนยันการลงทะเบียน'}
                                    </button>
                                </div>

                                {/* ลิงก์เข้าสู่ระบบ */}
                                <div className="col-12 text-center small text-secondary">
                                    มีบัญชีอยู่แล้ว?{' '}
                                    <Link to="/login" className="fw-bold text-decoration-none" style={{ color: GREEN }}>
                                        เข้าสู่ระบบ
                                    </Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Register