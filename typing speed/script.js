class TypePrimeApp {
  constructor() {
    // Config
    this.words = {
      easy: ['the','be','to','of','and','a','in','that','have','I','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','her','say','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us'],
      medium: ['JavaScript','function','variable','development','algorithm','performance','interface','responsive','framework','component','synchronous','asynchronous','optimization','deployment','repository','authentication','middleware','validation','recursion','iteration','debugging','refactoring','architecture','paradigm','compilation','interpretation','polymorphism','encapsulation','abstraction','inheritance','concurrency','multithreading','serialization','pagination','authentication','authorization','middleware','dependency','injection','mockup','prototype'],
      hard: ['The quick brown fox jumps over the lazy dog. Programming paradigms dictate structure. Web development requires continuous learning. Asynchronous operations prevent blocking the main thread. Functional programming emphasizes immutability and pure functions. Modern frameworks abstract complex DOM manipulations.', 'Quantum entanglement challenges classical mechanics, suggesting particles remain connected across vast distances. Cryptographic protocols ensure data integrity during transmission. Microservices architecture promotes scalability by decoupling system components. Continuous integration pipelines automate testing and deployment workflows.', 'Neural networks mimic biological synapses through weighted connections. Reinforcement learning agents optimize decision paths via reward signals. Computer vision algorithms process pixel matrices into semantic representations. Natural language processing leverages transformers for contextual embeddings and sequence modeling.']
    };

    this.state = {
      time: 15,
      mode: '15',
      difficulty: 'medium',
      text: '',
      currentIndex: 0,
      totalChars: 0,
      correctChars: 0,
      mistakes: 0,
      streak: 0,
      maxStreak: 0,
      isRunning: false,
      isFinished: false,
      timerInterval: null,
      startTime: null,
      elapsedTime: 0,
      soundEnabled: true,
      theme: localStorage.getItem('theme') || 'dark',
      leaderboard: JSON.parse(localStorage.getItem('typeprime_lb') || '[]'),
      keyHeatmap: new Map()
    };

    // DOM Cache
    this.els = {
      root: document.documentElement,
      textDisplay: document.getElementById('text-display'),
      hiddenInput: document.getElementById('hidden-input'),
      liveWpm: document.getElementById('live-wpm'),
      liveAcc: document.getElementById('live-acc'),
      liveTime: document.getElementById('live-time'),
      liveStreak: document.getElementById('live-streak'),
      raceUI: document.getElementById('race-ui'),
      playerFill: document.getElementById('player-fill'),
      aiFill: document.getElementById('ai-fill'),
      modals: {
        result: document.getElementById('result-modal'),
        custom: document.getElementById('custom-modal'),
        leaderboard: document.getElementById('leaderboard-modal')
      },
      buttons: {
        restart: document.getElementById('restart-btn'),
        share: document.getElementById('share-btn'),
        heatmap: document.getElementById('heatmap-toggle-btn'),
        custom: document.getElementById('apply-custom'),
        cancelCustom: document.getElementById('cancel-custom'),
        customInputBtn: document.getElementById('custom-text-btn'),
        theme: document.getElementById('theme-toggle'),
        sound: document.getElementById('sound-toggle'),
        focus: document.getElementById('focus-toggle'),
        fullscreen: document.getElementById('fullscreen-toggle'),
        saveScore: document.getElementById('save-score-btn'),
        closeResult: document.getElementById('close-result'),
        closeLb: document.getElementById('close-lb'),
        modeBtns: document.querySelectorAll('.mode-btn'),
        diffBtns: document.querySelectorAll('.diff-btn')
      }
    };

    this.init();
  }

  init() {
    this.applyTheme(this.state.theme);
    this.renderLeaderboard();
    this.generateText();
    this.attachListeners();
    this.els.hiddenInput.focus();
    window.addEventListener('click', () => this.els.hiddenInput.focus());
  }

  generateText() {
    const isRace = this.state.mode === 'race';
    const isCustom = this.state.mode === 'custom';
    
    if (isCustom) return;
    if (isRace) {
      this.state.text = this.words.hard.join(' ') + ' ' + this.words.medium.join(' ');
    } else {
      const list = this.words[this.state.difficulty];
      this.state.text = Array(50).fill(0).map(() => list[Math.floor(Math.random() * list.length)]).join(' ');
    }
    
    this.renderTextDOM();
  }

  renderTextDOM() {
    this.els.textDisplay.innerHTML = '';
    this.state.text.split('').forEach((char, i) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.className = 'char';
      span.dataset.index = i;
      if (i === 0) span.classList.add('current');
      this.els.textDisplay.appendChild(span);
    });
    this.resetState();
  }

  resetState() {
    this.state.currentIndex = 0;
    this.state.totalChars = 0;
    this.state.correctChars = 0;
    this.state.mistakes = 0;
    this.state.streak = 0;
    this.state.isRunning = false;
    this.state.isFinished = false;
    this.state.elapsedTime = 0;
    this.state.keyHeatmap = new Map();
    
    if (this.state.timerInterval) clearInterval(this.state.timerInterval);
    this.updateUI();
    
    document.querySelectorAll('.char').forEach(el => {
      el.classList.remove('correct', 'wrong', 'current');
      if (el.dataset.index === '0') el.classList.add('current');
    });
    
    this.els.hiddenInput.value = '';
    this.els.hiddenInput.focus();
    this.els.raceUI.classList.remove('visible');
    this.els.liveTime.textContent = this.state.mode === 'custom' ? '∞' : this.state.time;
  }

  attachListeners() {
    this.els.hiddenInput.addEventListener('keydown', e => this.handleTyping(e));
    this.els.hiddenInput.addEventListener('input', e => e.preventDefault()); // Block default paste behavior, handle manually if needed
    
    this.buttons.modeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setMode(btn.dataset.mode);
      });
    });
    this.buttons.diffBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.setDifficulty(btn.dataset.diff);
      });
    });

    this.buttons.restart.addEventListener('click', () => { this.closeAllModals(); this.generateText(); });
    this.buttons.share.addEventListener('click', () => this.shareResult());
    this.buttons.heatmap.addEventListener('click', () => document.getElementById('heatmap-panel').classList.toggle('hidden'));
    this.buttons.theme.addEventListener('click', () => this.toggleTheme());
    this.buttons.sound.addEventListener('click', () => {
      this.state.soundEnabled = !this.state.soundEnabled;
      this.buttons.sound.classList.toggle('active');
      this.buttons.sound.textContent = this.state.soundEnabled ? '🔊' : '🔇';
    });
    this.buttons.focus.addEventListener('click', () => document.body.classList.toggle('focus-mode'));
    this.buttons.fullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) document.documentElement.requestFullscreen();
      else document.exitFullscreen();
    });

    this.buttons.customInputBtn.addEventListener('click', () => this.openModal('custom'));
    this.buttons.custom.addEventListener('click', () => {
      const val = document.getElementById('custom-text-input').value.trim();
      if (val) { this.state.mode = 'custom'; this.state.text = val; this.renderTextDOM(); this.setModeUI('custom'); this.closeModal('custom'); }
    });
    this.buttons.cancelCustom.addEventListener('click', () => this.closeModal('custom'));

    this.buttons.closeResult.addEventListener('click', () => this.closeModal('result'));
    this.buttons.closeLb.addEventListener('click', () => this.closeModal('leaderboard'));
    document.getElementById('leaderboard-btn').addEventListener('click', () => this.openModal('leaderboard'));
    this.buttons.saveScore.addEventListener('click', () => this.saveScore());
  }

  handleTyping(e) {
    if (this.state.isFinished) return;
    
    // Start timer on first key
    if (!this.state.isRunning) this.startTimer();

    const chars = document.querySelectorAll('.char');
    const total = this.state.text.length;

    if (e.key === 'Backspace') {
      e.preventDefault();
      if (this.state.currentIndex > 0) {
        chars[this.state.currentIndex].classList.remove('current');
        this.state.currentIndex--;
        chars[this.state.currentIndex].classList.remove('correct', 'wrong');
        chars[this.state.currentIndex].classList.add('current');
        this.playSound('backspace');
      }
      return;
    }

    if (e.key.length > 1) return; // Ignore shift, ctrl, etc.
    e.preventDefault();

    const target = this.state.text[this.state.currentIndex];
    const inputChar = e.key;

    this.trackHeatmap(inputChar.toLowerCase());

    if (inputChar === target) {
      chars[this.state.currentIndex].classList.add('correct');
      this.state.correctChars++;
      this.state.streak++;
      this.playSound('correct');
    } else {
      chars[this.state.currentIndex].classList.add('wrong');
      this.state.mistakes++;
      this.state.streak = 0;
      this.playSound('wrong');
    }

    this.state.totalChars++;
    this.state.currentIndex++;

    if (this.state.currentIndex > 0) chars[this.state.currentIndex - 1].classList.remove('current');
    if (this.state.currentIndex < total) {
      chars[this.state.currentIndex].classList.add('current');
      this.scrollToActive(chars[this.state.currentIndex]);
    } else {
      this.finishTest();
    }

    // Update Race AI
    if (this.state.mode === 'race') {
      this.updateRaceProgress();
    }
  }

  startTimer() {
    if (this.state.mode === 'custom') return;
    this.state.isRunning = true;
    this.state.startTime = performance.now();
    
    this.state.timerInterval = setInterval(() => {
      this.state.elapsedTime++;
      this.els.liveTime.textContent = this.state.time - this.state.elapsedTime;
      this.calculateMetrics();
      if (this.state.elapsedTime >= this.state.time) {
        this.finishTest();
      }
    }, 1000);
  }

  calculateMetrics() {
    if (this.state.elapsedTime === 0) return;
    const minutes = this.state.elapsedTime / 60;
    const wpm = Math.round((this.state.correctChars / 5) / minutes);
    const cpm = Math.round((this.state.correctChars) / minutes);
    const accuracy = this.state.totalChars > 0 ? Math.round((this.state.correctChars / this.state.totalChars) * 100) : 100;

    this.state.wpm = wpm || 0;
    this.state.cpm = cpm || 0;
    this.state.accuracy = accuracy;
    this.updateUI();
  }

  updateRaceProgress() {
    const playerPercent = Math.min((this.state.currentIndex / this.state.text.length) * 100, 100);
    this.els.playerFill.style.width = `${playerPercent}%`;

    // AI Simulation: ~40-65 WPM random speed
    if (!this.aiSpeed) this.aiSpeed = 30 + Math.random() * 35;
    const aiCharsPerSec = (this.aiSpeed * 5) / 60;
    const aiProgress = Math.min(((aiCharsPerSec * this.state.elapsedTime) / this.state.text.length) * 100, 100);
    this.els.aiFill.style.width = `${aiProgress}%`;

    if (aiProgress >= playerPercent && this.state.currentIndex >= this.state.text.length * 0.95) {
      this.finishTest(); // AI wins
    }
  }

  finishTest() {
    if (this.state.isFinished) return;
    this.state.isFinished = true;
    clearInterval(this.state.timerInterval);
    this.calculateMetrics();
    
    document.getElementById('res-wpm').textContent = this.state.wpm;
    document.getElementById('res-acc').textContent = this.state.accuracy + '%';
    document.getElementById('res-mistakes').textContent = this.state.mistakes;
    document.getElementById('res-cpm').textContent = this.state.cpm;
    document.getElementById('perf-msg').textContent = this.getPerformanceMessage();

    if (this.state.mode === 'race') {
      const aiWon = parseFloat(this.els.aiFill.style.width) > parseFloat(this.els.playerFill.style.width);
      document.getElementById('perf-msg').textContent = aiWon ? '🤖 AI Wins! Keep Training!' : '🏆 You Won the Race! 🚀';
    }

    this.openModal('result');
  }

  getPerformanceMessage() {
    const w = this.state.wpm;
    if (w >= 120) return "🔥 Legendary Speed! You're a pro.";
    if (w >= 90) return "🚀 Excellent! Top-tier typing skills.";
    if (w >= 70) return "💪 Strong performance! Keep pushing.";
    if (w >= 50) return "👍 Good job! Practice makes perfect.";
    if (w >= 30) return "🌱 Growing steadily. Keep at it!";
    return "🐢 Starting strong! Consistency is key.";
  }

  trackHeatmap(key) {
    this.state.keyHeatmap.set(key, (this.state.keyHeatmap.get(key) || 0) + 1);
  }

  playSound(type) {
    if (!this.state.soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      
      if (type === 'correct') { osc.frequency.value = 800; gain.gain.setValueAtTime(0.05, ctx.currentTime); }
      else if (type === 'wrong') { osc.frequency.value = 300; osc.type = 'sawtooth'; gain.gain.setValueAtTime(0.08, ctx.currentTime); }
      else if (type === 'backspace') { osc.frequency.value = 600; gain.gain.setValueAtTime(0.03, ctx.currentTime); }
      
      osc.start(); gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1); osc.stop(ctx.currentTime + 0.1);
    } catch (e) {}
  }

  scrollToActive(el) {
    const parent = this.els.textDisplay;
    const elTop = el.offsetTop;
    const parentTop = parent.offsetTop;
    if (elTop > parentTop + parent.clientHeight * 0.7) {
      parent.scrollTop += el.clientHeight * 1.5;
    }
  }

  updateUI() {
    this.els.liveWpm.textContent = this.state.wpm || 0;
    this.els.liveAcc.textContent = (this.state.accuracy || 100) + '%';
    this.els.liveStreak.textContent = this.state.maxStreak = Math.max(this.state.maxStreak, this.state.streak);
    this.buttons.focus.classList.toggle('active', this.state.isRunning);
  }

  setMode(mode) {
    this.state.mode = mode;
    this.state.time = mode === 'race' ? 60 : (mode === 'custom' ? Infinity : parseInt(mode));
    this.setModeUI(mode);
    this.els.raceUI.classList.toggle('visible', mode === 'race');
    this.generateText();
  }

  setModeUI(mode) {
    this.buttons.modeBtns.forEach(b => b.classList.toggle('active', b.dataset.mode === mode));
  }

  setDifficulty(diff) {
    this.state.difficulty = diff;
    this.buttons.diffBtns.forEach(b => b.classList.toggle('active', b.dataset.diff === diff));
    this.generateText();
  }

  applyTheme(theme) {
    this.state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    this.buttons.theme.textContent = theme === 'dark' ? '🌙' : '☀️';
    localStorage.setItem('theme', theme);
  }

  toggleTheme() { this.applyTheme(this.state.theme === 'dark' ? 'light' : 'dark'); }

  openModal(name) {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible'));
    setTimeout(() => this.els.modals[name].classList.add('visible'), 10);
    if (name === 'leaderboard') this.renderLeaderboard();
  }
  closeModal(name) { this.els.modals[name].classList.remove('visible'); }
  closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('visible')); }

  renderLeaderboard() {
    const tbody = document.getElementById('lb-body');
    const sorted = this.state.leaderboard.sort((a,b) => b.wpm - a.wpm || b.acc - a.acc).slice(0, 10);
    tbody.innerHTML = sorted.map((s, i) => 
      `<tr><td>${i+1}</td><td>${this.escape(s.name)}</td><td><strong>${s.wpm}</strong></td><td>${s.acc}%</td><td>${s.date}</td></tr>`
    ).join('');
  }

  saveScore() {
    const name = document.getElementById('lb-name').value.trim() || 'Player';
    if (this.state.isFinished && this.state.wpm > 0) {
      const entry = { name, wpm: this.state.wpm, acc: this.state.accuracy, date: new Date().toLocaleDateString() };
      this.state.leaderboard.push(entry);
      localStorage.setItem('typeprime_lb', JSON.stringify(this.state.leaderboard));
      this.renderLeaderboard();
      document.getElementById('lb-name').value = '';
      this.closeModal('leaderboard');
    }
  }

  shareResult() {
    const text = `🔥 TypePrime Result\n⚡ WPM: ${this.state.wpm} | 🎯 Acc: ${this.state.accuracy}% | 🥊 Mistakes: ${this.state.mistakes}\n🏁 Streak: ${this.state.maxStreak} | Try it: [URL]`;
    navigator.clipboard.writeText(text).then(() => alert('✅ Copied to clipboard!'));
  }

  escape(str) { return str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  new TypePrimeApp();
});