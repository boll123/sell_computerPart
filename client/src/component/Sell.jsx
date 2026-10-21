import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const GREEN = '#00f56a'
const BORDER = '#2a3140'

const categories = ['การ์ดจอ', 'CPU', 'Mainboard', 'RAM', 'SSD / Hard disk']
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

const Req = () => <span className="text-danger"> *</span>

function Sell({ token, onExpired }) {
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview] = useState('')

  const [form, setForm] = useState({
    category: '',
    brand: '',
    model: '',
    condition: 'used',
    description: '',
    price: '',
    contact: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setImageFile(null)
    setPreview('')
    if (fileInput.current) fileInput.current.value = ''
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) {
      clearImage()
      return
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setMessage({ type: 'danger', text: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP, GIF' })
      clearImage()
      return
    }

    if (file.size > MAX_SIZE) {
      setMessage({ type: 'danger', text: 'ไฟล์รูปต้องไม่เกิน 5 MB' })
      clearImage()
      return
    }

    if (preview) URL.revokeObjectURL(preview)
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setMessage({ type: '', text: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    // ส่งแบบ FormData เพราะมีไฟล์แนบ
    const body = new FormData()
    Object.entries(form).forEach(([key, value]) => body.append(key, value))
    if (imageFile) body.append('image', imageFile)

    try {
      const res = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        // ห้ามใส่ Content-Type เอง เบราว์เซอร์จะตั้งค่าให้พร้อม boundary
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
      const data = await res.json()

      if (res.status === 401) {
        onExpired() // token หมดอายุ → ออกจากระบบ แล้วระบบจะพาไปหน้า login
        return
      }

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
    backgroundColor: '#000',
    border: `1px solid ${BORDER}`,
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-9 col-xl-8">
          <div
            data-bs-theme="dark"
            className="rounded-5 p-4 text-white"
            style={{
              backgroundColor: '#151515',
              border: `1px solid ${GREEN}`,
              boxShadow: '0 0 25px rgba(0,245,106,0.25)',
            }}
          >
            {/* หัวข้อ */}
            <div className="text-center mb-4">
              <h3 className="fw-bold mb-1" style={{ color: GREEN }}>
                <i className="bi bi-megaphone-fill me-2"></i>
                ลงประกาศขายอุปกรณ์คอมพิวเตอร์
              </h3>
              <p className="mb-0 small text-secondary">
                โพสต์ขายการ์ดจอ, CPU, เมนบอร์ด, แรม หรือ SSD ของคุณได้ที่นี่
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                {/* หมวดหมู่ */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    หมวดหมู่<Req />
                  </label>
                  <select
                    name="category"
                    className="form-select text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    value={form.category}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* ยี่ห้อ */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    ยี่ห้อ (Brand)<Req />
                  </label>
                  <input
                    type="text"
                    name="brand"
                    className="form-control text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    placeholder="เช่น ASUS, MSI, NVIDIA, INTEL"
                    value={form.brand}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* รุ่น */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    ชื่อรุ่น (Model)<Req />
                  </label>
                  <input
                    type="text"
                    name="model"
                    className="form-control text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    placeholder="เช่น RTX 4070 SUPER, CORE i7 14700K"
                    value={form.model}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* สภาพ */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    สภาพสินค้า<Req />
                  </label>
                  <select
                    name="condition"
                    className="form-select text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    value={form.condition}
                    onChange={handleChange}
                    required
                  >
                    <option value="used">มือสอง (Used)</option>
                    <option value="new">มือหนึ่ง (New)</option>
                  </select>
                </div>

                {/* รายละเอียด */}
                <div className="col-12">
                  <label className="form-label small fw-semibold">
                    รายละเอียด / สเปกสินค้า<Req />
                  </label>
                  <input
                    type="text"
                    name="description"
                    className="form-control text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    placeholder="เช่น 12GB GDDR6X, DDR5 32GB 6000MHz, M.2 NVMe 1TB, Socket LGA1700"
                    value={form.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* ราคา */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    ราคาขาย (บาท)<Req />
                  </label>
                  <input
                    type="number"
                    name="price"
                    min="1"
                    step="any"
                    className="form-control text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    placeholder="เช่น 15500"
                    value={form.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* ช่องทางติดต่อ */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">
                    ข้อมูลติดต่อ (เบอร์/Line ID)<Req />
                  </label>
                  <input
                    type="text"
                    name="contact"
                    className="form-control text-white shadow-none py-2 rounded-3"
                    style={inputStyle}
                    placeholder="เช่น Line: @myid / 081-234-5678"
                    value={form.contact}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* อัปโหลดรูป */}
                <div className="col-12">
                  <label className="form-label small fw-semibold">
                    รูปภาพสินค้า (ถ้ามี)
                    <span className="text-secondary fw-normal ms-2" style={{ fontSize: 12 }}>
                      JPG, PNG, WEBP, GIF ไม่เกิน 5 MB
                    </span>
                  </label>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="form-control text-white shadow-none rounded-3"
                    style={inputStyle}
                    onChange={handleFile}
                  />

                  {/* ตัวอย่างรูป */}
                  {preview && (
                    <div className="mt-3 d-flex align-items-start gap-3">
                      <img
                        src={preview}
                        alt="ตัวอย่างรูปสินค้า"
                        className="rounded-3"
                        style={{
                          maxHeight: 180,
                          maxWidth: '100%',
                          objectFit: 'contain',
                          border: `1px solid ${BORDER}`,
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={clearImage}
                      >
                        <i className="bi bi-trash me-1"></i>
                        ลบรูป
                      </button>
                    </div>
                  )}
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
                <div className="col-12">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn w-100 fw-bold text-dark py-2 rounded-3"
                    style={{
                      backgroundColor: GREEN,
                      boxShadow: '0 0 20px rgba(0,245,106,0.4)',
                    }}
                  >
                    <i className="bi bi-send-fill me-2"></i>
                    {loading ? 'กำลังบันทึก...' : 'ยืนยันการลงประกาศขาย'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sell