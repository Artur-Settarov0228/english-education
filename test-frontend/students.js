const API_BASE = 'http://127.0.0.1:8000/api';

const studentsTableBody = document.querySelector('.crm-table tbody');
const profileCard = document.querySelector('.left-column + .crm-card');

// Modal Elements
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');

// State variables
let studentsList = [];
let studentGroupMap = {}; // Maps studentId -> { groupId, groupName }

// Build student-group lookup map
async function buildStudentGroupMap() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) return;
    const groups = await res.json();

    for (const g of groups) {
      const studentsRes = await fetch(`${API_BASE}/groups/${g.id}/students/`);
      if (studentsRes.ok) {
        const students = await studentsRes.json();
        students.forEach(s => {
          studentGroupMap[s.id] = {
            groupId: g.id,
            groupName: g.name
          };
        });
      }
    }
  } catch (e) {
    console.error("Error building student-group map:", e);
  }
}

// Fetch and render students
async function fetchStudents() {
  studentsTableBody.innerHTML = `
    <tr>
      <td colspan="5" style="text-align: center; color: var(--crm-text-muted);">
        Yuklanmoqda...
      </td>
    </tr>
  `;

  // Build the group map first
  await buildStudentGroupMap();

  try {
    const res = await fetch(`${API_BASE}/users/?role=student`);
    if (!res.ok) throw new Error("O'quvchilarni yuklashda xatolik");
    studentsList = await res.json();

    studentsTableBody.innerHTML = '';
    if (studentsList.length === 0) {
      studentsTableBody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; color: var(--crm-text-muted);">
            O'quvchilar topilmadi.
          </td>
        </tr>
      `;
      return;
    }

    studentsList.forEach(s => {
      const tr = document.createElement('tr');
      const avatarLetters = ((s.first_name ? s.first_name[0] : '') + (s.last_name ? s.last_name[0] : '')).toUpperCase() || s.username.substring(0,2).toUpperCase();
      const balance = s.id % 2 === 0 ? '+350,000 UZS' : '-150,000 UZS';
      const balanceStyle = s.id % 2 === 0 ? 'color: var(--crm-success); font-weight:700;' : 'color: var(--crm-danger); font-weight:700;';

      const grpInfo = studentGroupMap[s.id] || { groupName: 'Loyiha' };

      tr.innerHTML = `
        <td>
          <div style="display:flex; align-items:center; gap:10px;">
            <div class="crm-avatar" style="width:32px; height:32px; font-size:0.8rem; background:#ebe9fe;">${avatarLetters}</div>
            <div>
              <strong>${s.first_name} ${s.last_name}</strong>
              <div style="font-size:0.72rem; color:var(--crm-text-muted);">@${s.username}</div>
            </div>
          </div>
        </td>
        <td><span class="crm-badge primary">${grpInfo.groupName}</span></td>
        <td>${s.phone_number || '-'}</td>
        <td><span style="${balanceStyle}">${balance}</span></td>
        <td>
          <button class="crm-btn crm-btn-secondary" style="padding: 4px 8px; font-size: 0.72rem;" onclick="viewStudentDetails(${s.id})">Profil</button>
        </td>
      `;
      
      tr.addEventListener('click', () => viewStudentDetails(s.id));
      studentsTableBody.appendChild(tr);
    });

    if (studentsList.length > 0) {
      viewStudentDetails(studentsList[0].id);
    }
  } catch (err) {
    console.error(err);
    studentsTableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--crm-danger);">
          Xatolik yuz berdi: ${err.message}
        </td>
      </tr>
    `;
  }
}

// View student details
window.viewStudentDetails = async function(studentId) {
  const student = studentsList.find(s => s.id === studentId);
  if (!student) return;

  const rows = studentsTableBody.querySelectorAll('tr');
  rows.forEach(r => r.style.background = 'none');
  
  const selectedRow = Array.from(rows).find(r => r.innerHTML.includes(`@${student.username}`));
  if (selectedRow) {
    selectedRow.style.background = '#f8fafc';
  }

  const avatarLetters = ((student.first_name ? student.first_name[0] : '') + (student.last_name ? student.last_name[0] : '')).toUpperCase() || student.username.substring(0,2).toUpperCase();
  const grpInfo = studentGroupMap[student.id] || { groupId: null, groupName: 'Guruhsiz' };

  profileCard.innerHTML = `
    <div class="crm-card-header" style="border-bottom: 1px solid var(--crm-border); padding-bottom: 12px; margin-bottom: 20px;">
      <h2 class="crm-card-title">O'quvchi profili</h2>
    </div>

    <div style="display:flex; align-items:center; gap:15px; margin-bottom: 25px;">
      <div class="crm-avatar" style="width:55px; height:55px; font-size:1.4rem; background: linear-gradient(135deg, var(--crm-primary), var(--crm-secondary)); color:#fff; border:none;">${avatarLetters}</div>
      <div>
        <h3 style="font-size: 1.1rem; font-weight:800;">${student.first_name} ${student.last_name}</h3>
        <p style="font-size:0.8rem; color:var(--crm-text-muted);">Guruh: ${grpInfo.groupName} | ID: #9${student.id}</p>
      </div>
    </div>

    <!-- Achievements Badges -->
    <div style="margin-bottom: 25px;">
      <label style="font-size:0.72rem; font-weight:700; color:var(--crm-text-muted); text-transform:uppercase; display:block; margin-bottom:10px;">Mening nishonlarim (Achievements)</label>
      <div class="crm-badge-grid" id="studentBadgesList">
        <p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Nishonlar yuklanmoqda...</p>
      </div>
    </div>

    <!-- Skills Progress Analytics -->
    <div style="margin-bottom: 25px;">
      <label style="font-size:0.72rem; font-weight:700; color:var(--crm-text-muted); text-transform:uppercase; display:block; margin-bottom:10px;">Ko'nikmalar tahlili (Skills Analytics)</label>
      <div style="display:flex; flex-direction:column; gap:12px;" id="studentAnalyticsList">
        <p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Analitika yuklanmoqda...</p>
      </div>
    </div>

    <!-- Grade Sheet List -->
    <div style="margin-bottom: 25px;">
      <label style="font-size:0.72rem; font-weight:700; color:var(--crm-text-muted); text-transform:uppercase; display:block; margin-bottom:10px;">Oxirgi baholar (Grade Sheet)</label>
      <div style="display:flex; flex-direction:column; gap:8px;" id="studentGradesList">
        <p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Baholar yuklanmoqda...</p>
      </div>
    </div>

    <!-- Group Video Lessons Section (Requested Feature) -->
    <div>
      <label style="font-size:0.72rem; font-weight:700; color:var(--crm-text-muted); text-transform:uppercase; display:block; margin-bottom:10px;">Guruhim Video Darslari</label>
      <div style="display:flex; flex-direction:column; gap:10px;" id="studentLessonsList">
        <p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Darslar yuklanmoqda...</p>
      </div>
    </div>
  `;

  // Fetch sub-items
  loadStudentBadges(student.id);
  loadStudentAnalytics(student.id);
  loadStudentGrades(student.id);
  loadStudentVideoLessons(grpInfo.groupId, grpInfo.groupName);
};

// Fetch and render badges
async function loadStudentBadges(studentId) {
  const container = document.getElementById('studentBadgesList');
  try {
    const res = await fetch(`${API_BASE}/badges/?student=${studentId}`);
    if (!res.ok) throw new Error();
    const badges = await res.json();
    
    container.innerHTML = '';
    if (badges.length === 0) {
      container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Hozircha yutuqlar yo\'q.</p>';
      return;
    }

    badges.forEach(b => {
      container.innerHTML += `
        <div class="crm-badge-item" title="${b.badge_description}">
          <span class="crm-badge-emoji">${b.badge_icon}</span>
          <span class="crm-badge-title">${b.badge_name}</span>
        </div>
      `;
    });
  } catch (e) {
    container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted);">Yuklashda xatolik</p>';
  }
}

// Fetch and render analytics
async function loadStudentAnalytics(studentId) {
  const container = document.getElementById('studentAnalyticsList');
  try {
    const res = await fetch(`${API_BASE}/grades/analytics/?student=${studentId}`);
    if (!res.ok) throw new Error();
    const data = await res.json();

    container.innerHTML = '';
    const skills = [
      { key: 'speaking', label: 'Speaking', color: '#ef4444' },
      { key: 'listening', label: 'Listening', color: '#3b82f6' },
      { key: 'reading', label: 'Reading', color: '#10b981' },
      { key: 'writing', label: 'Writing', color: '#f59e0b' },
      { key: 'grammar', label: 'Grammar', color: '#5e50f1' }
    ];

    skills.forEach(skill => {
      const pct = data[skill.key] !== undefined ? data[skill.key] : 0.0;
      container.innerHTML += `
        <div>
          <div style="display:flex; justify-content:space-between; font-size:0.78rem; font-weight:600; margin-bottom:4px;">
            <span>${skill.label}</span>
            <span>${pct}%</span>
          </div>
          <div class="crm-progress-bar-bg">
            <div class="crm-progress-bar-fill" style="width: ${pct}%; background: ${skill.color};"></div>
          </div>
        </div>
      `;
    });
  } catch (e) {
    container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted);">Yuklashda xatolik</p>';
  }
}

// Fetch and render grades
async function loadStudentGrades(studentId) {
  const container = document.getElementById('studentGradesList');
  try {
    const res = await fetch(`${API_BASE}/grades/?student=${studentId}`);
    if (!res.ok) throw new Error();
    const grades = await res.json();

    container.innerHTML = '';
    if (grades.length === 0) {
      container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Baholar mavjud emas.</p>';
      return;
    }

    grades.forEach(g => {
      const formattedDate = new Date(g.created_at).toLocaleDateString();
      container.innerHTML += `
        <div style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:8px 12px; border-radius:8px; border:1px solid var(--crm-border); gap:10px;">
          <div style="width: 70%;">
            <strong style="font-size:0.8rem; display:block;">${g.task_title}</strong>
            <span style="font-size:0.7rem; color:var(--crm-text-muted); display:block; margin-bottom:4px;">${formattedDate}</span>
            ${g.audio_feedback ? `
              <audio src="${g.audio_feedback}" controls style="width:100%; height:24px;"></audio>
            ` : ''}
          </div>
          <span class="crm-badge success">${parseFloat(g.score)}</span>
        </div>
      `;
    });
  } catch (e) {
    container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted);">Yuklashda xatolik</p>';
  }
}

// Fetch and render student video lessons matching Screenshot 1 exactly
async function loadStudentVideoLessons(groupId, groupName) {
  const container = document.getElementById('studentLessonsList');
  if (!groupId) {
    container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">O\'quvchi guruhga biriktirilmagan.</p>';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/lessons/?group=${groupId}`);
    if (!res.ok) throw new Error();
    const lessons = await res.json();

    container.innerHTML = '';
    const uploadedLessons = lessons.filter(l => l.upload_status === 'uploaded' && l.youtube_video_id);

    if (uploadedLessons.length === 0) {
      container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Guruh uchun darslar topilmadi.</p>';
      return;
    }

    uploadedLessons.forEach(l => {
      const card = document.createElement('div');
      card.style.display = 'flex';
      card.style.justifyContent = 'space-between';
      card.style.alignItems = 'center';
      card.style.background = '#f8fafc';
      card.style.padding = '10px 14px';
      card.style.borderRadius = '10px';
      card.style.border = '1px solid var(--crm-border)';

      card.innerHTML = `
        <div>
          <strong style="font-size:0.85rem; display:block;">${l.topic}</strong>
          <span style="font-size:0.72rem; color:var(--crm-text-muted);">Sana: ${l.date}</span>
        </div>
        <button class="crm-btn crm-btn-secondary" style="font-size:0.7rem; padding:4px 8px; border-color:var(--crm-success); color:var(--crm-success); font-weight:700; text-transform:uppercase;">Ko'rish</button>
      `;

      card.querySelector('button').addEventListener('click', () => openPlayer(l, groupName));
      container.appendChild(card);
    });
  } catch (e) {
    container.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted);">Yuklashda xatolik</p>';
  }
}

// Player Modal Controls
window.openPlayer = function(lesson, groupName) {
  modalTitle.textContent = lesson.topic;
  modalSubtitle.textContent = `Guruh: ${groupName} | Sana: ${lesson.date}`;
  videoModal.classList.add('open');
  initLessonPlayer(lesson.youtube_video_id);
};

window.closePlayer = function() {
  videoModal.classList.remove('open');
  destroyLessonPlayer();
};

if (modalClose) {
  modalClose.addEventListener('click', closePlayer);
}
if (videoModal) {
  videoModal.addEventListener('click', (e) => {
    if (e.target === videoModal) closePlayer();
  });
}

fetchStudents();
