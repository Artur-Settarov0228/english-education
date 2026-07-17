const API_BASE = 'http://127.0.0.1:8000/api';

const teachersTableBody = document.querySelector('.crm-table tbody');
const addTeacherForm = document.querySelector('.crm-form');

// Fetch and render teachers
async function fetchTeachers() {
  teachersTableBody.innerHTML = `
    <tr>
      <td colspan="6" style="text-align: center; color: var(--crm-text-muted);">
        Yuklanmoqda...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API_BASE}/users/?role=teacher`);
    if (!res.ok) throw new Error("O'qituvchilarni yuklashda xatolik");
    const teachers = await res.json();

    teachersTableBody.innerHTML = '';
    if (teachers.length === 0) {
      teachersTableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--crm-text-muted);">
            O'qituvchilar topilmadi.
          </td>
        </tr>
      `;
      return;
    }

    teachers.forEach(t => {
      const tr = document.createElement('tr');
      const spec = t.email.includes('ielts') ? 'IELTS Specialist' : 'General English';
      const avatarLetters = ((t.first_name ? t.first_name[0] : '') + (t.last_name ? t.last_name[0] : '')).toUpperCase() || t.username.substring(0,2).toUpperCase();

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="crm-avatar" style="width:32px; height:32px; font-size:0.8rem; background:#ebe9fe;">${avatarLetters}</div>
            <div>
              <strong>${t.first_name} ${t.last_name}</strong>
              <div style="font-size:0.72rem; color:var(--crm-text-muted);">${t.email || ''}</div>
            </div>
          </div>
        </td>
        <td><span class="crm-badge primary">${spec}</span></td>
        <td>${t.phone_number || '-'}</td>
        <td><strong style="color: var(--crm-primary)">Faol</strong></td>
        <td><span class="crm-badge success">Faol</span></td>
        <td>
          <button class="crm-btn crm-btn-secondary" style="padding: 4px 8px; font-size: 0.72rem;" onclick="deleteTeacher(${t.id})">O'chirish</button>
        </td>
      `;
      teachersTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    teachersTableBody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--crm-danger);">
          Xatolik yuz berdi: ${err.message}
        </td>
      </tr>
    `;
  }
}

// Add new teacher
addTeacherForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('tName').value.split(' ');
  const firstName = nameInput[0] || '';
  const lastName = nameInput.slice(1).join(' ') || '';
  
  const teacherData = {
    username: 'teacher_' + Math.floor(Math.random() * 10000),
    first_name: firstName,
    last_name: lastName,
    email: document.getElementById('tEmail').value,
    phone_number: document.getElementById('tPhone').value,
    role: 'teacher'
  };

  try {
    const res = await fetch(`${API_BASE}/users/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teacherData)
    });

    if (!res.ok) throw new Error("Saqlashda xatolik yuz berdi");
    alert("O'qituvchi muvaffaqiyatli qo'shildi!");
    addTeacherForm.reset();
    fetchTeachers();
  } catch (err) {
    alert(err.message);
  }
});

// Delete teacher helper
window.deleteTeacher = async function(id) {
  if (!confirm("O'qituvchini o'chirishni tasdiqlaysizmi?")) return;
  try {
    const res = await fetch(`${API_BASE}/users/${id}/`, { method: 'DELETE' });
    if (!res.ok) throw new Error("O'chirishda xatolik");
    alert("O'qituvchi o'chirildi.");
    fetchTeachers();
  } catch (err) {
    alert(err.message);
  }
};

fetchTeachers();
