import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, RefreshCw } from 'lucide-react';
import { paymentService, userService, lessonService } from '../services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [newPayment, setNewPayment] = useState({
    student: '',
    group: '',
    amount: '500000.00',
    payment_month: new Date().toISOString().split('T')[0],
    method: 'payme',
    status: 'completed'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchedPayments = await paymentService.getPayments();
      setPayments(Array.isArray(fetchedPayments) ? fetchedPayments : []);

      const fetchedStudents = await userService.getUsers('student');
      setStudents(Array.isArray(fetchedStudents) ? fetchedStudents : []);

      const fetchedGroups = await lessonService.getGroups();
      setGroups(Array.isArray(fetchedGroups) ? fetchedGroups : []);
    } catch (err) {
      console.error("Payments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    try {
      await paymentService.createPayment(newPayment);
      setShowModal(false);
      setNewPayment({ student: '', group: '', amount: '500000.00', payment_month: new Date().toISOString().split('T')[0], method: 'payme', status: 'completed' });
      fetchData();
    } catch (err) {
      alert("To'lov saqlashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>To'lovlar Boshqaruvi</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>Backend API: `/Payments/payments/`</span>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18} />
          <span>Yangi To'lov Qabul Qilish</span>
        </button>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>To'lovlar yuklanmoqda...</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Hozircha ma'lumotlar bazasida to'lovlar yo'q.<br />
            Yuqoridagi <strong>"Yangi To'lov Qabul Qilish"</strong> tugmasini bosib birinchi to'lovni kiriting!
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID / O'quvchi</th>
                <th>To'lov Summasi</th>
                <th>To'lov Oyi / Sanasi</th>
                <th>To'lov Usuli</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '600' }}>Student #{p.student}</td>
                  <td style={{ fontWeight: '700', color: '#2563eb' }}>{p.amount} UZS</td>
                  <td>{p.payment_month || 'N/A'}</td>
                  <td>
                    <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
                      {p.method}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'completed' ? 'badge-active' : 'badge-hold'}`}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal: New Payment */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Yangi To'lov Kiritish</h3>
            </div>
            <form onSubmit={handleCreatePayment}>
              <div className="modal-body">
                <div className="form-group">
                  <label>O'quvchi *</label>
                  <select className="form-select" required value={newPayment.student} onChange={(e) => setNewPayment({ ...newPayment, student: e.target.value })}>
                    <option value="">-- O'quvchini tanlang --</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name || s.username} {s.last_name || ''} (@{s.username})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Guruh</label>
                  <select className="form-select" value={newPayment.group} onChange={(e) => setNewPayment({ ...newPayment, group: e.target.value })}>
                    <option value="">-- Guruhni tanlang (Ixtiyoriy) --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Summa (UZS) *</label>
                  <input type="number" className="form-input" required value={newPayment.amount} onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>To'lov Sanasi / Oyi</label>
                  <input type="date" className="form-input" value={newPayment.payment_month} onChange={(e) => setNewPayment({ ...newPayment, payment_month: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>To'lov Usuli</label>
                  <select className="form-select" value={newPayment.method} onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}>
                    <option value="cash">Naqd (Cash)</option>
                    <option value="card">Karta (Card)</option>
                    <option value="payme">Payme</option>
                    <option value="click">Click</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select className="form-select" value={newPayment.status} onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value })}>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
