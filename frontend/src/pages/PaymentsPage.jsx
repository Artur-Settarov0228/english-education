import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Clock, RefreshCw, 
  FileText, Download, ShieldCheck, DollarSign, X, Plus
} from 'lucide-react';
import { paymentService, userService, lessonService } from '../services/api';

export default function PaymentsPage({ currentUser }) {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Manager Payment Creation Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student: '',
    group: '',
    amount: '500000.00',
    payment_month: new Date().toISOString().split('T')[0],
    method: 'cash',
    status: 'completed'
  });
  const [savingPayment, setSavingPayment] = useState(false);

  const isManagerOrAdmin = currentUser?.role === 'manager' || currentUser?.role === 'admin' || currentUser?.is_superuser;

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments();
      const pList = Array.isArray(res) ? res : [];
      setPayments(pList);

      if (isManagerOrAdmin) {
        const [studentsRes, groupsRes] = await Promise.all([
          userService.getUsers('student'),
          lessonService.getGroups()
        ]);
        setStudents(Array.isArray(studentsRes) ? studentsRes : []);
        setGroups(Array.isArray(groupsRes) ? groupsRes : []);
      }
    } catch (err) {
      console.error("Payments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentUser]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    if (!newPayment.student || !newPayment.amount) {
      alert("Iltimos, o'quvchi va summani tanlang!");
      return;
    }

    setSavingPayment(true);
    try {
      await paymentService.createPayment(newPayment);
      alert("To'lov muvaffaqiyatli qabul qilindi va o'quvchi hisobida aks ettirildi!");
      setShowAddModal(false);
      setNewPayment({
        student: '',
        group: '',
        amount: '500000.00',
        payment_month: new Date().toISOString().split('T')[0],
        method: 'cash',
        status: 'completed'
      });
      fetchPayments();
    } catch (err) {
      alert("To'lov kiritishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    } finally {
      setSavingPayment(false);
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            {isManagerOrAdmin ? "To'lovlar Boshqaruvi" : "To'lovlarim & Kvitansiyalar"}
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            {isManagerOrAdmin ? "O'quvchilar to'lovlarini qabul qilish va boshqarish" : "Kurs uchun amalga oshirilgan to'lovlar tarixi va cheklar"}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {isManagerOrAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              <span>Yangi To'lov Qabul Qilish</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={fetchPayments} title="Yangilash">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Yangilash</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
              {isManagerOrAdmin ? "Jami Tushum" : "Jami To'langan"}
            </div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {totalPaid.toLocaleString()} UZS
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>To'lov Holati</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#16a34a' }}>
              Faol (Cheklovsiz)
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#faf5ff', color: '#9333ea', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>To'lovlar Soni</div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
              {payments.length} ta chek
            </div>
          </div>
        </div>

      </div>

      {/* Payments History Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: 0 }}>
            To'lovlar Ro'yxati
          </h3>
        </div>

        {loading ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>To'lovlar yuklanmoqda...</div>
        ) : payments.length === 0 ? (
          <div style={{ padding: '50px', textAlign: 'center', color: '#64748b' }}>
            Hozircha to'lovlar tarixi mavjud emas.
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>To'lov ID</th>
                {isManagerOrAdmin && <th>O'quvchi</th>}
                <th>To'lov Oyi / Sanasi</th>
                <th>Miqdori</th>
                <th>To'lov Turi</th>
                <th>Status</th>
                <th>Kvitansiya</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '700', color: '#64748b' }}>#{p.id}</td>
                  {isManagerOrAdmin && (
                    <td style={{ fontWeight: '700' }}>
                      {p.student_name || p.student_username || `Student #${p.student}`}
                    </td>
                  )}
                  <td style={{ fontWeight: '600' }}>{p.payment_month || p.created_at?.split('T')[0] || 'N/A'}</td>
                  <td style={{ fontWeight: '800', color: '#2563eb' }}>
                    {parseFloat(p.amount).toLocaleString()} UZS
                  </td>
                  <td>
                    <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                      {p.method}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'completed' ? 'badge-active' : 'badge-hold'}`}>
                      {p.status === 'completed' ? 'To\'langan ✓' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setSelectedReceipt(p)}
                    >
                      <FileText size={14} />
                      <span>Chekni ko'rish</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Manager Add Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Yangi To'lov Qabul Qilish</h3>
            </div>
            <form onSubmit={handleCreatePayment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label>O'quvchi *</label>
                  <select 
                    className="form-select"
                    required
                    value={newPayment.student}
                    onChange={(e) => setNewPayment({ ...newPayment, student: e.target.value })}
                  >
                    <option value="">-- O'quvchini tanlang --</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.first_name ? `${s.first_name} ${s.last_name || ''}` : s.username} (@{s.username})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Guruh (ixtiyoriy)</label>
                  <select 
                    className="form-select"
                    value={newPayment.group}
                    onChange={(e) => setNewPayment({ ...newPayment, group: e.target.value })}
                  >
                    <option value="">-- Guruhni tanlang --</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>To'lov Summasi (UZS) *</label>
                  <input 
                    type="number"
                    className="form-input"
                    required
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>To'lov Oyi *</label>
                  <input 
                    type="date"
                    className="form-input"
                    required
                    value={newPayment.payment_month}
                    onChange={(e) => setNewPayment({ ...newPayment, payment_month: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>To'lov Usuli</label>
                  <select 
                    className="form-select"
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value })}
                  >
                    <option value="cash">Naqd pul (Cash)</option>
                    <option value="payme">Payme</option>
                    <option value="click">Click</option>
                    <option value="card">Plastik karta</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingPayment}>
                  <span>{savingPayment ? "Saqlanmoqda..." : "To'lovni Tasdiqlash"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>To'lov Kvitansiyasi</h3>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Tranzaksiya #{selectedReceipt.id}</span>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {selectedReceipt.student_name && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: '#64748b' }}>O'quvchi:</span>
                  <strong>{selectedReceipt.student_name}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>To'lov miqdori:</span>
                <strong style={{ fontSize: '16px', color: '#2563eb' }}>{parseFloat(selectedReceipt.amount).toLocaleString()} UZS</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>To'lov oyi:</span>
                <strong>{selectedReceipt.payment_month || 'Joriy oy'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>To'lov usuli:</span>
                <strong style={{ textTransform: 'uppercase' }}>{selectedReceipt.method}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#64748b' }}>Holati:</span>
                <span className="badge badge-active">{selectedReceipt.status}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => window.print()}>
                <Download size={16} />
                <span>Chop etish</span>
              </button>
              <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setSelectedReceipt(null)}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
