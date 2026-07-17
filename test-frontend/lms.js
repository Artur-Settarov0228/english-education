const API_BASE = 'http://127.0.0.1:8000/api';

// State Variables
let groupsList = [];
let selectedFile = null;
let allStudentsInGroups = [];
let tempQuizQuestions = [];

// Audio Recording (Teacher feedback)
let teacherMediaRecorder = null;
let teacherAudioChunks = [];
let teacherRecordedAudioBlob = null;
let teacherRecordInterval = null;
let teacherRecordDuration = 0;

// Audio Recording (Student submission)
let studentMediaRecorder = null;
let studentAudioChunks = [];
let studentRecordedAudioBlob = null;
let studentRecordInterval = null;
let studentRecordDuration = 0;

// Current Active Student
let activeStudentId = null;
let studentTasks = [];
let activeTask = null;

// DOM Elements - Teacher Side
const groupSelectUpload = document.getElementById('groupSelectUpload');
const taskGroup = document.getElementById('taskGroup');
const gradeGroup = document.getElementById('gradeGroup');
const gradeStudent = document.getElementById('gradeStudent');
const gradeTask = document.getElementById('gradeTask');

// Forms - Teacher Side
const uploadForm = document.getElementById('uploadForm');
const taskForm = document.getElementById('taskForm');
const gradeForm = document.getElementById('gradeForm');

// File Upload
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

// Teacher Audio feedback
const btnTeacherRecord = document.getElementById('btnTeacherRecord');
const btnTeacherStopRecord = document.getElementById('btnTeacherStopRecord');
const teacherRecorderStatus = document.getElementById('teacherRecorderStatus');
const teacherAudioPreview = document.getElementById('teacherAudioPreview');
const teacherAudioPlayback = document.getElementById('teacherAudioPlayback');
const btnTeacherResetRecord = document.getElementById('btnTeacherResetRecord');
const submissionsContainer = document.getElementById('submissionsContainer');

// DOM Elements - Student Side
const mockStudentSelect = document.getElementById('mockStudentSelect');
const submitTaskSelect = document.getElementById('submitTaskSelect');
const submissionForm = document.getElementById('submissionForm');
const taskBriefArea = document.getElementById('taskBriefArea');
const briefSkill = document.getElementById('briefSkill');
const briefCountdown = document.getElementById('briefCountdown');
const briefDescription = document.getElementById('briefDescription');
const briefMeta = document.getElementById('briefMeta');

const standardSubmissionInputs = document.getElementById('standardSubmissionInputs');
const submitTextResponse = document.getElementById('submitTextResponse');
const submitFileAttachment = document.getElementById('submitFileAttachment');

const speakingSubmissionInputs = document.getElementById('speakingSubmissionInputs');
const btnRecord = document.getElementById('btnRecord');
const btnStopRecord = document.getElementById('btnStopRecord');
const recorderStatus = document.getElementById('recorderStatus');
const audioPreviewArea = document.getElementById('audioPreviewArea');
const audioPlayback = document.getElementById('audioPlayback');
const btnResetRecord = document.getElementById('btnResetRecord');

const quizSubmissionInputs = document.getElementById('quizSubmissionInputs');
const quizQuestionsToSolve = document.getElementById('quizQuestionsToSolve');
const btnSubmitSubmission = document.getElementById('btnSubmitSubmission');
const studentGradesList = document.getElementById('studentGradesList');

// Modals
const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const videoPlayerFrame = document.getElementById('videoPlayerFrame');

// Initialize Today's Date
if (document.getElementById('date')) {
  document.getElementById('date').valueAsDate = new Date();
}

// Toggle quiz builder visibility
if (taskType) {
  taskType.addEventListener('change', () => {
    if (taskType.value === 'quiz') {
      quizQuestionsCreator.style.display = 'block';
      tempQuizQuestions = [];
      renderTempQuizQuestions();
    } else {
      quizQuestionsCreator.style.display = 'none';
    }
  });
}

// Add temp quiz questions in memory
if (btnAddQuestionToList) {
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

    quizQuestionText.value = '';
    optionA.value = '';
    optionB.value = '';
    optionC.value = '';
    optionD.value = '';
    renderTempQuizQuestions();
  });
}

function renderTempQuizQuestions() {
  addedQuestionsList.innerHTML = '';
  if (tempQuizQuestions.length === 0) {
    addedQuestionsList.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Hozircha savollar qo\'shilmagan.</p>';
    return;
  }
  tempQuizQuestions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.style.fontSize = '0.78rem';
    div.style.marginBottom = '6px';
    div.innerHTML = `<strong>${idx+1}:</strong> ${escapeHtml(q.question_text)} <small style="color:var(--crm-primary)">(To'g'ri: ${q.correct_option})</small>`;
    addedQuestionsList.appendChild(div);
  });
}

// Fetch groups and load drop-downs
async function loadGroupsData() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) throw new Error();
    groupsList = await res.json();

    const ddList = [groupSelectUpload, taskGroup, gradeGroup];
    ddList.forEach(dd => {
      if (dd) {
        dd.innerHTML = '<option value="" disabled selected>Guruhni tanlang...</option>';
        groupsList.forEach(g => {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = g.name;
          dd.appendChild(opt);
        });
      }
    });

    // Populate mock students list
    await fetchMockStudents();
    fetchSubmissions();
  } catch (e) {
    console.error(e);
  }
}

// Populate grade students on grade group change
if (gradeGroup) {
  gradeGroup.addEventListener('change', async () => {
    const groupId = gradeGroup.value;
    if (!groupId) return;

    gradeStudent.innerHTML = '<option value="" disabled selected>Yuklanmoqda...</option>';
    try {
      const res = await fetch(`${API_BASE}/groups/${groupId}/students/`);
      const students = await res.json();
      gradeStudent.innerHTML = '<option value="" disabled selected>O\'quvchi tanlang...</option>';
      students.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.full_name;
        gradeStudent.appendChild(opt);
      });
    } catch (err) {
      gradeStudent.innerHTML = '<option value="" disabled>Yuklashda xatolik</option>';
    }

    gradeTask.innerHTML = '<option value="" disabled selected>Yuklanmoqda...</option>';
    try {
      const res = await fetch(`${API_BASE}/tasks/?group=${groupId}`);
      const tasks = await res.json();
      gradeTask.innerHTML = '<option value="" disabled selected>Topshiriq tanlang...</option>';
      tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.title;
        gradeTask.appendChild(opt);
      });
    } catch (err) {
      gradeTask.innerHTML = '<option value="" disabled>Yuklashda xatolik</option>';
    }
  });
}

// Fetch submissions for teacher list
async function fetchSubmissions() {
  if (!submissionsContainer) return;
  submissionsContainer.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Yuklanmoqda...</p>';
  try {
    const res = await fetch(`${API_BASE}/submissions/`);
    const subs = await res.json();
    submissionsContainer.innerHTML = '';
    if (subs.length === 0) {
      submissionsContainer.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Topshirilgan vazifalar yo\'q.</p>';
      return;
    }
    subs.forEach(s => {
      const card = document.createElement('div');
      card.style.border = '1px solid var(--crm-border)';
      card.style.borderRadius = '8px';
      card.style.padding = '12px';
      
      const fileUrl = s.file_attachment ? s.file_attachment : null;
      let isAudio = false;
      if (fileUrl && (fileUrl.endsWith('.webm') || fileUrl.endsWith('.wav') || fileUrl.includes('audio') || s.task_skill_type === 'speaking')) {
        isAudio = true;
      }

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <strong>${s.student_full_name}</strong>
          <span class="crm-badge primary">${s.status_display}</span>
        </div>
        <div style="background:#f8fafc; padding:8px; border-radius:6px; font-size:0.8rem; margin-bottom:8px;">
          Mavzu: "${s.task_title}"
        </div>
        ${s.text_response ? `<p style="font-size:0.8rem; margin-bottom:8px;">${s.text_response}</p>` : ''}
        ${fileUrl ? (isAudio ? `<audio src="${fileUrl}" controls style="width:100%; height:32px;"></audio>` : `<a href="${fileUrl}" target="_blank" style="font-size:0.75rem; color:var(--crm-primary); text-decoration:underline;">Faylni yuklab olish</a>`) : ''}
        <div style="margin-top:10px;">
          ${s.status === 'pending' ? `<button class="crm-btn crm-btn-primary" style="font-size:0.72rem; padding:4px 8px;" onclick="initiateGrading(${s.student}, ${s.task}, ${s.group_id || ''})">Baholash</button>` : ''}
        </div>
      `;
      submissionsContainer.appendChild(card);
    });
  } catch (e) {
    submissionsContainer.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-danger);">Yuklashda xatolik yuz berdi.</p>';
  }
}

window.initiateGrading = function(studentId, taskId, groupId) {
  if (groupId) {
    gradeGroup.value = groupId;
    gradeGroup.dispatchEvent(new Event('change'));
  }
  setTimeout(() => {
    gradeStudent.value = studentId;
    gradeTask.value = taskId;
    gradeForm.scrollIntoView({ behavior: 'smooth' });
  }, 400);
};

// Teacher Audio feedback
btnTeacherRecord.addEventListener('click', async () => {
  teacherAudioChunks = [];
  teacherRecordedAudioBlob = null;
  teacherAudioPreview.style.display = 'none';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Mikrofonga ruxsat berilmagan!");
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
    btnTeacherStopRecord.style.display = 'inline-block';
    teacherRecordDuration = 0;
    teacherRecordInterval = setInterval(() => {
      teacherRecordDuration++;
      teacherRecorderStatus.textContent = `Yozilmoqda: ${teacherRecordDuration}s`;
    }, 1000);
  } catch (err) {
    console.error(err);
  }
});

btnTeacherStopRecord.addEventListener('click', () => {
  if (teacherMediaRecorder && teacherMediaRecorder.state !== 'inactive') {
    teacherMediaRecorder.stop();
    clearInterval(teacherRecordInterval);
    btnTeacherStopRecord.style.display = 'none';
    btnTeacherRecord.style.display = 'inline-block';
  }
});

btnTeacherResetRecord.addEventListener('click', () => {
  teacherAudioChunks = [];
  teacherRecordedAudioBlob = null;
  teacherAudioPreview.style.display = 'none';
  teacherAudioPlayback.src = '';
  teacherRecorderStatus.textContent = 'Yozish uchun bosing.';
});

// Teacher Save Grade
gradeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData();
  formData.append('student', parseInt(gradeStudent.value));
  formData.append('task', parseInt(gradeTask.value));
  formData.append('score', parseFloat(gradeScore.value));
  formData.append('teacher_feedback', document.getElementById('gradeFeedback').value);

  if (teacherRecordedAudioBlob) {
    formData.append('audio_feedback', teacherRecordedAudioBlob, 'voice_feedback.webm');
  }

  try {
    const res = await fetch(`${API_BASE}/grades/`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error("Baholashda xatolik yuz berdi.");
    alert("O'quvchi muvaffaqiyatli baholandi!");
    gradeForm.reset();
    btnTeacherResetRecord.click();
    fetchSubmissions();
  } catch (err) {
    alert(err.message);
  }
});

// Drag & drop file logic for video uploads
dropZone.addEventListener('click', () => videoFileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--crm-primary)';
});
dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = 'var(--crm-border)';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--crm-border)';
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
  selectedFile = file;
  selectedFileName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
  dropZone.querySelector('.drop-zone-content').style.display = 'none';
  fileInfo.style.display = 'flex';
}

btnClearFile.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedFile = null;
  videoFileInput.value = '';
  dropZone.querySelector('.drop-zone-content').style.display = 'block';
  fileInfo.style.display = 'none';
});

// Upload Video Lesson Form Submit
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile) {
    alert("Iltimos, video faylni tanlang!");
    return;
  }

  btnSubmit.disabled = true;
  submitSpinner.style.display = 'inline-block';
  progressContainer.style.display = 'block';
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStatus.textContent = 'Dars yaratilmoqda...';

  try {
    const lessonData = {
      group: parseInt(groupSelectUpload.value),
      date: document.getElementById('date').value,
      topic: document.getElementById('topic').value,
      start_time: '17:00',
      end_time: '18:30'
    };

    const res = await fetch(`${API_BASE}/lessons/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lessonData)
    });
    if (!res.ok) throw new Error("Dars yaratib bo'lmadi");
    const lesson = await res.json();

    const formData = new FormData();
    formData.append('video_file', selectedFile);
    formData.append('title', lesson.topic);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/lessons/${lesson.id}/upload-video/`, true);

    xhr.upload.addEventListener('progress', (ev) => {
      if (ev.lengthComputable) {
        const percent = Math.round((ev.loaded / ev.total) * 100);
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        const loadedMB = (ev.loaded / (1024 * 1024)).toFixed(1);
        const totalMB = (ev.total / (1024 * 1024)).toFixed(1);
        progressStatus.textContent = `Serverga yuklanmoqda: ${loadedMB} MB / ${totalMB} MB...`;
      }
    });

    xhr.onload = function() {
      btnSubmit.disabled = false;
      submitSpinner.style.display = 'none';
      if (xhr.status >= 200 && xhr.status < 300) {
        alert("Video muvaffaqiyatli yuklandi va YouTube'da qayta ishlanmoqda!");
        uploadForm.reset();
        selectedFile = null;
        dropZone.querySelector('.drop-zone-content').style.display = 'block';
        fileInfo.style.display = 'none';
        progressContainer.style.display = 'none';
      } else {
        alert("Video yuklashda xatolik.");
      }
    };
    xhr.send(formData);
  } catch (err) {
    alert(err.message);
    btnSubmit.disabled = false;
    submitSpinner.style.display = 'none';
  }
});

// Task creation with quiz support
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const isQuiz = taskType.value === 'quiz';
  const taskData = {
    group: parseInt(taskGroup.value),
    task_type: taskType.value,
    skill_type: taskSkill.value,
    title: taskTitle.value,
    max_score: parseInt(taskMaxScore.value),
    due_date: document.getElementById('taskDueDate').value ? new Date(document.getElementById('taskDueDate').value).toISOString() : null
  };

  try {
    const res = await fetch(`${API_BASE}/tasks/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    if (!res.ok) throw new Error("Topshiriq yaratib bo'lmadi");
    const createdTask = await res.json();

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
    alert("Topshiriq muvaffaqiyatli saqlandi!");
    taskForm.reset();
    quizQuestionsCreator.style.display = 'none';
    tempQuizQuestions = [];
    renderTempQuizQuestions();
  } catch (err) {
    alert(err.message);
  }
});

// STUDENT SIDE LOGIC
async function fetchMockStudents() {
  try {
    const res = await fetch(`${API_BASE}/users/?role=student`);
    const students = await res.json();
    mockStudentSelect.innerHTML = '<option value="" disabled selected>O\'quvchini tanlang...</option>';
    students.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `${s.first_name} ${s.last_name} (@${s.username})`;
      mockStudentSelect.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }
}

// Student Login selection change
mockStudentSelect.addEventListener('change', () => {
  activeStudentId = mockStudentSelect.value;
  loadStudentLmsInfo();
});

async function loadStudentLmsInfo() {
  if (!activeStudentId) return;

  // 1. Fetch Student Grades
  studentGradesList.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Yuklanmoqda...</p>';
  try {
    const res = await fetch(`${API_BASE}/grades/?student=${activeStudentId}`);
    const grades = await res.json();
    studentGradesList.innerHTML = '';
    if (grades.length === 0) {
      studentGradesList.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Baholar topilmadi.</p>';
    } else {
      grades.forEach(g => {
        studentGradesList.innerHTML += `
          <div style="border: 1px solid var(--crm-border); border-radius:10px; padding:16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
              <strong style="font-size:0.95rem;">${g.task_title}</strong>
              <span class="crm-badge success" style="font-size:0.8rem;">${parseFloat(g.score)} / ${g.task_max_score}</span>
            </div>
            ${g.teacher_feedback ? `<p style="font-size:0.82rem; color:var(--crm-text-muted); font-style:italic;">Izoh: "${g.teacher_feedback}"</p>` : ''}
            ${g.audio_feedback ? `
              <div style="border-top: 1px solid var(--crm-border); padding-top:10px; margin-top:10px;">
                <small style="font-size:0.72rem; color:var(--crm-primary); display:block; font-weight:700; margin-bottom:4px;">Ustoz izohi (Audio):</small>
                <audio src="${g.audio_feedback}" controls style="width:100%; height:32px;"></audio>
              </div>
            ` : ''}
          </div>
        `;
      });
    }
  } catch (e) {
    studentGradesList.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-danger);">Xatolik yuz berdi.</p>';
  }

  // 2. Fetch Tasks list for homework submission dropdown
  submitTaskSelect.innerHTML = '<option value="" disabled selected>Yuklanmoqda...</option>';
  try {
    const res = await fetch(`${API_BASE}/tasks/`);
    studentTasks = await res.json();
    submitTaskSelect.innerHTML = '<option value="" disabled selected>Topshiriqni tanlang...</option>';
    studentTasks.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = `${t.title} (${t.task_type_display})`;
      submitTaskSelect.appendChild(opt);
    });
  } catch (e) {
    submitTaskSelect.innerHTML = '<option value="" disabled>Xatolik yuz berdi</option>';
  }
}

// Student Task Selection Change
submitTaskSelect.addEventListener('change', () => {
  const taskId = parseInt(submitTaskSelect.value);
  activeTask = studentTasks.find(t => t.id === taskId);
  if (!activeTask) return;

  // Show Task Details card
  taskBriefArea.style.display = 'block';
  briefSkill.textContent = activeTask.skill_type_display || activeTask.skill_type;
  briefDescription.textContent = activeTask.title;
  briefMeta.textContent = `Maksimal ball: ${activeTask.max_score}`;
  briefCountdown.textContent = activeTask.due_date ? `Muddati: ${new Date(activeTask.due_date).toLocaleDateString()}` : 'Muddatsiz';

  btnSubmitSubmission.disabled = false;

  // Render proper input fields according to type
  if (activeTask.task_type === 'quiz') {
    standardSubmissionInputs.style.display = 'none';
    speakingSubmissionInputs.style.display = 'none';
    quizSubmissionInputs.style.display = 'block';
    loadQuizQuestions(activeTask.id);
  } else if (activeTask.skill_type === 'speaking') {
    standardSubmissionInputs.style.display = 'none';
    speakingSubmissionInputs.style.display = 'block';
    quizSubmissionInputs.style.display = 'none';
    resetStudentRecorder();
  } else {
    standardSubmissionInputs.style.display = 'block';
    speakingSubmissionInputs.style.display = 'none';
    quizSubmissionInputs.style.display = 'none';
  }
});

// Load quiz questions
async function loadQuizQuestions(taskId) {
  quizQuestionsToSolve.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Savollar yuklanmoqda...</p>';
  try {
    const res = await fetch(`${API_BASE}/quiz-questions/?task=${taskId}`);
    const questions = await res.json();
    quizQuestionsToSolve.innerHTML = '';
    if (questions.length === 0) {
      quizQuestionsToSolve.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-text-muted); font-style:italic;">Test savollari topilmadi.</p>';
      return;
    }
    questions.forEach((q, idx) => {
      const box = document.createElement('div');
      box.className = 'quiz-question-box';
      box.dataset.questionId = q.id;
      box.dataset.correct = q.correct_option;
      box.innerHTML = `
        <p style="font-size:0.85rem; font-weight:700; margin-bottom:8px;">${idx+1}. ${escapeHtml(q.question_text)}</p>
        <div style="display:flex; flex-direction:column; gap:6px;">
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:8px;"><input type="radio" name="q_${q.id}" value="A" required> A) ${escapeHtml(q.option_a)}</label>
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:8px;"><input type="radio" name="q_${q.id}" value="B"> B) ${escapeHtml(q.option_b)}</label>
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:8px;"><input type="radio" name="q_${q.id}" value="C"> C) ${escapeHtml(q.option_c)}</label>
          <label style="font-size:0.8rem; display:flex; align-items:center; gap:8px;"><input type="radio" name="q_${q.id}" value="D"> D) ${escapeHtml(q.option_d)}</label>
        </div>
      `;
      quizQuestionsToSolve.appendChild(box);
    });
  } catch (e) {
    quizQuestionsToSolve.innerHTML = '<p style="font-size:0.75rem; color:var(--crm-danger);">Xatolik yuz berdi</p>';
  }
}

// Student Audio Recording
btnRecord.addEventListener('click', async () => {
  studentAudioChunks = [];
  studentRecordedAudioBlob = null;
  audioPreviewArea.style.display = 'none';

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert("Mikrofon ruxsati berilmagan!");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    studentMediaRecorder = new MediaRecorder(stream);
    studentMediaRecorder.addEventListener('dataavailable', (e) => {
      studentAudioChunks.push(e.data);
    });
    studentMediaRecorder.addEventListener('stop', () => {
      studentRecordedAudioBlob = new Blob(studentAudioChunks, { type: 'audio/webm' });
      audioPlayback.src = URL.createObjectURL(studentRecordedAudioBlob);
      audioPreviewArea.style.display = 'flex';
      recorderStatus.textContent = 'Audio muvaffaqiyatli yozib olindi!';
      stream.getTracks().forEach(t => t.stop());
    });

    studentMediaRecorder.start();
    btnRecord.style.display = 'none';
    btnStopRecord.style.display = 'inline-block';
    studentRecordDuration = 0;
    studentRecordInterval = setInterval(() => {
      studentRecordDuration++;
      recorderStatus.textContent = `Yozilmoqda: ${studentRecordDuration}s`;
    }, 1000);
  } catch (e) {
    console.error(e);
  }
});

btnStopRecord.addEventListener('click', () => {
  if (studentMediaRecorder && studentMediaRecorder.state !== 'inactive') {
    studentMediaRecorder.stop();
    clearInterval(studentRecordInterval);
    btnStopRecord.style.display = 'none';
    btnRecord.style.display = 'inline-block';
  }
});

btnResetRecord.addEventListener('click', resetStudentRecorder);

function resetStudentRecorder() {
  studentAudioChunks = [];
  studentRecordedAudioBlob = null;
  audioPreviewArea.style.display = 'none';
  audioPlayback.src = '';
  recorderStatus.textContent = 'Yozish uchun tugmani bosing.';
}

// Student Submit Homework Form Handler
submissionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeStudentId || !activeTask) return;

  btnSubmitSubmission.disabled = true;

  // Handle Quiz dynamic auto-grading inside the client directly!
  if (activeTask.task_type === 'quiz') {
    const questionContainers = quizQuestionsToSolve.querySelectorAll('.quiz-question-box');
    let correctCount = 0;
    let totalCount = questionContainers.length;

    questionContainers.forEach(container => {
      const questionId = container.dataset.questionId;
      const correctAnswer = container.dataset.correct;
      const selectedRadio = container.querySelector(`input[name="q_${questionId}"]:checked`);
      if (selectedRadio && selectedRadio.value === correctAnswer) {
        correctCount++;
      }
    });

    const score = totalCount > 0 ? (correctCount / totalCount) * activeTask.max_score : 0;
    
    // Direct Grade post
    const gradeData = {
      student: parseInt(activeStudentId),
      task: activeTask.id,
      score: score,
      teacher_feedback: `Quiz auto-graded: ${correctCount}/${totalCount} to'g'ri javob.`
    };

    try {
      const res = await fetch(`${API_BASE}/grades/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gradeData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.non_field_errors ? err.non_field_errors[0] : "Baholashda xatolik");
      }
      alert(`Test yakunlandi! Natija: ${score} ball.`);
      submissionForm.reset();
      taskBriefArea.style.display = 'none';
      quizSubmissionInputs.style.display = 'none';
      loadStudentLmsInfo();
    } catch (err) {
      alert(err.message);
      btnSubmitSubmission.disabled = false;
    }
  } else {
    // Standard and Speaking submissions
    const formData = new FormData();
    formData.append('student', parseInt(activeStudentId));
    formData.append('task', activeTask.id);
    formData.append('text_response', submitTextResponse.value);

    if (activeTask.skill_type === 'speaking' && studentRecordedAudioBlob) {
      formData.append('file_attachment', studentRecordedAudioBlob, 'speaking_response.webm');
    } else if (submitFileAttachment.files.length > 0) {
      formData.append('file_attachment', submitFileAttachment.files[0]);
    }

    try {
      const res = await fetch(`${API_BASE}/submissions/`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error("Vazifani yuborishda xatolik yuz berdi");
      alert("Vazifa muvaffaqiyatli topshirildi!");
      submissionForm.reset();
      resetStudentRecorder();
      taskBriefArea.style.display = 'none';
      standardSubmissionInputs.style.display = 'none';
      speakingSubmissionInputs.style.display = 'none';
      loadStudentLmsInfo();
      fetchSubmissions();
    } catch (err) {
      alert(err.message);
      btnSubmitSubmission.disabled = false;
    }
  }
});

// Video modal closer
if (modalClose) {
  modalClose.addEventListener('click', () => {
    videoModal.classList.remove('open');
    destroyLessonPlayer();
  });
}

// Escape Html Helper
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// Initial triggers
loadGroupsData();
