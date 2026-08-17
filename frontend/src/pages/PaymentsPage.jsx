import React, { useState, useEffect } from 'react';
import { 
  CreditCard, CheckCircle2, Clock, RefreshCw, 
  FileText, Download, ShieldCheck, DollarSign, X
} from 'lucide-react';
import { paymentService } from '../services/api';

export default function PaymentsPage({ currentUser }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentService.getPayments();
      const pList = Array.isArray(res) ? res : [];
      setPayments(pList);
    } catch (err) {
      console.error("Payments fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0' }}>
            To'lovlarim & Kvitansiyalar
          </h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Kurs uchun amalga oshirilgan to'lovlar tarixi va cheklar
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchPayments} title="Yangilash">
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
          <span>Yangilash</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
        
        <div className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Jami To'langan</div>
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
            To'lovlar Tarixi
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
