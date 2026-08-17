import React, { useState, useEffect } from 'react';
import { Building2, Plus, Globe, Trash2, Users, ShieldCheck, RefreshCw, Edit } from 'lucide-react';
import { customerService } from '../services/api';

export default function SuperAdminPage() {
  const [organizations, setOrganizations] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [newOrg, setNewOrg] = useState({
    name: '',
    schema_name: '',
    domain_name: '',
    admin_username: '',
    admin_password: ''
  });

  const [editingOrg, setEditingOrg] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const orgs = await customerService.getOrganizations();
      setOrganizations(Array.isArray(orgs) ? orgs : []);

      const doms = await customerService.getDomains();
      setDomains(Array.isArray(doms) ? doms : []);
    } catch (err) {
      console.error("Error fetching organizations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    try {
      await customerService.createOrganization(newOrg);
      setShowModal(false);
      setNewOrg({ name: '', schema_name: '', domain_name: '', admin_username: '', admin_password: '' });
      fetchData();
    } catch (err) {
      alert("Markaz yaratishda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleUpdateOrg = async (e) => {
    e.preventDefault();
    try {
      await customerService.updateOrganization(editingOrg.id, {
        domain_name: editingOrg.domain_name,
        admin_username: editingOrg.admin_username,
        admin_password: editingOrg.admin_password
      });
      setShowEditModal(false);
      setEditingOrg(null);
      fetchData();
    } catch (err) {
      alert("Markazni tahrirlashda xatolik: " + JSON.stringify(err.response?.data || err.message));
    }
  };

  const openEditModal = (org) => {
    const primaryDomain = org.domains && org.domains.length > 0 ? org.domains[0].domain : `${org.schema_name}.localhost`;
    setEditingOrg({
      id: org.id,
      name: org.name,
      schema_name: org.schema_name,
      domain_name: primaryDomain,
      admin_username: `${org.schema_name}_admin`, // Default guess or could be empty to just allow input
      admin_password: ''
    });
    setShowEditModal(true);
  };

  const handleDeleteOrg = async (id, schemaName) => {
    if (schemaName === 'public') {
      alert("Asosiy (public) markazni o'chirib bo'lmaydi!");
      return;
    }
    if (window.confirm(`Haqiqatdan ham '${schemaName}' markazini bazadan o'chirmoqchimisiz?`)) {
      try {
        await customerService.deleteOrganization(id);
        fetchData();
      } catch (err) {
        alert("O'chirishda xatolik: " + JSON.stringify(err.response?.data || err.message));
      }
    }
  };

  return (
    <div>
      {/* Title & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Super Admin Panel — O'quv Markazlar (Tenants)</h2>
          <span style={{ fontSize: '13px', color: '#64748b' }}>
            Django Multi-Tenants: Har bir o'quv markazi uchun alohida DB Schema, Subdomen va Admin avtomatik yaratiladi.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            <span>Yangilash</span>
          </button>

          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={18} />
            <span>Yangi Markaz Yaratish</span>
          </button>
        </div>
      </div>

      {/* Top Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-title">Jami Markazlar (Tenants)</div>
            <div className="stat-value">{organizations.length}</div>
          </div>
          <div className="stat-icon-wrapper"><Building2 size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Biriktirilgan Domenlar</div>
            <div className="stat-value">{domains.length}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#e0f2fe', color: '#0ea5e9' }}><Globe size={22} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-title">Faol Schema'lar</div>
            <div className="stat-value">{organizations.filter(o => o.is_active).length}</div>
          </div>
          <div className="stat-icon-wrapper" style={{ background: '#dcfce7', color: '#16a34a' }}><ShieldCheck size={22} /></div>
        </div>
      </div>

      {/* Organizations Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>O'quv markazlar yuklanmoqda...</div>
        ) : organizations.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
            Hozircha o'quv markazlar yo'q. Yuqoridagi "Yangi Markaz Yaratish" tugmasini bosing!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Markaz Nomi</th>
                  <th>Schema Nomi</th>
                  <th>Subdomen / Domen</th>
                  <th>O'quvchilar</th>
                  <th>O'qituvchilar</th>
                  <th>Adminlar</th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Amallar</th>
                </tr>
              </thead>
              <tbody>
                {organizations.map((org) => {
                  const primaryDomain = org.domains && org.domains.length > 0 ? org.domains[0].domain : `${org.schema_name}.localhost`;
                  return (
                    <tr key={org.id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#0f172a' }}>{org.name}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Yaratilgan: {new Date(org.created_on).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', color: '#2563eb' }}>
                          {org.schema_name}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        <Globe size={14} style={{ verticalAlign: 'middle', marginRight: '6px', color: '#0ea5e9' }} />
                        {primaryDomain}
                      </td>
                      <td style={{ fontWeight: '700' }}>{org.student_count} ta</td>
                      <td style={{ fontWeight: '700' }}>{org.teacher_count} ta</td>
                      <td style={{ fontWeight: '700' }}>{org.admin_count} ta</td>
                      <td>
                        <span className={`badge ${org.is_active ? 'badge-active' : 'badge-hold'}`}>
                          {org.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        {org.schema_name !== 'public' && (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                              className="btn btn-secondary icon-btn" 
                              style={{ padding: '4px', color: '#3b82f6', border: 'none', background: 'transparent' }}
                              onClick={() => openEditModal(org)}
                              title="Tahrirlash / Parolni o'zgartirish"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              className="btn btn-secondary icon-btn" 
                              style={{ padding: '4px', color: '#ef4444', border: 'none', background: 'transparent' }}
                              onClick={() => handleDeleteOrg(org.id, org.schema_name)}
                              title="Markazni o'chirish"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Organization */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Yangi O'quv Markaz (Tenant) Yaratish</h3>
            </div>
            <form onSubmit={handleCreateOrg}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Markaz Nomi (Organization Name) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="Masalan: Shokh English Academy"
                    value={newOrg.name} 
                    onChange={(e) => {
                      const nameVal = e.target.value;
                      const schemaVal = nameVal.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setNewOrg({ 
                        ...newOrg, 
                        name: nameVal,
                        schema_name: schemaVal,
                        domain_name: `${schemaVal}.localhost`,
                        admin_username: `${schemaVal}_admin`
                      });
                    }} 
                  />
                </div>

                <div className="form-group">
                  <label>Schema Nomi (Kichik lotin harflari va raqamlar) *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="shokh"
                    value={newOrg.schema_name} 
                    onChange={(e) => setNewOrg({ ...newOrg, schema_name: e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '') })} 
                  />
                </div>

                <div className="form-group">
                  <label>Subdomen / Domen Nomi *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="shokh.localhost yoki shokh.com"
                    value={newOrg.domain_name} 
                    onChange={(e) => setNewOrg({ ...newOrg, domain_name: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>Markaz Admin Logini (Admin Username)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="admin_shokh"
                    value={newOrg.admin_username} 
                    onChange={(e) => setNewOrg({ ...newOrg, admin_username: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>Markaz Admin Paroli (Admin Password)</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="admin123"
                    value={newOrg.admin_password} 
                    onChange={(e) => setNewOrg({ ...newOrg, admin_password: e.target.value })} 
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Markazni Yaratish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Organization / Reset Admin Password */}
      {showEditModal && editingOrg && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Tahrirlash: {editingOrg.name}</h3>
            </div>
            <form onSubmit={handleUpdateOrg}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subdomen / Domen Nomi</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    placeholder="shokh.localhost yoki shokh.com"
                    value={editingOrg.domain_name} 
                    onChange={(e) => setEditingOrg({ ...editingOrg, domain_name: e.target.value })} 
                  />
                </div>

                <div className="form-group" style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>Admin Parolini Tiklash (Ixtiyoriy)</h4>
                  <label>Qaysi Admin Logini?</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Paroli tiklanadigan admin logini (masalan: shokh_admin)"
                    value={editingOrg.admin_username} 
                    onChange={(e) => setEditingOrg({ ...editingOrg, admin_username: e.target.value })} 
                  />
                </div>

                <div className="form-group">
                  <label>Yangi Parol (Yangi parolni kiriting)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Yangi parol (bo'sh qoldirsangiz o'zgarmaydi)"
                    value={editingOrg.admin_password} 
                    onChange={(e) => setEditingOrg({ ...editingOrg, admin_password: e.target.value })} 
                  />
                  <small style={{ color: '#64748b', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                    Diqqat! Bu amal ko'rsatilgan adminning parolini darhol yangilaydi.
                  </small>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
