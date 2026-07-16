const API_BASE = 'http://127.0.0.1:8000/api';

// DOM Elements
const groupSelect = document.getElementById('group');
const uploadForm = document.getElementById('uploadForm');
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
const lessonsContainer = document.getElementById('lessonsContainer');
const btnRefresh = document.getElementById('btnRefresh');

const videoModal = document.getElementById('videoModal');
const modalClose = document.getElementById('modalClose');
const modalTitle = document.getElementById('modalTitle');
const modalSubtitle = document.getElementById('modalSubtitle');
const videoPlayerFrame = document.getElementById('videoPlayerFrame');

let selectedFile = null;

// Initialize Date Input to Today
document.getElementById('date').valueAsDate = new Date();

// Fetch Groups
async function fetchGroups() {
  try {
    const res = await fetch(`${API_BASE}/groups/`);
    if (!res.ok) throw new Error("Guruhlarni yuklashda xatolik");
    const groups = await res.json();
    
    groupSelect.innerHTML = '';
    if (groups.length === 0) {
      groupSelect.innerHTML = '<option value="" disabled>Eski guruhlar topilmadi. Admin panelda guruh yarating!</option>';
      return;
    }

    groups.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g.id;
      opt.textContent = `${g.name} (${g.schedule})`;
      groupSelect.appendChild(opt);
    });
  } catch (err) {
    console.error(err);
    groupSelect.innerHTML = '<option value="" disabled>Guruhlarni yuklashda xatolik yuz berdi</option>';
  }
}

// Fetch Lessons
async function fetchLessons() {
  lessonsContainer.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>Darslar ro'yxati yuklanmoqda...</p>
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
          <svg class="empty-state-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3>Darslar topilmadi</h3>
          <p>Chap tarafdagi shakldan yangi dars yaratib video yuklang.</p>
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

      // Click event for details / play video
      card.addEventListener('click', () => {
        if (l.upload_status === 'uploaded' && l.youtube_video_id) {
          openPlayer(l);
        } else if (l.upload_status === 'uploading') {
          alert("Ushbu video hozirda YouTube'ga yuklanmoqda. Iltimos, yakunlanishini kuting.");
        } else if (l.upload_status === 'failed') {
          alert("Ushbu videoni yuklash muvaffaqiyatsiz tugagan.");
        } else {
          alert("Ushbu dars uchun video yuklanmagan.");
        }
      });

      lessonsContainer.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    lessonsContainer.innerHTML = `
      <div class="empty-state">
        <p style="color: var(--danger)">Darslarni yuklashda xatolik yuz berdi. Server ishlayotganligini tekshiring.</p>
      </div>
    `;
  }
}

// Drag & Drop Handlers
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
  // Validate type
  if (!file.type.startsWith('video/')) {
    alert("Iltimos, faqat video fayl tanlang!");
    return;
  }
  // Validate size (500MB)
  if (file.size > 500 * 1024 * 1024) {
    alert("Fayl hajmi 500MB dan oshmasligi kerak!");
    return;
  }

  selectedFile = file;
  selectedFileName.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
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

// Form Submit (Lesson creation + Video upload)
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!selectedFile) {
    alert("Iltimos, avval video faylni tanlang!");
    return;
  }

  // Disable UI during upload
  btnSubmit.disabled = true;
  submitSpinner.style.display = 'block';
  progressContainer.style.display = 'block';
  progressBarFill.style.width = '0%';
  progressPercent.textContent = '0%';
  progressStatus.textContent = 'Dars yaratilmoqda...';

  try {
    // 1. Create Lesson
    const lessonData = {
      group: parseInt(groupSelect.value),
      date: document.getElementById('date').value,
      topic: document.getElementById('topic').value,
      start_time: document.getElementById('startTime').value || null,
      end_time: document.getElementById('endTime').value || null
    };

    const lessonRes = await fetch(`${API_BASE}/lessons/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lessonData)
    });

    if (!lessonRes.ok) {
      const errData = await lessonRes.json();
      throw new Error(JSON.stringify(errData) || "Dars yaratishda xatolik yuz berdi");
    }

    const createdLesson = await lessonRes.json();
    const lessonId = createdLesson.id;

    progressStatus.textContent = "Video serverga yuborilmoqda (YouTube'ga yuklash boshlanadi)...";

    // 2. Upload Video via XHR to monitor progress
    const formData = new FormData();
    formData.append('video_file', selectedFile);
    formData.append('title', lessonData.topic);
    formData.append('description', `Lesson video for ${lessonData.topic}.`);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE}/lessons/${lessonId}/upload-video/`, true);

    // Track upload progress (from browser to Django server)
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        if (percent === 100) {
          progressStatus.textContent = "Video serverga yuklandi. YouTube'ga uzatilmoqda va qayta ishlanmoqda...";
          progressBarFill.classList.add('pulse');
        }
      }
    });

    xhr.onload = function() {
      btnSubmit.disabled = false;
      submitSpinner.style.display = 'none';
      
      if (xhr.status >= 200 && xhr.status < 300) {
        const resData = JSON.parse(xhr.responseText);
        progressStatus.textContent = 'Muvaffaqiyatli yuklandi!';
        progressBarFill.style.backgroundColor = 'var(--success)';
        alert("Dars yaratildi va video YouTube'ga muvaffaqiyatli yuklandi!");
        
        // Reset Form
        uploadForm.reset();
        selectedFile = null;
        dropZone.querySelector('.drop-zone-content').style.display = 'flex';
        fileInfo.style.display = 'none';
        document.getElementById('date').valueAsDate = new Date();
        progressContainer.style.display = 'none';
        
        fetchLessons();
      } else {
        progressBarFill.style.backgroundColor = 'var(--danger)';
        let errMsg = "Yuklashda xatolik";
        try {
          const errData = JSON.parse(xhr.responseText);
          errMsg = errData.error || errMsg;
        } catch(e) {}
        progressStatus.textContent = `Xatolik: ${errMsg}`;
        alert(`Video yuklashda xatolik yuz berdi: ${errMsg}`);
      }
    };

    xhr.onerror = function() {
      btnSubmit.disabled = false;
      submitSpinner.style.display = 'none';
      progressBarFill.style.backgroundColor = 'var(--danger)';
      progressStatus.textContent = 'Tarmoq xatoligi yuz berdi.';
      alert('Tarmoq xatoligi yuz berdi.');
    };

    xhr.send(formData);

  } catch (err) {
    console.error(err);
    btnSubmit.disabled = false;
    submitSpinner.style.display = 'none';
    progressStatus.textContent = `Xatolik yuz berdi: ${err.message}`;
    alert(`Xatolik: ${err.message}`);
  }
});

// Refresh Button Action
btnRefresh.addEventListener('click', fetchLessons);

// Player Modal Actions
function openPlayer(lesson) {
  modalTitle.textContent = lesson.topic;
  modalSubtitle.textContent = `Guruh: ${lesson.group_name || lesson.group} | Sana: ${lesson.date}`;
  videoPlayerFrame.src = `https://www.youtube.com/embed/${lesson.youtube_video_id}?autoplay=1`;
  videoModal.classList.add('open');
}

function closePlayer() {
  videoModal.classList.remove('open');
  videoPlayerFrame.src = ''; // Stop video playback
}

modalClose.addEventListener('click', closePlayer);
videoModal.addEventListener('click', (e) => {
  if (e.target === videoModal) closePlayer();
});

// App Startup
fetchGroups();
fetchLessons();
