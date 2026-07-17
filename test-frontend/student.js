const API_BASE = 'http://127.0.0.1:8000/api';

// State Variables
let groupsList = [];
let allStudentsInGroups = []; // List of { id, username, full_name, group_id, group_name }
let activeTasksList = []; // Tasks list for the selected mock student's group
let countdownIntervals = []; // Array of timers to clear

// Audio Recording State (Student speaking)
let mediaRecorder = null;
let audioChunks = [];
let recordedAudioBlob = null;
let recordTimerInterval = null;
let recordDurationSeconds = 0;

// DOM Elements
const mockStudentSelect = document.getElementById('mockStudentSelect');
const submitTaskSelect = document.getElementById('submitTaskSelect');
const submissionForm = document.getElementById('submissionForm');

// Homework Submission Widgets
const taskBriefArea = document.getElementById('taskBriefArea');
const briefSkill = document.getElementById('briefSkill');
const briefDescription = document.getElementById('briefDescription');
const briefMeta = document.getElementById('briefMeta');
const briefCountdown = document.getElementById('briefCountdown');
const standardSubmissionInputs = document.getElementById('standardSubmissionInputs');
const speakingSubmissionInputs = document.getElementById('speakingSubmissionInputs');
const quizSubmissionInputs = document.getElementById('quizSubmissionInputs');
const quizQuestionsToSolve = document.getElementById('quizQuestionsToSolve');
const btnSubmitSubmission = document.getElementById('btnSubmitSubmission');

// Audio Recorder controls
const btnRecord = document.getElementById('btnRecord');
const btnStopRecord = document.getElementById('btnStopRecord');
const recorderStatus = document.getElementById('recorderStatus');
const audioPreviewArea = document.getElementById('audioPreviewArea');
const audioPlayback = document.getElementById('audioPlayback');
const btnResetRecord = document.getElementById('btnResetRecord');

// Lists & Containers
const studentProfileCard = document.getElementById('studentProfileCard');
const studentGradesList = document.getElementById('studentGradesList');
const studentGroupLeaderboard = document.getElementById('studentGroupLeaderboard');
const analyticsBarsContainer = document.getElementById('analyticsBarsContainer');
const studentBadgesGrid = document.getElementById('studentBadgesGrid');
const badgesShowcaseBox = document.getElementById('badgesShowcaseBox');
const studentLessonsContainer = document.getElementById('studentLessonsContainer');

// Modal Elements
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const videoPlayerFrame = document.getElementById('videoPlayerFrame');

// Fetch Groups and build Students List
async function loadGroupsData() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    groupsList = await res.json();

    await buildStudentsMapping();
    loadStudentPanelData();
  } catch (err) {
    console.error(err);
  }
}

// Build list of all students enrolled in all groups
async function buildStudentsMapping() {
  allStudentsInGroups = [];
  for (const g of groupsList) {
    try {
      const res = await fetch(`${API_BASE}/groups/${g.id}/students/`);
      if (res.ok) {
        const students = await res.json();
        students.forEach(s => {
          allStudentsInGroups.push({
            id: s.id,
            username: s.username,
            full_name: s.full_name,
            group_id: g.id,
            group_name: g.name
          });
        });
      }
    } catch (e) {
      console.error(`Error mapping students for group ${g.id}:`, e);
    }
  }
}

// Populate mock student selector
function loadStudentPanelData() {
  mockStudentSelect.innerHTML = '<option value="" disabled selected>O\'quvchini tanlang...</option>';
  
  if (allStudentsInGroups.length === 0) {
    mockStudentSelect.innerHTML = '<option value="" disabled>Tizimda o\'quvchilar topilmadi</option>';
    return;
  }

  const uniqueStudents = [];
  const seenIds = new Set();
  allStudentsInGroups.forEach(s => {
    if (!seenIds.has(s.id)) {
      seenIds.add(s.id);
      uniqueStudents.push(s);
    }
  });

  uniqueStudents.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.id;
    opt.textContent = `${s.full_name} (Guruh: ${s.group_name})`;
    mockStudentSelect.appendChild(opt);
  });
}

// Escape Helper
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Student Selection Change
mockStudentSelect.addEventListener('change', async () => {
  const studentId = parseInt(mockStudentSelect.value);
  const student = allStudentsInGroups.find(s => s.id === studentId);
  if (!student) return;

  // Show profile card
  studentProfileCard.style.display = 'flex';
  document.getElementById('profileName').textContent = student.full_name;
  document.getElementById('profileRole').textContent = `Rol: O'quvchi (Student)`;
  document.getElementById('profilePhone').textContent = `Guruh: ${student.group_name}`;

  // Fetch student components
  fetchStudentBadges(studentId);
  fetchStudentGrades(studentId);
  fetchStudentAnalytics(studentId);
  loadStudentSubmissionDropdown(student);
  fetchStudentGroupLeaderboard(student.group_id, studentId);

  // Fetch student lessons
  document.getElementById('studentLessonsPanel').style.display = 'block';
  fetchStudentLessons(student.group_id);
});

// Fetch Student Badges
async function fetchStudentBadges(studentId) {
  studentBadgesGrid.innerHTML = '';
  badgesShowcaseBox.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/badges/?student=${studentId}`);
    if (res.ok) {
      const badges = await res.json();
      if (badges.length > 0) {
        badgesShowcaseBox.style.display = 'block';
        badges.forEach(b => {
          const item = document.createElement('div');
          item.className = 'badge-item';
          item.title = b.badge_description;
          item.innerHTML = `
            <span class="badge-item-icon">${b.badge_icon}</span>
            <span class="badge-item-name">${b.badge_name}</span>
          `;
          studentBadgesGrid.appendChild(item);
        });
      }
    }
  } catch (e) {
    console.error("Badges loading error:", e);
  }
}

// Fetch Student Grades list (with audio comments)
async function fetchStudentGrades(studentId) {
  studentGradesList.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Baholar yuklanmoqda...</p></div>`;
  try {
    const res = await fetch(`${API_BASE}/grades/?student=${studentId}`);
    if (!res.ok) throw new Error("Baholarni yuklashda xatolik");
    const grades = await res.json();

    studentGradesList.innerHTML = '';
    if (grades.length === 0) {
      studentGradesList.innerHTML = '<p class="empty-state">Sizga hali baho qo\'yilmagan.</p>';
    } else {
      grades.forEach(g => {
        const card = document.createElement('div');
        card.className = 'grade-card';
        card.innerHTML = `
          <div class="grade-info" style="width: 75%;">
            <div class="grade-task-title">${g.task_title}</div>
            <div class="meta-item" style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 5px;">Turi: ${g.task_type === 'exam' ? 'Imtihon' : g.task_type === 'quiz' ? 'Test' : 'Vazifa'}</div>
            ${g.teacher_feedback ? `<div class="grade-feedback" style="margin-bottom: 5px;">Izoh: "${g.teacher_feedback}"</div>` : ''}
            ${g.audio_feedback ? `
              <div style="margin-top: 8px;">
                <small style="color: var(--primary); display:block; font-weight: 700; margin-bottom: 4px;">Ustozning ovozli izohi (Audio):</small>
                <audio src="${g.audio_feedback}" controls style="height: 28px;"></audio>
              </div>
            ` : ''}
          </div>
          <div class="grade-score-circle">
            <div class="grade-score-val">${parseFloat(g.score)}</div>
            <div class="grade-score-max">ball</div>
          </div>
        `;
        studentGradesList.appendChild(card);
      });
    }
  } catch (e) {
    studentGradesList.innerHTML = `<p style="color: var(--danger)">Xatolik yuz berdi.</p>`;
  }
}

// Fetch Group Leaderboard
async function fetchStudentGroupLeaderboard(groupId, studentId) {
  studentGroupLeaderboard.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Reyting yuklanmoqda...</p></div>`;
  try {
    const res = await fetch(`${API_BASE}/grades/ratings/?group_id=${groupId}`);
    if (!res.ok) throw new Error("Reyting yuklashda xatolik");
    const ratings = await res.json();

    studentGroupLeaderboard.innerHTML = '';
    ratings.forEach(item => {
      const el = document.createElement('div');
      el.className = 'leaderboard-item';
      if (item.student_id === studentId) {
        el.classList.add('highlighted');
      }
      
      let rankClass = '';
      if (item.rank === 1) rankClass = 'rank-1';
      else if (item.rank === 2) rankClass = 'rank-2';
      else if (item.rank === 3) rankClass = 'rank-3';

      el.innerHTML = `
        <div class="leaderboard-left">
          <div class="rank-badge ${rankClass}">${item.rank}</div>
          <div>
            <span class="student-name">${item.full_name} ${item.student_id === studentId ? '(Siz)' : ''}</span>
            <span class="student-username">@${item.username}</span>
          </div>
        </div>
        <div class="total-score">${item.total_score} <span>ball</span></div>
      `;
      studentGroupLeaderboard.appendChild(el);
    });
  } catch (e) {
    studentGroupLeaderboard.innerHTML = `<p style="color: var(--danger)">Reytingni yuklashda xatolik.</p>`;
  }
}

// Fetch Student Analytics
async function fetchStudentAnalytics(studentId) {
  analyticsBarsContainer.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Tahlillar yuklanmoqda...</p></div>`;
  try {
    const res = await fetch(`${API_BASE}/grades/analytics/?student=${studentId}`);
    if (!res.ok) throw new Error("Analytics yuklashda xatolik");
    const data = await res.json();

    analyticsBarsContainer.innerHTML = '';
    const skills = [
      { key: 'speaking', label: 'Speaking (Gapirish)' },
      { key: 'listening', label: 'Listening (Eshitish)' },
      { key: 'reading', label: 'Reading (O\'qish)' },
      { key: 'writing', label: 'Writing (Yozish)' },
      { key: 'grammar', label: 'Grammar (Grammatika)' }
    ];

    skills.forEach(skill => {
      const pct = data[skill.key] !== undefined ? data[skill.key] : 0.0;
      const row = document.createElement('div');
      row.className = 'skills-progress-row';
      row.innerHTML = `
        <div class="skills-progress-header">
          <span class="skills-progress-label">${skill.label}</span>
          <span class="skills-progress-value">${pct}%</span>
        </div>
        <div class="skills-progress-bar-bg">
          <div class="skills-progress-bar-fill skill-fill-${skill.key}" style="width: ${pct}%"></div>
        </div>
      `;
      analyticsBarsContainer.appendChild(row);
    });
  } catch (e) {
    analyticsBarsContainer.innerHTML = `<p style="color: var(--danger)">Xatolik yuz berdi.</p>`;
  }
}

// Load pending tasks in homework select dropdown
async function loadStudentSubmissionDropdown(student) {
  submitTaskSelect.innerHTML = '<option value="" disabled selected>Yuklanmoqda...</option>';
  
  try {
    const res = await fetch(`${API_BASE}/tasks/?group=${student.group_id}`);
    if (!res.ok) throw new Error("Topshiriqlarni yuklashda xatolik");
    activeTasksList = await res.json();

    submitTaskSelect.innerHTML = '<option value="" disabled selected>Topshiriqni tanlang...</option>';
    if (activeTasksList.length === 0) {
      submitTaskSelect.innerHTML = '<option value="" disabled>Sizning guruhingizda topshiriqlar yo\'q</option>';
      return;
    }

    activeTasksList.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.title} (${t.skill_type_display})`;
      submitTaskSelect.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
    submitTaskSelect.innerHTML = '<option value="" disabled>Topshiriqlarni yuklashda xatolik</option>';
  }
}

// Fetch Group Video Lessons List
async function fetchStudentLessons(groupId) {
  studentLessonsContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Video darslar yuklanmoqda...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/lessons/?group=${groupId}`);
    if (!res.ok) throw new Error("Darslarni yuklashda xatolik");
    const lessons = await res.json();

    studentLessonsContainer.innerHTML = '';
    if (lessons.length === 0) {
      studentLessonsContainer.innerHTML = `
        <div class="empty-state">
          <p>Ushbu guruh uchun hali video darslar yuklanmagan.</p>
        </div>
      `;
      return;
    }

    lessons.forEach(l => {
      if (l.upload_status === 'uploaded' && l.youtube_video_id) {
        const card = document.createElement('div');
        card.className = 'lesson-card';
        card.innerHTML = `
          <div class="lesson-info">
            <div class="lesson-topic">${l.topic}</div>
            <div class="lesson-meta">
              <span class="meta-item">Sana: ${l.date}</span>
              ${l.start_time ? `<span class="meta-item">Vaqt: ${l.start_time.slice(0,5)} - ${l.end_time ? l.end_time.slice(0,5) : ''}</span>` : ''}
            </div>
          </div>
          <div class="lesson-action">
            <span class="status-badge uploaded">Ko'rish</span>
          </div>
        `;

        card.addEventListener('click', () => {
          openPlayer(l);
        });

        studentLessonsContainer.appendChild(card);
      }
    });

    if (studentLessonsContainer.children.length === 0) {
      studentLessonsContainer.innerHTML = `
        <div class="empty-state">
          <p>Hozircha ko'rishga tayyor video darslar mavjud emas.</p>
        </div>
      `;
    }
  } catch (err) {
    console.error(err);
    studentLessonsContainer.innerHTML = `<p style="color: var(--danger)">Xatolik yuz berdi.</p>`;
  }
}

// Student selects a task to submit homework
submitTaskSelect.addEventListener('change', () => {
  const taskId = parseInt(submitTaskSelect.value);
  const task = activeTasksList.find(t => t.id === taskId);
  if (!task) return;

  // Show brief details
  taskBriefArea.style.display = 'flex';
  briefSkill.textContent = task.skill_type_display;
  briefDescription.textContent = task.description ? task.description : "Topshiriq tavsifi berilmagan.";
  briefMeta.textContent = `Maksimal ball: ${task.max_score} | Topshirish turi: ${task.task_type_display}`;

  // Start countdown timer
  startTaskCountdown(task.due_date);

  // Reset audio states & quiz
  resetAudioRecordingState();
  quizQuestionsToSolve.innerHTML = '';

  // Show appropriate fields
  if (task.task_type === 'quiz') {
    quizSubmissionInputs.style.display = 'block';
    standardSubmissionInputs.style.display = 'none';
    speakingSubmissionInputs.style.display = 'none';
    renderQuizQuestionsToSolve(task.questions);
  } else if (task.skill_type === 'speaking') {
    speakingSubmissionInputs.style.display = 'block';
    standardSubmissionInputs.style.display = 'none';
    quizSubmissionInputs.style.display = 'none';
  } else {
    standardSubmissionInputs.style.display = 'block';
    speakingSubmissionInputs.style.display = 'none';
    quizSubmissionInputs.style.display = 'none';
  }

  btnSubmitSubmission.disabled = false;
});

// Dynamic Countdown timer calculation
function startTaskCountdown(dueDateStr) {
  countdownIntervals.forEach(clearInterval);
  countdownIntervals = [];

  if (!dueDateStr) {
    briefCountdown.textContent = "Muddati: Cheklanmagan";
    briefCountdown.className = "timer-badge";
    return;
  }

  const dueDate = new Date(dueDateStr).getTime();

  const updateTimer = () => {
    const now = new Date().getTime();
    const diff = dueDate - now;

    if (diff <= 0) {
      briefCountdown.textContent = "Muddati tugagan (Overdue)";
      briefCountdown.className = "timer-badge overdue";
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    let displayStr = `Qolgan vaqt: ${hours}soat ${mins}m`;
    if (hours === 0) displayStr = `Qolgan vaqt: ${mins}m ${secs}s`;

    briefCountdown.textContent = displayStr;

    if (hours === 0) {
      briefCountdown.className = "timer-badge urgent";
    } else {
      briefCountdown.className = "timer-badge";
    }
  };

  updateTimer();
  const interval = setInterval(updateTimer, 1000);
  countdownIntervals.push(interval);
}

// Render quiz questions dynamically for student view
function renderQuizQuestionsToSolve(questions) {
  quizQuestionsToSolve.innerHTML = '';
  if (!questions || questions.length === 0) {
    quizQuestionsToSolve.innerHTML = '<p style="font-size: 0.85rem; color: var(--text-muted); font-style: italic;">Ushbu test topshirig\'ida savollar topilmadi.</p>';
    return;
  }

  questions.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-question-card';
    card.innerHTML = `
      <div class="quiz-question-text">${idx+1}. ${escapeHtml(q.question_text)}</div>
      <div class="quiz-options-list">
        <label class="option-label">
          <input type="radio" name="question_${q.id}" value="A" required>
          A) ${escapeHtml(q.option_a)}
        </label>
        <label class="option-label">
          <input type="radio" name="question_${q.id}" value="B">
          B) ${escapeHtml(q.option_b)}
        </label>
        <label class="option-label">
          <input type="radio" name="question_${q.id}" value="C">
          C) ${escapeHtml(q.option_c)}
        </label>
        <label class="option-label">
          <input type="radio" name="question_${q.id}" value="D">
          D) ${escapeHtml(q.option_d)}
        </label>
      </div>
    `;
    quizQuestionsToSolve.appendChild(card);
  });
}

// Reset Recording widgets
function resetAudioRecordingState() {
  audioChunks = [];
  recordedAudioBlob = null;
  audioPreviewArea.style.display = 'none';
  audioPlayback.src = '';
  recorderStatus.textContent = 'Yozishni boshlash uchun bosing.';
  btnRecord.style.display = 'flex';
  btnStopRecord.style.display = 'none';
}

// Audio Recording Controllers
btnRecord.addEventListener('click', async () => {
  resetAudioRecordingState();
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Mikrofon yozish ruxsat etilmagan");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    
    mediaRecorder.addEventListener('dataavailable', (e) => {
      audioChunks.push(e.data);
    });

    mediaRecorder.addEventListener('stop', () => {
      recordedAudioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      audioPlayback.src = URL.createObjectURL(recordedAudioBlob);
      audioPreviewArea.style.display = 'flex';
      recorderStatus.textContent = 'Audio muvaffaqiyatli yozib olindi!';
      stream.getTracks().forEach(track => track.stop());
    });

    mediaRecorder.start();
    btnRecord.style.display = 'none';
    btnStopRecord.style.display = 'flex';
    
    recordDurationSeconds = 0;
    recorderStatus.textContent = `Yozilmoqda: 00:00`;
    recordTimerInterval = setInterval(() => {
      recordDurationSeconds++;
      const mins = String(Math.floor(recordDurationSeconds / 60)).padStart(2, '0');
      const secs = String(recordDurationSeconds % 60).padStart(2, '0');
      recorderStatus.textContent = `Yozilmoqda: ${mins}:${secs}`;
    }, 1000);

  } catch (err) {
    console.error(err);
    alert("Mikrofonga ruxsat berilmadi.");
  }
});

btnStopRecord.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    clearInterval(recordTimerInterval);
    btnStopRecord.style.display = 'none';
  }
});

btnResetRecord.addEventListener('click', () => {
  resetAudioRecordingState();
});

// Submit Homework Form
submissionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const studentId = parseInt(mockStudentSelect.value);
  const taskId = parseInt(submitTaskSelect.value);
  const task = activeTasksList.find(t => t.id === taskId);
  if (!studentId || !taskId || !task) return;

  btnSubmitSubmission.disabled = true;
  const initialText = btnSubmitSubmission.querySelector('span').textContent;
  btnSubmitSubmission.querySelector('span').textContent = 'Yuborilmoqda...';

  const formData = new FormData();
  formData.append('task', taskId);
  formData.append('student', studentId);

  if (task.task_type === 'quiz') {
    const answers = {};
    task.questions.forEach(q => {
      const selected = document.querySelector(`input[name="question_${q.id}"]:checked`);
      if (selected) {
        answers[q.id] = selected.value;
      }
    });
    formData.append('selected_answers', JSON.stringify(answers));
  } else if (task.skill_type === 'speaking') {
    if (!recordedAudioBlob) {
      alert("Iltimos, avval javobingizni audio qilib yozib oling!");
      btnSubmitSubmission.disabled = false;
      btnSubmitSubmission.querySelector('span').textContent = initialText;
      return;
    }
    formData.append('file_attachment', recordedAudioBlob, 'speaking_homework.webm');
  } else {
    const textResp = document.getElementById('submitTextResponse').value;
    const fileAttach = document.getElementById('submitFileAttachment').files[0];
    
    if (textResp) formData.append('text_response', textResp);
    if (fileAttach) formData.append('file_attachment', fileAttach);
  }

  try {
    const res = await fetch(`${API_BASE}/submissions/`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.non_field_errors ? err.non_field_errors[0] : "Topshirishda xatolik yuz berdi. Ehtimol bu vazifani avval topshirgandirsiz.");
    }

    alert("Vazifa muvaffaqiyatli topshirildi!");
    submissionForm.reset();
    resetAudioRecordingState();
    taskBriefArea.style.display = 'none';
    speakingSubmissionInputs.style.display = 'none';
    standardSubmissionInputs.style.display = 'none';
    quizSubmissionInputs.style.display = 'none';
    
    // Refresh student view components
    fetchStudentGrades(studentId);
    fetchStudentAnalytics(studentId);
    fetchStudentBadges(studentId);
  } catch (err) {
    alert(err.message);
  } finally {
    btnSubmitSubmission.disabled = false;
    btnSubmitSubmission.querySelector('span').textContent = initialText;
  }
});

// Player Modal Controls
function openPlayer(lesson) {
  modalTitle.textContent = lesson.topic;
  modalSubtitle.textContent = `Sana: ${lesson.date}`;
  videoModal.classList.add('open');
  initLessonPlayer(lesson.youtube_video_id);
}

function closePlayer() {
  videoModal.classList.remove('open');
  destroyLessonPlayer();
}

modalClose.addEventListener('click', closePlayer);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closePlayer();
});

// App Initialization
loadGroupsData();
