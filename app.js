// ─── Digital Focus Station — App Logic ───────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {

  // ── Theme Toggle ──────────────────────────────────────────────────────────
  const html = document.documentElement;
  const themeToggle = document.getElementById('theme-toggle');

  const applyTheme = (dark) => {
    html.classList.toggle('dark', dark);
    html.classList.toggle('light', !dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };

  themeToggle?.addEventListener('click', () => applyTheme(!html.classList.contains('dark')));

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    applyTheme(true);
  }

  // ── Greeting ──────────────────────────────────────────────────────────────
  const greetingEl = document.getElementById('greeting');
  if (greetingEl) {
    const h = new Date().getHours();
    const period = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
    greetingEl.textContent = `${period}, Serena`;
  }

  // ── Pomodoro Timer ────────────────────────────────────────────────────────
  const POMODORO_MODES = {
    focus:  { label: 'Focus',       duration: 25 * 60, unit: 'focus session' },
    short:  { label: 'Short Break', duration:  5 * 60, unit: 'short break' },
    long:   { label: 'Long Break',  duration: 15 * 60, unit: 'long break' },
  };

  let pomodoroMode = 'focus';
  let pomodoroRemaining = POMODORO_MODES.focus.duration;
  let pomodoroRunning = false;
  let pomodoroInterval = null;

  const RING_CIRCUMFERENCE = 2 * Math.PI * 56; // r=56

  const pomDisplay   = document.getElementById('pomodoro-display');
  const pomLabel     = document.getElementById('pomodoro-label');
  const pomPlayBtn   = document.getElementById('pomodoro-play-btn');
  const pomPlayIcon  = document.getElementById('pomodoro-play-icon');
  const pomResetBtn  = document.getElementById('pomodoro-reset-btn');
  const pomRing      = document.getElementById('pomodoro-ring');
  const pomFocusBtn  = document.getElementById('pomodoro-focus-btn');
  const pomShortBtn  = document.getElementById('pomodoro-short-btn');
  const pomLongBtn   = document.getElementById('pomodoro-long-btn');

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const updateRing = () => {
    if (!pomRing) return;
    const total = POMODORO_MODES[pomodoroMode].duration;
    const progress = pomodoroRemaining / total;
    pomRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - progress);
  };

  const renderPomodoro = () => {
    if (pomDisplay) pomDisplay.textContent = formatTime(pomodoroRemaining);
    if (pomLabel) pomLabel.textContent = pomodoroRunning ? 'running' : 'minutes left';
    if (pomPlayIcon) pomPlayIcon.textContent = pomodoroRunning ? 'pause' : 'play_arrow';
    updateRing();
  };

  const setMode = (mode) => {
    pomodoroMode = mode;
    pomodoroRunning = false;
    clearInterval(pomodoroInterval);
    pomodoroRemaining = POMODORO_MODES[mode].duration;
    // Update button styles
    [pomFocusBtn, pomShortBtn, pomLongBtn].forEach((btn, i) => {
      const active = ['focus','short','long'][i] === mode;
      btn?.classList.toggle('bg-primary', active);
      btn?.classList.toggle('text-on-primary', active);
      btn?.classList.toggle('bg-surface-container-high', !active);
      btn?.classList.toggle('text-on-surface-variant', !active);
    });
    renderPomodoro();
  };

  const tickPomodoro = () => {
    pomodoroRemaining--;
    renderPomodoro();
    if (pomodoroRemaining <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroRunning = false;
      renderPomodoro();
      const modeInfo = POMODORO_MODES[pomodoroMode];
      notify(`${modeInfo.label} complete!`, `Your ${modeInfo.unit} is done.`);
    }
  };

  const togglePomodoro = () => {
    pomodoroRunning = !pomodoroRunning;
    if (pomodoroRunning) {
      pomodoroInterval = setInterval(tickPomodoro, 1000);
    } else {
      clearInterval(pomodoroInterval);
    }
    renderPomodoro();
  };

  pomFocusBtn?.addEventListener('click', () => setMode('focus'));
  pomShortBtn?.addEventListener('click', () => setMode('short'));
  pomLongBtn?.addEventListener('click',  () => setMode('long'));
  pomPlayBtn?.addEventListener('click',  togglePomodoro);
  pomResetBtn?.addEventListener('click', () => setMode(pomodoroMode));

  setMode('focus');

  // ── 20-20-20 Eye Rest Timer ───────────────────────────────────────────────
  const EYE_INTERVAL = 20 * 60; // 20 minutes
  const EYE_REST_DUR = 20;      // 20 seconds

  let eyeRemaining = EYE_INTERVAL;
  let eyeResting = false;
  let eyeRestLeft = EYE_REST_DUR;
  let eyeInterval = null;

  const eyeDisplay  = document.getElementById('eye-rest-display');
  const eyeDoneBtn  = document.getElementById('eye-rest-done-btn');
  const eyeSubtitle = document.getElementById('eye-rest-subtitle');
  const eyeSection  = document.getElementById('eye-rest-section');

  const renderEye = () => {
    if (!eyeDisplay) return;
    if (eyeResting) {
      eyeDisplay.textContent = formatTime(eyeRestLeft);
      if (eyeSubtitle) eyeSubtitle.textContent = 'Look 20 ft away — rest your eyes';
      eyeSection?.classList.add('ring-2', 'ring-secondary');
    } else {
      eyeDisplay.textContent = formatTime(eyeRemaining);
      if (eyeSubtitle) eyeSubtitle.textContent = 'Next break in';
      eyeSection?.classList.remove('ring-2', 'ring-secondary');
    }
  };

  const startEyeRest = () => {
    eyeResting = true;
    eyeRestLeft = EYE_REST_DUR;
    notify('Eye Rest Time!', 'Look 20 feet away for 20 seconds.');
    renderEye();
  };

  const tickEye = () => {
    if (eyeResting) {
      eyeRestLeft--;
      if (eyeRestLeft <= 0) {
        eyeResting = false;
        eyeRemaining = EYE_INTERVAL;
      }
    } else {
      eyeRemaining--;
      if (eyeRemaining <= 0) startEyeRest();
    }
    renderEye();
  };

  eyeInterval = setInterval(tickEye, 1000);
  renderEye();

  eyeDoneBtn?.addEventListener('click', () => {
    eyeResting = false;
    eyeRemaining = EYE_INTERVAL;
    renderEye();
  });

  // ── Posture / Stretch Timer ───────────────────────────────────────────────
  const POSTURE_INTERVAL = 45 * 60;
  let postureRemaining = POSTURE_INTERVAL;
  let postureInterval = null;

  const postureDisplay = document.getElementById('posture-display');
  const postureResetBtn = document.getElementById('posture-reset-btn');

  const renderPosture = () => {
    if (postureDisplay) postureDisplay.textContent = formatTime(postureRemaining);
  };

  const tickPosture = () => {
    postureRemaining--;
    renderPosture();
    if (postureRemaining <= 0) {
      notify('Stretch Time!', 'Stand up and stretch for a minute.');
      postureRemaining = POSTURE_INTERVAL;
    }
  };

  postureInterval = setInterval(tickPosture, 1000);
  renderPosture();

  postureResetBtn?.addEventListener('click', () => {
    postureRemaining = POSTURE_INTERVAL;
    renderPosture();
  });

  // ── Hydration Tracker ─────────────────────────────────────────────────────
  const HYDRATION_GOAL = 8;
  let hydrationCount = parseInt(localStorage.getItem('hydration-count') || '0');
  let hydrationDate = localStorage.getItem('hydration-date') || '';

  const today = new Date().toDateString();
  if (hydrationDate !== today) {
    hydrationCount = 0;
    hydrationDate = today;
    localStorage.setItem('hydration-date', today);
    localStorage.setItem('hydration-count', '0');
  }

  const hydrationLabel = document.getElementById('hydration-count');
  const hydrationAddBtn = document.getElementById('hydration-add-btn');
  const hydrationBars   = document.getElementById('hydration-bars');

  const renderHydration = () => {
    if (hydrationLabel) hydrationLabel.textContent = `${hydrationCount} of ${HYDRATION_GOAL} glasses`;
    if (hydrationBars) {
      hydrationBars.querySelectorAll('[data-bar]').forEach((bar, i) => {
        const filled = i < hydrationCount;
        bar.classList.toggle('bg-primary', filled);
        bar.classList.toggle('bg-surface-container-high', !filled);
        bar.classList.toggle('dark:bg-surface-container', !filled);
      });
    }
  };

  hydrationAddBtn?.addEventListener('click', () => {
    if (hydrationCount < HYDRATION_GOAL) {
      hydrationCount++;
      localStorage.setItem('hydration-count', String(hydrationCount));
      renderHydration();
      if (hydrationCount === HYDRATION_GOAL) {
        notify('Hydration Goal Reached!', 'You\'ve had all 8 glasses today. Great job!');
      }
    }
  });

  // Hydration reminder every 30 min
  setInterval(() => {
    if (hydrationCount < HYDRATION_GOAL) {
      notify('Hydration Reminder', `Drink some water! You've had ${hydrationCount} of ${HYDRATION_GOAL} glasses.`);
    }
  }, 30 * 60 * 1000);

  renderHydration();

  // ── Notifications ─────────────────────────────────────────────────────────
  function notify(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
    // In-app toast fallback
    showToast(title, body);
  }

  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  function showToast(title, body) {
    const toast = document.createElement('div');
    toast.className = [
      'fixed bottom-6 right-6 z-50 bg-inverse-surface text-inverse-on-surface',
      'rounded-2xl px-5 py-4 shadow-xl flex items-start gap-3 max-w-xs',
      'animate-fade-in transition-all',
    ].join(' ');
    toast.innerHTML = `
      <span class="material-symbols-outlined mt-0.5 shrink-0">notifications</span>
      <div>
        <p class="font-semibold text-sm">${title}</p>
        <p class="text-sm opacity-80">${body}</p>
      </div>`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 4000);
  }

  // ── Music Player (YouTube IFrame API) ─────────────────────────────────────
  const TRACKS = [
    { id: 'q76bMs-NwRk', title: 'Deep Forest Rain',   sub: 'Ambient Soundscape',  category: 'ambient' },
    { id: 'nMfPqeZjc2c', title: 'White Noise',         sub: 'Focus Aid',           category: 'white-noise' },
    { id: 'jfKfPfyJRdk', title: 'Lofi Hip Hop Radio',  sub: 'Beats to Study/Relax',category: 'lofi' },
    { id: '77ZozI0rw7w', title: 'Zen Garden',          sub: 'Ambient Meditation',  category: 'zen' },
    { id: 'YHKL-xSi4Kw', title: 'Ocean Waves',         sub: 'Nature Sounds',       category: 'ocean' },
  ];

  let currentTrack = 0;
  let ytPlayer = null;
  let ytReady = false;
  let musicPlaying = false;

  const musicThumb    = document.getElementById('music-thumb');
  const musicTitle    = document.getElementById('music-title');
  const musicSubtitle = document.getElementById('music-subtitle');
  const musicPlayBtn  = document.getElementById('music-play-btn');
  const musicPlayIcon = document.getElementById('music-play-icon');
  const musicPrevBtn  = document.getElementById('music-prev-btn');
  const musicNextBtn  = document.getElementById('music-next-btn');
  const musicVolume   = document.getElementById('music-volume');
  const catButtons    = document.querySelectorAll('[data-category]');

  const updateMusicUI = () => {
    const t = TRACKS[currentTrack];
    if (musicTitle) musicTitle.textContent = t.title;
    if (musicSubtitle) musicSubtitle.textContent = t.sub;
    if (musicThumb) musicThumb.src = `https://img.youtube.com/vi/${t.id}/maxresdefault.jpg`;
    if (musicPlayIcon) musicPlayIcon.textContent = musicPlaying ? 'pause' : 'play_arrow';

    catButtons.forEach(btn => {
      const active = btn.dataset.category === t.category;
      btn.classList.toggle('border-primary', active);
      btn.classList.toggle('bg-primary/10', active);
    });
  };

  const loadTrack = (index, autoplay = false) => {
    currentTrack = (index + TRACKS.length) % TRACKS.length;
    const t = TRACKS[currentTrack];
    updateMusicUI();
    if (ytReady && ytPlayer) {
      if (autoplay || musicPlaying) {
        ytPlayer.loadVideoById(t.id);
        musicPlaying = true;
      } else {
        ytPlayer.cueVideoById(t.id);
      }
    }
  };

  const toggleMusic = () => {
    if (!ytReady) return;
    musicPlaying = !musicPlaying;
    if (musicPlaying) {
      if (ytPlayer.getPlayerState() !== 1) {
        ytPlayer.playVideo();
      }
    } else {
      ytPlayer.pauseVideo();
    }
    if (musicPlayIcon) musicPlayIcon.textContent = musicPlaying ? 'pause' : 'play_arrow';
  };

  musicPlayBtn?.addEventListener('click', toggleMusic);
  musicPrevBtn?.addEventListener('click', () => loadTrack(currentTrack - 1, musicPlaying));
  musicNextBtn?.addEventListener('click', () => loadTrack(currentTrack + 1, musicPlaying));

  musicVolume?.addEventListener('input', () => {
    if (ytReady && ytPlayer) ytPlayer.setVolume(parseInt(musicVolume.value));
  });

  catButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = TRACKS.findIndex(t => t.category === btn.dataset.category);
      if (idx !== -1) loadTrack(idx, true);
    });
  });

  // Load YouTube IFrame API
  const ytScript = document.createElement('script');
  ytScript.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(ytScript);

  window.onYouTubeIframeAPIReady = () => {
    ytPlayer = new YT.Player('yt-player', {
      height: '1',
      width: '1',
      videoId: TRACKS[0].id,
      playerVars: { autoplay: 0, controls: 0, origin: location.origin },
      events: {
        onReady: (e) => {
          ytReady = true;
          e.target.setVolume(parseInt(musicVolume?.value || 65));
          updateMusicUI();
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            loadTrack(currentTrack + 1, true);
          }
        },
      },
    });
  };

  updateMusicUI();
});
