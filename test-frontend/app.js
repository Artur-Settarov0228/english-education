const API_BASE = 'http://127.0.0.1:8000/api';

// State Variables
let groupsList = [];
let selectedFile = null;
let allStudentsInGroups = []; // List of { id, username, full_name, group_id, group_name }

// Quiz Creation Memory
let tempQuizQuestions = [];

// Audio Recording State (Teacher feedback)
let teacherMediaRecorder = null;
let teacherAudioChunks = [];
let teacherRecordedAudioBlob = null;
let teacherRecordInterval = null;
let teacherRecordDuration = 0;

// DOM Elements
const groupSelectUpload = document.getElementById('groupSelectUpload');
const taskGroup = document.getElementById('taskGroup');
const gradeGroup = document.getElementById('gradeGroup');
const gradeStudent = document.getElementById('gradeStudent');
const gradeTask = document.getElementById('gradeTask');
const ratingGroupFilter = document.getElementById('ratingGroupFilter');

// Forms
const uploadForm = document.getElementById('uploadForm');
const taskForm = document.getElementById('taskForm');
const gradeForm = document.getElementById('gradeForm');

// File Upload Area (Lessons Video)
const videoFileInput = document.getElementById('videoFile');
const dropZone = document.getElementById('dropZone');
const fileInfo = document.getElementById('fileInfo');
const selectedFileName = document.getElementById('selectedFileName');
const btnClearFile = document.getElementById('btnClearFile');
const btnSubmit = document.getElementById('btnSubmit');
const submitSpinner = document.getElementById('submitSpinner');
const progressContainer = document.getElementById('progressContainer');
const progressStatus = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');
const progressBarFill = document.getElementById('progressBarFill');

// Quiz Creator Widgets
const taskType = document.getElementById('taskType');
const quizQuestionsCreator = document.getElementById('quizQuestionsCreator');
const btnAddQuestionToList = document.getElementById('btnAddQuestionToList');
const quizQuestionText = document.getElementById('quizQuestionText');
const optionA = document.getElementById('optionA');
const optionB = document.getElementById('optionB');
const optionC = document.getElementById('optionC');
const optionD = document.getElementById('optionD');
const correctOption = document.getElementById('correctOption');
const addedQuestionsList = document.getElementById('addedQuestionsList');

// Teacher Audio feedback controllers
const btnTeacherRecord = document.getElementById('btnTeacherRecord');
const btnTeacherStopRecord = document.getElementById('btnTeacherStopRecord');
const teacherRecorderStatus = document.getElementById('teacherRecorderStatus');
const teacherAudioPreview = document.getElementById('teacherAudioPreview');
const teacherAudioPlayback = document.getElementById('teacherAudioPlayback');
const btnTeacherResetRecord = document.getElementById('btnTeacherResetRecord');

// Lists & Containers
const btnRefresh = document.getElementById('btnRefresh');
const lessonsContainer = document.getElementById('lessonsContainer');
const leaderboardList = document.getElementById('leaderboardList');
const submissionsContainer = document.getElementById('submissionsContainer');

// Modal Elements
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const videoPlayerFrame = document.getElementById('videoPlayerFrame');

// Initialize Date Input to Today
document.getElementById('date').valueAsDate = new Date();

// Switch Tasks View (Show/Hide Quiz builder)
taskType.addEventListener('change', () => {
  if (taskType.value === 'quiz') {
    quizQuestionsCreator.style.display = 'block';
    tempQuizQuestions = [];
    renderTempQuizQuestionsList();
  } else {
    quizQuestionsCreator.style.display = 'none';
  }
});

// Temp Add Quiz Question in memory
btnAddQuestionToList.addEventListener('click', () => {
  const text = quizQuestionText.value.trim();
  const aVal = optionA.value.trim();
  const bVal = optionB.value.trim();
  const cVal = optionC.value.trim();
  const dVal = optionD.value.trim();
  const correct = correctOption.value;

  if (!text || !aVal || !bVal || !cVal || !dVal) {
    alert("Iltimos, test savoli va barcha variantlarni to'ldiring!");
    return;
  }

  tempQuizQuestions.push({
    question_text: text,
    option_a: aVal,
    option_b: bVal,
    option_c: cVal,
    option_d: dVal,
    correct_option: correct
  });

  // Reset question fields
  quizQuestionText.value = '';
  optionA.value = '';
  optionB.value = '';
  optionC.value = '';
  optionD.value = '';

  renderTempQuizQuestionsList();
});

function renderTempQuizQuestionsList() {
  addedQuestionsList.innerHTML = '';
  if (tempQuizQuestions.length === 0) {
    addedQuestionsList.innerHTML = '<p style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">Hozircha savollar qo\'shilmagan.</p>';
    return;
  }

  tempQuizQuestions.forEach((q, idx) => {
    const el = document.createElement('div');
    el.className = 'added-question-preview';
    el.innerHTML = `
      <strong>${idx+1}-Savol:</strong> ${escapeHtml(q.question_text)} <br>
      <small style="color: var(--primary)">To'g'ri javob: ${q.correct_option} (A: ${escapeHtml(q.option_a)}, B: ${escapeHtml(q.option_b)})</small>
    `;
    addedQuestionsList.appendChild(el);
  });
}

// Fetch Groups and Populate Dropdowns
async function loadGroupsData() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    groupsList = await res.json();

    const dropdowns = [groupSelectUpload, taskGroup, gradeGroup, ratingGroupFilter];
    dropdowns.forEach(dd => {
      dd.innerHTML = '<option value="" disabled selected>Guruhni tanlang...</option>';
      if (groupsList.length === 0) {
        dd.innerHTML = '<option value="" disabled>Guruhlar topilmadi. Admin panelda yarating.</option>';
      }
    });

    if (groupsList.length === 0) return;

    groupsList.forEach(g => {
      dropdowns.forEach(dd => {
        const opt = document.createElement('option');
        opt.value = g.id;
        opt.textContent = `${g.name} (${g.schedule})`;
        dd.appendChild(opt);
      });
    });

    // Auto-select first group for leaderboard
    ratingGroupFilter.value = groupsList[0].id;
    fetchLeaderboard(groupsList[0].id);

    // Build Student Mapping
    await buildStudentsMapping();
    
    // Load initial teacher submissions
    fetchSubmissions();
  } catch (err) {
    console.error(err);
    const dropdowns = [groupSelectUpload, taskGroup, gradeGroup, ratingGroupFilter];
    dropdowns.forEach(dd => {
      dd.innerHTML = '<option value="" disabled>Guruhlarni yuklashda xatolik</option>';
    });
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

// Fetch and Render Leaderboard (Teacher dashboard)
async function fetchLeaderboard(groupId) {
  leaderboardList.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Reyting ro'yxati yuklanmoqda...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/grades/ratings/?group_id=${groupId}`);
    if (!res.ok) throw new Error("Reytinglarni yuklashda xatolik");
    const ratings = await res.json();

    leaderboardList.innerHTML = '';
    if (ratings.length === 0) {
      leaderboardList.innerHTML = `
        <div class="empty-state">
          <p>Ushbu guruhda o'quvchilar yo'q yoki hali baholanmagan.</p>
        </div>
      `;
      return;
    }

    ratings.forEach(item => {
      const el = document.createElement('div');
      el.className = 'leaderboard-item';
      
      let rankClass = '';
      if (item.rank === 1) rankClass = 'rank-1';
      else if (item.rank === 2) rankClass = 'rank-2';
      else if (item.rank === 3) rankClass = 'rank-3';

      el.innerHTML = `
        <div class="leaderboard-left">
          <div class="rank-badge ${rankClass}">${item.rank}</div>
          <div>
            <span class="student-name">${item.full_name}</span>
            <span class="student-username">@${item.username}</span>
          </div>
        </div>
        <div class="total-score">${item.total_score} <span>ball</span></div>
      `;
      leaderboardList.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    leaderboardList.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--danger)">Reytingni yuklashda xatolik yuz berdi.</p>
      </div>
    `;
  }
}

// Fetch Student Submissions (Teacher dashboard)
async function fetchSubmissions() {
  submissionsContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Topshirilgan vazifalar yuklanmoqda...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/submissions/`);
    if (!res.ok) throw new Error("Submissions yuklashda xatolik");
    const subs = await res.json();

    submissionsContainer.innerHTML = '';
    if (subs.length === 0) {
      submissionsContainer.innerHTML = `
        <div class="empty-state">
          <p>Hozircha topshirilgan vazifalar mavjud emas.</p>
        </div>
      `;
      return;
    }

    subs.forEach(s => {
      const el = document.createElement('div');
      el.className = 'submission-item-card';
      
      const fileUrl = s.file_attachment ? s.file_attachment : null;
      let isAudio = false;
      if (fileUrl && (fileUrl.endsWith('.webm') || fileUrl.endsWith('.wav') || fileUrl.endsWith('.mp3') || fileUrl.includes('audio') || s.task_skill_type === 'speaking')) {
        isAudio = true;
      }

      el.innerHTML = `
        <div class="submission-card-header">
          <div>
            <span class="student-name" style="font-size: 0.9rem">${s.student_full_name}</span>
            <span class="student-username">Vazifa: "${s.task_title}" ${s.is_late ? '<span style="color: var(--danger); font-weight: 700;">(Kechikib topshirildi)</span>' : ''}</span>
          </div>
          <span class="status-badge ${s.status}">${s.status_display}</span>
        </div>
        ${s.text_response ? `<div class="submission-text-content">${s.text_response}</div>` : ''}
        ${fileUrl ? (isAudio ? `
          <div style="margin-top: 5px;">
            <audio src="${fileUrl}" controls></audio>
          </div>
        ` : `
          <div style="margin-top: 5px;">
            <a href="${fileUrl}" target="_blank" class="meta-item" style="color: var(--secondary); text-decoration: underline;">
              Faylni yuklab olish
            </a>
          </div>
        `) : ''}
        <div class="submission-actions">
          <span style="font-size: 0.75rem; color: var(--text-muted)">Topshirildi: ${new Date(s.created_at).toLocaleDateString()}</span>
          ${s.status === 'pending' ? `
            <button class="btn-grade-shortcut" onclick="initiateGrading(${s.student}, ${s.task}, '${escapeHtml(s.student_full_name)}')">
              Baholash
            </button>
          ` : ''}
        </div>
      `;
      submissionsContainer.appendChild(el);
    });
  } catch (err) {
    console.error(err);
    submissionsContainer.innerHTML = `<p style="color: var(--danger)">Xatolik yuz berdi.</p>`;
  }
}

// Escape Helper
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Grade Submission Shortcut
window.initiateGrading = async function(studentId, taskId, studentName) {
  try {
    const taskRes = await fetch(`${API_BASE}/tasks/${taskId}/`);
    if (taskRes.ok) {
      const task = await taskRes.json();
      gradeGroup.value = task.group;
      gradeGroup.dispatchEvent(new Event('change'));
      
      setTimeout(() => {
        gradeStudent.value = studentId;
        gradeTask.value = taskId;
        gradeForm.scrollIntoView({ behavior: 'smooth' });
        document.getElementById('gradeScore').focus();
      }, 500);
    }
  } catch (e) {
    console.error(e);
  }
};

// Fetch Lessons
async function fetchLessons() {
  lessonsContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Darslar yuklanmoqda...</p>
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/lessons/`);
    if (!res.ok) throw new Error("Darslarni yuklashda xatolik");
    const lessons = await res.json();

    lessonsContainer.innerHTML = '';
    if (lessons.length === 0) {
      lessonsContainer.innerHTML = `
        <div class="empty-state">
          <h3>Darslar topilmadi</h3>
        </div>
      `;
      return;
    }

    lessons.forEach(l => {
      const card = document.createElement('div');
      card.className = 'lesson-card';
      
      const badgeClass = l.upload_status || 'pending';
      const badgeText = l.upload_status ? l.upload_status : 'pending';

      card.innerHTML = `
        <div class="lesson-info">
          <div class="lesson-topic">${l.topic}</div>
          <div class="lesson-meta">
            <span class="meta-item">Guruh: ${l.group_name || l.group}</span>
            <span class="meta-item">Sana: ${l.date}</span>
            ${l.start_time ? `<span class="meta-item">Vaqt: ${l.start_time.slice(0,5)} - ${l.end_time ? l.end_time.slice(0,5) : ''}</span>` : ''}
          </div>
        </div>
        <div class="lesson-action">
          <span class="status-badge ${badgeClass}">${badgeText}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (l.upload_status === 'uploaded' && l.youtube_video_id) {
          openPlayer(l);
        } else {
          alert(`Ushbu dars videosi holati: ${badgeText}`);
        }
      });

      lessonsContainer.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    lessonsContainer.innerHTML = `<p style="color: var(--danger)">Xatolik yuz berdi.</p>`;
  }
}

// Dynamic Grading Dropdown Populate
gradeGroup.addEventListener('change', async () => {
  const groupId = gradeGroup.value;
  if (!groupId) return;

  // 1. Fetch group students
  gradeStudent.innerHTML = '<option value="" disabled selected>Yuklanmoqda...</option>';
  try {
    const res = await fetch(`${API_BASE}/groups/${groupId}/students/`);
    if (!res.ok) throw new Error("O'quvchilarni olishda xatolik");
    const students = await res.json();
    
    gradeStudent.innerHTML = '<option value="" disabled selected>O\'quvchini tanlang...</option>';
    if (students.length === 0) {
      gradeStudent.innerHTML = '<option value="" disabled>Guruhda o\'quvchilar yo\'q</option>';
    } else {
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = `${s.full_name} (@${s.username})`;
        gradeStudent.appendChild(opt);
      });
    }
  } catch (e) {
    console.error(e);
    gradeStudent.innerHTML = '<option value="" disabled>Yuklashda xatolik</option>';
  }

  // 2. Fetch group tasks
  gradeTask.innerHTML = '<option value="" disabled selected>Yuklanmoqda...</option>';
  try {
    const res = await fetch(`${API_BASE}/tasks/?group=${groupId}`);
    if (!res.ok) throw new Error("Topshiriqlarni olishda xatolik");
    const tasks = await res.json();

    gradeTask.innerHTML = '<option value="" disabled selected>Topshiriqni tanlang...</option>';
    if (tasks.length === 0) {
      gradeTask.innerHTML = '<option value="" disabled>Topshiriqlar yaratilmagan</option>';
    } else {
      tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = `${t.title} (${t.task_type_display})`;
        gradeTask.appendChild(opt);
      });
    }
  } catch (e) {
    console.error(e);
    gradeTask.innerHTML = '<option value="" disabled>Yuklashda xatolik</option>';
  }
});

// Submit Form: Create Task (With Quizzes)
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const isQuiz = taskType.value === 'quiz';
  
  const taskData = {
    group: parseInt(taskGroup.value),
    task_type: taskType.value,
    skill_type: document.getElementById('taskSkill').value,
    title: document.getElementById('taskTitle').value,
    max_score: parseInt(document.getElementById('taskMaxScore').value),
    due_date: document.getElementById('taskDueDate').value ? new Date(document.getElementById('taskDueDate').value).toISOString() : null
  };

  try {
    const res = await fetch(`${API_BASE}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error("Topshiriq yaratishda xatolik");
    const createdTask = await res.json();

    // If quiz, submit all quiz questions dynamically
    if (isQuiz && tempQuizQuestions.length > 0) {
      for (const q of tempQuizQuestions) {
        q.task = createdTask.id;
        await fetch(`${API_BASE}/quiz-questions/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(q)
        });
      }
    }
    
    alert("Topshiriq/Imtihon muvaffaqiyatli yaratildi!");
    taskForm.reset();
    quizQuestionsCreator.style.display = 'none';
    tempQuizQuestions = [];
    renderTempQuizQuestionsList();
  } catch (err) {
    alert(err.message);
  }
});

// Teacher Audio Recorder Controls
btnTeacherRecord.addEventListener('click', async () => {
  teacherAudioChunks = [];
  teacherRecordedAudioBlob = null;
  teacherAudioPreview.style.display = 'none';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Mikrofon yozish ruxsat etilmagan");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    teacherMediaRecorder = new MediaRecorder(stream);

    teacherMediaRecorder.addEventListener('dataavailable', (e) => {
      teacherAudioChunks.push(e.data);
    });

    teacherMediaRecorder.addEventListener('stop', () => {
      teacherRecordedAudioBlob = new Blob(teacherAudioChunks, { type: 'audio/webm' });
      teacherAudioPlayback.src = URL.createObjectURL(teacherRecordedAudioBlob);
      teacherAudioPreview.style.display = 'flex';
      teacherRecorderStatus.textContent = 'Audio yozib olindi!';
      stream.getTracks().forEach(t => t.stop());
    });

    teacherMediaRecorder.start();
    btnTeacherRecord.style.display = 'none';
    btnTeacherStopRecord.style.display = 'flex';
    teacherRecordDuration = 0;

    teacherRecordInterval = setInterval(() => {
      teacherRecordDuration++;
      const secs = String(teacherRecordDuration % 60).padStart(2, '0');
      teacherRecorderStatus.textContent = `Yozilmoqda: 00:${secs}`;
    }, 1000);
  } catch (e) {
    console.error(e);
  }
});

btnTeacherStopRecord.addEventListener('click', () => {
  if (teacherMediaRecorder && teacherMediaRecorder.state !== 'inactive') {
    teacherMediaRecorder.stop();
    clearInterval(teacherRecordInterval);
    btnTeacherStopRecord.style.display = 'none';
    btnTeacherRecord.style.display = 'flex';
  }
});

btnTeacherResetRecord.addEventListener('click', () => {
  teacherAudioChunks = [];
  teacherRecordedAudioBlob = null;
  teacherAudioPreview.style.display = 'none';
  teacherAudioPlayback.src = '';
  teacherRecorderStatus.textContent = 'Yozish uchun bosing.';
});

// Submit Form: Record Grade (with audio feedback support)
gradeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  formData.append('task', parseInt(gradeTask.value));
  formData.append('student', parseInt(gradeStudent.value));
  formData.append('score', parseFloat(document.getElementById('gradeScore').value));
  formData.append('teacher_feedback', document.getElementById('gradeFeedback').value);

  if (teacherRecordedAudioBlob) {
    formData.append('audio_feedback', teacherRecordedAudioBlob, 'feedback_voice.webm');
  }

  try {
    const res = await fetch(`${API_BASE}/grades/`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.non_field_errors ? err.non_field_errors[0] : "Baholashda xatolik yuz berdi.");
    }
    
    alert("O'quvchi muvaffaqiyatli baholandi!");
    gradeForm.reset();
    btnTeacherResetRecord.click();
    
    if (ratingGroupFilter.value === gradeGroup.value) {
      fetchLeaderboard(ratingGroupFilter.value);
    }
    fetchSubmissions();
  } catch (err) {
    alert(err.message);
  }
});

// Leaderboard Group Filter Change
ratingGroupFilter.addEventListener('change', () => {
  fetchLeaderboard(ratingGroupFilter.value);
});

// Drag & Drop Handlers (Video Upload)
dropZone.addEventListener('click', () => videoFileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length > 0) {
    handleFileSelect(e.dataTransfer.files[0]);
  }
});
videoFileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelect(e.target.files[0]);
  }
});

function handleFileSelect(file) {
  if (!file.type.startsWith('video/')) {
    alert("Iltimos, video fayl tanlang!");
    return;
  }
  selectedFile = file;
  selectedFileName.textContent = `${file.name} (${(file.size / (1024*1024)).toFixed(1)} MB)`;
  dropZone.querySelector('.drop-zone-content').style.display = 'none';
  fileInfo.style.display = 'flex';
}

btnClearFile.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedFile = null;
  videoFileInput.value = '';
  dropZone.querySelector('.drop-zone-content').style.display = 'flex';
  fileInfo.style.display = 'none';
});

// Upload Video Submit Handler
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile) {
    alert("Video faylni tanlang!");
    return;
  }

  btnSubmit.disabled = true;
  submitSpinner.style.display = 'block';
  progressContainer.style.display = 'block';
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStatus.textContent = 'Dars yaratilmoqda...';

  try {
    const lessonData = {
      group: parseInt(groupSelectUpload.value),
      date: document.getElementById('date').value,
      topic: document.getElementById('topic').value,
      start_time: document.getElementById('startTime').value || null,
      end_time: document.getElementById('endTime').value || null
    };

    const lessonRes = await fetch(`${API_BASE}/lessons/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonData)
    });

    if (!lessonRes.ok) throw new Error("Dars yaratishda xatolik yuz berdi");
    const createdLesson = await lessonRes.json();

    progressStatus.textContent = "Video serverga yuborilmoqda...";

    const formData = new FormData();
    formData.append('video_file', selectedFile);
    formData.append('title', lessonData.topic);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/lessons/${createdLesson.id}/upload-video/`, true);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        
        const loadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (e.total / (1024 * 1024)).toFixed(1);
        
        if (percent === 100) {
          progressStatus.textContent = "Server yukladi. YouTube'ga yuklash kutilmoqda...";
        } else {
          progressStatus.textContent = `Serverga yuklanmoqda: ${loadedMB} MB / ${totalMB} MB...`;
        }
      }
    });

    xhr.onload = function() {
      btnSubmit.disabled = false;
      submitSpinner.style.display = 'none';
      if (xhr.status >= 200 && xhr.status < 300) {
        alert("Dars yaratildi va video YouTube'ga muvaffaqiyatli yuklandi!");
        uploadForm.reset();
        selectedFile = null;
        dropZone.querySelector('.drop-zone-content').style.display = 'flex';
        fileInfo.style.display = 'none';
        progressContainer.style.display = 'none';
        fetchLessons();
      } else {
        alert("Video yuklashda xatolik yuz berdi.");
      }
    };
    xhr.send(formData);
  } catch (err) {
    alert(err.message);
    btnSubmit.disabled = false;
    submitSpinner.style.display = 'none';
  }
});

btnRefresh.addEventListener('click', fetchLessons);

// Player Modal Controls
function openPlayer(lesson) {
  modalTitle.textContent = lesson.topic;
  modalSubtitle.textContent = `Guruh: ${lesson.group_name || lesson.group} | Sana: ${lesson.date}`;
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
fetchLessons();
