const API_BASE = 'http://127.0.0.1:8000/api';

const groupInfoCard = document.querySelector('.left-column + .crm-card, .crm-card'); // First card containing group info
const attendanceTable = document.querySelector('.crm-attendance-table');
const attendanceTableBody = attendanceTable.querySelector('tbody');
const attendanceTableHead = attendanceTable.querySelector('thead tr');

let groupsList = [];
let activeGroup = null;

// Fetch and load groups
async function loadGroups() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    groupsList = await res.json();

    if (groupsList.length > 0) {
      activeGroup = groupsList[0];
      renderGroupInfo();
      fetchGroupStudents(activeGroup.id);
    } else {
      groupInfoCard.innerHTML = '<p style="padding: 20px; color: var(--crm-text-muted);">Guruhlar mavjud emas.</p>';
    }
  } catch (err) {
    console.error(err);
  }
}

// Render selected Group info
function renderGroupInfo() {
  if (!activeGroup) return;

  groupInfoCard.innerHTML = `
    <div class="crm-card-header" style="border-bottom: 1px solid var(--crm-border); padding-bottom: 12px; margin-bottom: 15px;">
      <div>
        <span class="crm-badge primary" style="margin-bottom: 6px;">Tesla Education</span>
        <h2 style="font-size: 1.2rem; font-weight: 800; color: var(--crm-primary);">${activeGroup.name}</h2>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:12px; font-size:0.85rem;">
      <div>
        <span style="color:var(--crm-text-muted); display:block; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Guruh nomi:</span>
        <strong>${activeGroup.name}</strong>
      </div>
      
      <div>
        <span style="color:var(--crm-text-muted); display:block; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Dars kunlari va vaqti:</span>
        <strong>${activeGroup.schedule || '17:00 (Dush/Chor/Jum)'}</strong>
      </div>

      <div>
        <span style="color:var(--crm-text-muted); display:block; font-size:0.75rem; text-transform:uppercase; font-weight:700;">Loyiha mutaxassisligi:</span>
        <strong>IELTS Foundation</strong>
      </div>

      <div style="border-top:1px solid var(--crm-border); padding-top:12px; margin-top:5px; font-size:0.8rem;">
        <p>Loyiha narxi: <strong style="color:var(--crm-success);">700,000 UZS / oy</strong></p>
      </div>
    </div>
  `;
}

// Fetch students for the selected group & render interactive Davomat grid
async function fetchGroupStudents(groupId) {
  attendanceTableBody.innerHTML = `
    <tr>
      <td colspan="10" style="text-align: center; color: var(--crm-text-muted);">
        O'quvchilar yuklanmoqda...
      </td>
    </tr>
  `;

  try {
    const res = await fetch(`${API_BASE}/groups/${groupId}/students/`);
    if (!res.ok) throw new Error("Guruh o'quvchilarini yuklashda xatolik");
    const students = await res.json();

    attendanceTableBody.innerHTML = '';
    if (students.length === 0) {
      attendanceTableBody.innerHTML = `
        <tr>
          <td colspan="10" style="text-align: center; color: var(--crm-text-muted);">
            Ushbu guruhda o'quvchilar topilmadi.
          </td>
        </tr>
      `;
      return;
    }

    students.forEach((s, sIdx) => {
      const tr = document.createElement('tr');
      
      let cellsHTML = `<td><strong>${s.full_name}</strong></td>`;
      // Render 9 date columns with simulated checkmark buttons that toggle state when clicked!
      for (let i = 1; i <= 9; i++) {
        // Toggle initial state randomly for visual richness
        const isPresent = (sIdx + i) % 3 !== 0;
        const btnClass = isPresent ? 'present' : 'absent';
        const char = isPresent ? '✓' : '✗';
        cellsHTML += `
          <td class="attendance-cell">
            <button class="crm-attendance-btn ${btnClass}" onclick="toggleAttendanceCell(this)">${char}</button>
          </td>
        `;
      }
      
      tr.innerHTML = cellsHTML;
      attendanceTableBody.appendChild(tr);
    });
  } catch (err) {
    console.error(err);
    attendanceTableBody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align: center; color: var(--crm-danger);">
          Xatolik yuz berdi: ${err.message}
        </td>
      </tr>
    `;
  }
}

// Interactive check/cross toggler
window.toggleAttendanceCell = function(btn) {
  if (btn.classList.contains('present')) {
    btn.classList.remove('present');
    btn.classList.add('absent');
    btn.textContent = '✗';
  } else {
    btn.classList.remove('absent');
    btn.classList.add('present');
    btn.textContent = '✓';
  }
};

loadGroups();
