/* ===== PLAYGROUND — Core Application ===== */

// ---------- DATA ----------
const GAMES = [
  {
    id: 'reaction',
    title: 'Reaction Test',
    desc: 'Click the moment the screen turns green. How fast are your reflexes?',
    category: 'reaction',
    icon: '⚡',
    thumb: 'thumb-reaction',
    difficulty: 'easy',
    emoji: '⚡'
  },
  {
    id: 'memory',
    title: 'Memory Cards',
    desc: 'Flip cards and match pairs. Train your short-term memory.',
    category: 'brain',
    icon: '🧠',
    thumb: 'thumb-memory',
    difficulty: 'medium',
    emoji: '🧠'
  },
  {
    id: 'numbers',
    title: 'Number Challenge',
    desc: 'Solve quick math problems against the clock. Speed + accuracy.',
    category: 'numbers',
    icon: '🔢',
    thumb: 'thumb-numbers',
    difficulty: 'medium',
    emoji: '🔢'
  },
  {
    id: 'rps',
    title: 'Rock Paper Scissors',
    desc: 'Classic showdown against the computer. Build your win streak.',
    category: 'classic',
    icon: '🎮',
    thumb: 'thumb-rps',
    difficulty: 'easy',
    emoji: '✊'
  },
  {
    id: 'click',
    title: 'Click Challenge',
    desc: 'Click as many times as you can in 10 seconds. Pure speed.',
    category: 'accuracy',
    icon: '🎯',
    thumb: 'thumb-click',
    difficulty: 'easy',
    emoji: '👆'
  }
];

const ACHIEVEMENTS = [
  { id: 'first_game', name: 'First Game', desc: 'Play your first game', icon: '🏆', condition: (p) => p.gamesPlayed >= 1 },
  { id: 'streak_10', name: '10 Game Streak', desc: 'Reach a 10 win streak', icon: '🔥', condition: (p) => p.winStreak >= 10 },
  { id: 'fast_reaction', name: 'Fast Reaction', desc: 'React under 200ms', icon: '⚡', condition: (p) => (p.bestScores.reaction || Infinity) <= 200 },
  { id: 'memory_master', name: 'Memory Master', desc: 'Complete Memory in ≤12 moves', icon: '🧠', condition: (p) => (p.bestScores.memory_moves || Infinity) <= 12 },
  { id: 'perfect_score', name: 'Perfect Score', desc: 'Get a perfect round in Numbers', icon: '🎯', condition: (p) => p.flags.perfectNumbers },
  { id: 'arcade_legend', name: 'Arcade Legend', desc: 'Reach level 10', icon: '👑', condition: (p) => p.level >= 10 },
  { id: 'click_master', name: 'Click Master', desc: 'Score 80+ clicks', icon: '👆', condition: (p) => (p.bestScores.click || 0) >= 80 },
  { id: 'rps_champion', name: 'RPS Champion', desc: 'Win 20 RPS matches', icon: '✊', condition: (p) => (p.stats.rpsWins || 0) >= 20 }
];

const DEMO_LEADERBOARD = [
  { name: 'NeonFox', score: 28450, level: 18 },
  { name: 'PixelStorm', score: 24120, level: 15 },
  { name: 'VoidRunner', score: 19870, level: 13 },
  { name: 'CyberNova', score: 17640, level: 12 },
  { name: 'BlitzKing', score: 15230, level: 11 },
  { name: 'QuantumLeap', score: 13450, level: 10 },
  { name: 'ShadowAce', score: 11200, level: 9 },
  { name: 'TurboMind', score: 9870, level: 8 },
  { name: 'ApexPulse', score: 8450, level: 7 },
  { name: 'EchoByte', score: 7200, level: 6 }
];

// ---------- PLAYER STATE ----------
const DEFAULT_PLAYER = {
  name: 'Player',
  xp: 0,
  level: 1,
  gamesPlayed: 0,
  totalScore: 0,
  bestScore: 0,
  winStreak: 0,
  bestScores: {},
  stats: {},
  achievements: [],
  recent: [],
  flags: {}
};

let player = loadPlayer();
let currentGame = null;
let currentCategory = 'all';

function loadPlayer() {
  try {
    const raw = localStorage.getItem('playground_player');
    if (raw) {
      const data = JSON.parse(raw);
      return { ...DEFAULT_PLAYER, ...data };
    }
  } catch (e) {}
  return { ...DEFAULT_PLAYER };
}

function savePlayer() {
  localStorage.setItem('playground_player', JSON.stringify(player));
}

function xpForLevel(lvl) {
  return Math.floor(100 * Math.pow(1.4, lvl - 1));
}

function addXP(amount) {
  player.xp += amount;
  let leveled = false;
  while (player.xp >= xpForLevel(player.level)) {
    player.xp -= xpForLevel(player.level);
    player.level++;
    leveled = true;
  }
  if (leveled) {
    showToast(`Level Up! You are now Level ${player.level}`, '🎉');
    launchConfetti();
  }
  checkAchievements();
  savePlayer();
  updateUI();
  return amount;
}

function checkAchievements() {
  ACHIEVEMENTS.forEach(a => {
    if (!player.achievements.includes(a.id) && a.condition(player)) {
      player.achievements.push(a.id);
      showToast(`Achievement Unlocked: ${a.name}`, a.icon, true);
      launchConfetti();
    }
  });
  savePlayer();
}

// ---------- NAVIGATION ----------
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === page);
  });

  document.getElementById('mobile-menu').classList.remove('open');
  document.getElementById('result-overlay').classList.remove('show');

  if (page === 'home') renderHome();
  if (page === 'library') renderLibrary();
  if (page === 'leaderboard') renderLeaderboard();
  if (page === 'profile') renderProfile();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- RENDER HELPERS ----------
function renderGameCard(game, showPlay = true) {
  const best = player.bestScores[game.id];
  const bestText = best !== undefined
    ? (game.id === 'reaction' ? `${best}ms` : best)
    : '—';

  return `
    <div class="game-card" onclick="startGame('${game.id}')">
      <div class="game-card-thumb ${game.thumb}">${game.icon}</div>
      <div class="game-card-body">
        <div class="game-card-title">${game.title}</div>
        <div class="game-card-desc">${game.desc}</div>
        <div class="game-card-meta">
          <span class="difficulty diff-${game.difficulty}">${game.difficulty}</span>
          <span class="best-score">Best: <strong>${bestText}</strong></span>
        </div>
        ${showPlay ? `<button class="btn btn-primary play-btn" onclick="event.stopPropagation();startGame('${game.id}')">Play</button>` : ''}
      </div>
    </div>
  `;
}

function renderHome() {
  document.getElementById('featured-games').innerHTML = GAMES.slice(0, 3).map(g => renderGameCard(g)).join('');
  document.getElementById('popular-games').innerHTML = GAMES.slice().reverse().map(g => renderGameCard(g)).join('');

  document.getElementById('stat-games').textContent = player.gamesPlayed;
  document.getElementById('stat-score').textContent = formatNum(player.totalScore);
  document.getElementById('stat-level').textContent = player.level;
  document.getElementById('stat-streak').textContent = player.winStreak;

  const recentEl = document.getElementById('recent-games');
  if (!player.recent.length) {
    recentEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🕹️</div>
        <p>No games played yet. Jump in!</p>
        <button class="btn btn-primary" onclick="navigate('library')">Browse Games</button>
      </div>`;
  } else {
    recentEl.innerHTML = player.recent.slice(0, 5).map(r => {
      const g = GAMES.find(x => x.id === r.id);
      return `
        <div class="recent-item">
          <div class="recent-icon ${g?.thumb || ''}">${g?.icon || '🎮'}</div>
          <div class="recent-info">
            <div class="recent-name">${g?.title || r.id}</div>
            <div class="recent-meta">${timeAgo(r.time)}</div>
          </div>
          <div class="recent-score">${r.score}</div>
        </div>`;
    }).join('');
  }
}

function renderLibrary() {
  const filtered = currentCategory === 'all'
    ? GAMES
    : GAMES.filter(g => g.category === currentCategory);
  document.getElementById('library-games').innerHTML = filtered.map(g => renderGameCard(g)).join('');
}

function renderLeaderboard() {
  // Insert player into demo board
  const board = [...DEMO_LEADERBOARD];
  const you = { name: player.name + ' (You)', score: player.totalScore, level: player.level, isYou: true };
  board.push(you);
  board.sort((a, b) => b.score - a.score);

  // Podium
  const top3 = board.slice(0, 3);
  const podiumOrder = [top3[1], top3[0], top3[2]]; // silver, gold, bronze visual
  const ranks = ['silver', 'gold', 'bronze'];
  const medals = ['🥈', '🥇', '🥉'];

  document.getElementById('podium').innerHTML = podiumOrder.map((p, i) => {
    if (!p) return '';
    return `
      <div class="podium-place ${ranks[i]}">
        <div class="podium-rank">${medals[i]}</div>
        <div class="podium-avatar">${p.name.charAt(0)}</div>
        <div class="podium-name">${p.name}</div>
        <div class="podium-score">${formatNum(p.score)}</div>
        <div class="podium-bar"></div>
      </div>`;
  }).join('');

  document.getElementById('leaderboard-body').innerHTML = board.map((p, i) => `
    <tr class="${p.isYou ? 'lb-you' : ''}">
      <td><span class="rank-badge">${i + 1}</span></td>
      <td>
        <div class="lb-player">
          <div class="lb-avatar">${p.name.charAt(0)}</div>
          <span>${p.name}</span>
        </div>
      </td>
      <td>${formatNum(p.score)}</td>
      <td>${p.level}</td>
    </tr>
  `).join('');
}

function renderProfile() {
  document.getElementById('profile-avatar').textContent = player.name.charAt(0).toUpperCase();
  document.getElementById('player-name-input').value = player.name;
  document.getElementById('profile-level').textContent = player.level;
  const needed = xpForLevel(player.level);
  document.getElementById('profile-xp-text').textContent = `${player.xp} / ${needed} XP`;
  document.getElementById('profile-xp-bar').style.width = `${Math.min(100, (player.xp / needed) * 100)}%`;
  document.getElementById('p-games').textContent = player.gamesPlayed;
  document.getElementById('p-score').textContent = formatNum(player.totalScore);
  document.getElementById('p-best').textContent = formatNum(player.bestScore);
  document.getElementById('p-streak').textContent = player.winStreak;

  document.getElementById('achievements-grid').innerHTML = ACHIEVEMENTS.map(a => {
    const unlocked = player.achievements.includes(a.id);
    return `
      <div class="achievement ${unlocked ? 'unlocked' : ''}">
        <div class="achievement-icon">${a.icon}</div>
        <div class="achievement-name">${a.name}</div>
        <div class="achievement-desc">${a.desc}</div>
      </div>`;
  }).join('');
}

function updateUI() {
  document.getElementById('nav-player-name').textContent = player.name;
  document.getElementById('nav-player-level').textContent = `Lvl ${player.level}`;
  document.getElementById('profile-avatar').textContent = player.name.charAt(0).toUpperCase();
}

// ---------- GAME ENGINE ----------
function startGame(id) {
  const game = GAMES.find(g => g.id === id);
  if (!game) return;
  currentGame = id;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-game').classList.add('active');
  document.getElementById('result-overlay').classList.remove('show');

  document.getElementById('game-title').textContent = game.title;
  document.getElementById('game-category').textContent = game.category.charAt(0).toUpperCase() + game.category.slice(1);
  document.getElementById('game-live-stats').innerHTML = '';
  document.getElementById('game-stage').innerHTML = '';

  const starters = {
    reaction: initReaction,
    memory: initMemory,
    numbers: initNumbers,
    rps: initRPS,
    click: initClick
  };
  starters[id]();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function exitGame() {
  currentGame = null;
  navigate('library');
}

function showResult({ score, best, time, xp, isHigh }) {
  document.getElementById('result-score').textContent = score;
  document.getElementById('result-best').textContent = best;
  document.getElementById('result-time').textContent = time || '—';
  document.getElementById('result-xp').textContent = `+${xp}`;
  document.getElementById('result-new-high').style.display = isHigh ? 'block' : 'none';
  document.getElementById('result-overlay').classList.add('show');

  if (isHigh) launchConfetti();

  document.getElementById('btn-play-again').onclick = () => {
    document.getElementById('result-overlay').classList.remove('show');
    startGame(currentGame);
  };
}

function recordGame(id, score, meta = {}) {
  player.gamesPlayed++;
  player.totalScore += typeof score === 'number' ? Math.max(0, score) : 0;

  // Best score (higher is better except reaction)
  const isLowerBetter = id === 'reaction';
  const prev = player.bestScores[id];
  let isHigh = false;

  if (id === 'reaction') {
    if (prev === undefined || score < prev) {
      player.bestScores[id] = score;
      isHigh = true;
    }
  } else if (id === 'memory') {
    // score is moves (lower better), also track time
    if (prev === undefined || score < prev) {
      player.bestScores[id] = score;
      isHigh = true;
    }
    if (meta.moves !== undefined) {
      const prevMoves = player.bestScores.memory_moves;
      if (prevMoves === undefined || meta.moves < prevMoves) {
        player.bestScores.memory_moves = meta.moves;
      }
    }
  } else {
    if (prev === undefined || score > prev) {
      player.bestScores[id] = score;
      isHigh = true;
    }
  }

  if (typeof score === 'number' && score > player.bestScore && !isLowerBetter) {
    player.bestScore = score;
  }

  // Streak logic (simplified: treat good results as wins)
  if (meta.won) {
    player.winStreak++;
  } else if (meta.won === false) {
    player.winStreak = 0;
  }

  // Specific stats
  if (id === 'rps' && meta.won) {
    player.stats.rpsWins = (player.stats.rpsWins || 0) + 1;
  }
  if (id === 'numbers' && meta.perfect) {
    player.flags.perfectNumbers = true;
  }

  // Recent
  player.recent.unshift({ id, score: isLowerBetter ? `${score}ms` : score, time: Date.now() });
  if (player.recent.length > 20) player.recent.pop();

  const xp = meta.xp || Math.max(10, Math.floor((typeof score === 'number' ? score : 50) / 5));
  addXP(xp);
  checkAchievements();
  savePlayer();
  updateUI();

  return { isHigh, xp };
}

// ---------- GAME: REACTION TEST ----------
function initReaction() {
  const stage = document.getElementById('game-stage');
  let state = 'idle'; // idle | waiting | ready | result
  let startTime = 0;
  let timeoutId = null;
  let attempts = 0;
  let bestThis = Infinity;

  stage.innerHTML = `
    <div class="game-intro">
      <h3>Reaction Test</h3>
      <p>Wait for the green screen, then click as fast as you can. Don't click too early!</p>
      <button class="btn btn-primary btn-lg" id="rxn-start">Start</button>
    </div>
    <div class="reaction-box reaction-waiting" id="rxn-box" style="display:none"></div>
  `;

  const box = () => document.getElementById('rxn-box');
  const updateLive = () => {
    document.getElementById('game-live-stats').innerHTML = `
      <div class="live-stat"><span class="live-stat-val">${attempts}</span><span class="live-stat-lbl">Attempts</span></div>
      <div class="live-stat"><span class="live-stat-val">${bestThis === Infinity ? '—' : bestThis + 'ms'}</span><span class="live-stat-lbl">Best</span></div>
    `;
  };

  document.getElementById('rxn-start').onclick = () => {
    document.querySelector('.game-intro').style.display = 'none';
    box().style.display = 'flex';
    startRound();
  };

  function startRound() {
    state = 'waiting';
    box().className = 'reaction-box reaction-waiting';
    box().textContent = 'Wait for green...';
    const delay = 1500 + Math.random() * 3000;
    timeoutId = setTimeout(() => {
      state = 'ready';
      startTime = performance.now();
      box().className = 'reaction-box reaction-ready';
      box().textContent = 'CLICK!';
    }, delay);
  }

  box().onclick = () => {
    if (state === 'waiting') {
      clearTimeout(timeoutId);
      state = 'early';
      box().className = 'reaction-box reaction-early';
      box().textContent = 'Too early! Click to retry';
      return;
    }
    if (state === 'early') {
      startRound();
      return;
    }
    if (state === 'ready') {
      const ms = Math.round(performance.now() - startTime);
      attempts++;
      if (ms < bestThis) bestThis = ms;
      state = 'result';
      box().className = 'reaction-box reaction-result';
      box().textContent = `${ms} ms`;
      updateLive();

      setTimeout(() => {
        const { isHigh, xp } = recordGame('reaction', ms, { xp: Math.max(15, 300 - ms), won: ms < 300 });
        const globalBest = player.bestScores.reaction || ms;
        showResult({
          score: `${ms}ms`,
          best: `${globalBest}ms`,
          time: '—',
          xp,
          isHigh
        });
      }, 800);
    }
  };

  updateLive();
}

// ---------- GAME: MEMORY CARDS ----------
function initMemory() {
  const stage = document.getElementById('game-stage');
  const icons = ['🍎', '🚀', '🎸', '🦊', '💎', '🌙', '⚡', '🎯'];
  let cards = [...icons, ...icons].sort(() => Math.random() - 0.5);
  let flipped = [];
  let matched = 0;
  let moves = 0;
  let locked = false;
  let startTime = Date.now();

  stage.innerHTML = `
    <div class="game-intro" id="mem-intro">
      <h3>Memory Cards</h3>
      <p>Find all matching pairs. Fewer moves = higher score.</p>
      <button class="btn btn-primary btn-lg" id="mem-start">Start</button>
    </div>
    <div class="memory-grid" id="mem-grid" style="display:none"></div>
  `;

  const updateLive = () => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById('game-live-stats').innerHTML = `
      <div class="live-stat"><span class="live-stat-val">${moves}</span><span class="live-stat-lbl">Moves</span></div>
      <div class="live-stat"><span class="live-stat-val">${matched}/8</span><span class="live-stat-lbl">Pairs</span></div>
      <div class="live-stat"><span class="live-stat-val">${elapsed}s</span><span class="live-stat-lbl">Time</span></div>
    `;
  };

  document.getElementById('mem-start').onclick = () => {
    document.getElementById('mem-intro').style.display = 'none';
    const grid = document.getElementById('mem-grid');
    grid.style.display = 'grid';
    startTime = Date.now();
    grid.innerHTML = cards.map((icon, i) => `
      <div class="memory-card" data-idx="${i}">
        <div class="memory-face memory-back">?</div>
        <div class="memory-face memory-front">${icon}</div>
      </div>
    `).join('');

    grid.querySelectorAll('.memory-card').forEach(card => {
      card.onclick = () => {
        if (locked || card.classList.contains('flipped') || card.classList.contains('matched')) return;
        card.classList.add('flipped');
        flipped.push(card);

        if (flipped.length === 2) {
          moves++;
          updateLive();
          const [a, b] = flipped;
          const iconA = cards[+a.dataset.idx];
          const iconB = cards[+b.dataset.idx];

          if (iconA === iconB) {
            a.classList.add('matched');
            b.classList.add('matched');
            matched++;
            flipped = [];
            if (matched === 8) {
              const time = Math.floor((Date.now() - startTime) / 1000);
              // Score: lower moves better → convert to points
              const score = Math.max(100, 1000 - moves * 30 - time * 5);
              const { isHigh, xp } = recordGame('memory', score, {
                moves,
                xp: Math.max(20, 150 - moves * 5),
                won: moves <= 16
              });
              setTimeout(() => {
                showResult({
                  score,
                  best: player.bestScores.memory || score,
                  time: `${time}s`,
                  xp,
                  isHigh
                });
              }, 500);
            }
          } else {
            locked = true;
            setTimeout(() => {
              a.classList.remove('flipped');
              b.classList.remove('flipped');
              flipped = [];
              locked = false;
            }, 700);
          }
        }
      };
    });

    // Live timer
    const timer = setInterval(() => {
      if (matched === 8) clearInterval(timer);
      else updateLive();
    }, 1000);
    updateLive();
  };
}

// ---------- GAME: NUMBER CHALLENGE ----------
function initNumbers() {
  const stage = document.getElementById('game-stage');
  let correct = 0;
  let wrong = 0;
  let round = 0;
  const totalRounds = 10;
  let startTime = 0;
  let currentAnswer = 0;

  stage.innerHTML = `
    <div class="game-intro" id="num-intro">
      <h3>Number Challenge</h3>
      <p>Solve 10 quick math problems. Be fast and accurate!</p>
      <button class="btn btn-primary btn-lg" id="num-start">Start</button>
    </div>
    <div id="num-play" style="display:none;text-align:center">
      <div class="number-display" id="num-display">?</div>
      <div class="number-question" id="num-question"></div>
      <div class="number-options" id="num-options"></div>
    </div>
  `;

  const updateLive = () => {
    document.getElementById('game-live-stats').innerHTML = `
      <div class="live-stat"><span class="live-stat-val">${correct}</span><span class="live-stat-lbl">Correct</span></div>
      <div class="live-stat"><span class="live-stat-val">${wrong}</span><span class="live-stat-lbl">Wrong</span></div>
      <div class="live-stat"><span class="live-stat-val">${round}/${totalRounds}</span><span class="live-stat-lbl">Round</span></div>
    `;
  };

  function genProblem() {
    const ops = [
      () => {
        const a = rand(5, 30), b = rand(5, 30);
        return { q: `${a} + ${b}`, a: a + b };
      },
      () => {
        const a = rand(10, 50), b = rand(5, a);
        return { q: `${a} − ${b}`, a: a - b };
      },
      () => {
        const a = rand(3, 12), b = rand(2, 9);
        return { q: `${a} × ${b}`, a: a * b };
      },
      () => {
        const b = rand(2, 9), a = b * rand(2, 10);
        return { q: `${a} ÷ ${b}`, a: a / b };
      }
    ];
    return ops[rand(0, ops.length - 1)]();
  }

  function nextRound() {
    if (round >= totalRounds) {
      const time = Math.floor((Date.now() - startTime) / 1000);
      const score = correct * 100 - wrong * 30 + Math.max(0, 50 - time);
      const perfect = correct === totalRounds;
      const { isHigh, xp } = recordGame('numbers', Math.max(0, score), {
        xp: correct * 12 + (perfect ? 50 : 0),
        won: correct >= 7,
        perfect
      });
      showResult({
        score: Math.max(0, score),
        best: player.bestScores.numbers || score,
        time: `${time}s`,
        xp,
        isHigh
      });
      return;
    }

    round++;
    const problem = genProblem();
    currentAnswer = problem.a;
    document.getElementById('num-display').textContent = problem.a; // briefly show? No, hide answer
    document.getElementById('num-display').textContent = '?';
    document.getElementById('num-question').textContent = problem.q + ' = ?';

    // Generate options
    const opts = new Set([currentAnswer]);
    while (opts.size < 4) {
      const offset = rand(-10, 10) || 1;
      opts.add(currentAnswer + offset);
    }
    const shuffled = [...opts].sort(() => Math.random() - 0.5);

    document.getElementById('num-options').innerHTML = shuffled.map(o =>
      `<button class="number-opt" data-val="${o}">${o}</button>`
    ).join('');

    document.querySelectorAll('.number-opt').forEach(btn => {
      btn.onclick = () => {
        const val = +btn.dataset.val;
        if (val === currentAnswer) {
          btn.classList.add('correct');
          correct++;
        } else {
          btn.classList.add('wrong');
          wrong++;
          // highlight correct
          document.querySelectorAll('.number-opt').forEach(b => {
            if (+b.dataset.val === currentAnswer) b.classList.add('correct');
          });
        }
        updateLive();
        setTimeout(nextRound, 600);
      };
    });
    updateLive();
  }

  document.getElementById('num-start').onclick = () => {
    document.getElementById('num-intro').style.display = 'none';
    document.getElementById('num-play').style.display = 'block';
    startTime = Date.now();
    nextRound();
  };
}

// ---------- GAME: ROCK PAPER SCISSORS ----------
function initRPS() {
  const stage = document.getElementById('game-stage');
  let wins = 0, losses = 0, draws = 0;
  const choices = ['✊', '✋', '✌️'];
  const names = ['Rock', 'Paper', 'Scissors'];

  stage.innerHTML = `
    <div class="game-intro">
      <h3>Rock Paper Scissors</h3>
      <p>Best of luck. Choose your weapon!</p>
    </div>
    <div class="rps-choices" id="rps-choices">
      <button class="rps-btn" data-c="0">✊</button>
      <button class="rps-btn" data-c="1">✋</button>
      <button class="rps-btn" data-c="2">✌️</button>
    </div>
    <div class="rps-vs" id="rps-vs" style="display:none">
      <span id="rps-you"></span>
      <span style="font-size:1.2rem;color:var(--text-dim)">VS</span>
      <span id="rps-cpu"></span>
    </div>
    <div class="rps-result-text" id="rps-result"></div>
    <div style="margin-top:24px;text-align:center">
      <button class="btn btn-secondary" id="rps-end" style="display:none">End Session</button>
    </div>
  `;

  const updateLive = () => {
    document.getElementById('game-live-stats').innerHTML = `
      <div class="live-stat"><span class="live-stat-val">${wins}</span><span class="live-stat-lbl">Wins</span></div>
      <div class="live-stat"><span class="live-stat-val">${losses}</span><span class="live-stat-lbl">Losses</span></div>
      <div class="live-stat"><span class="live-stat-val">${draws}</span><span class="live-stat-lbl">Draws</span></div>
      <div class="live-stat"><span class="live-stat-val">${player.winStreak}</span><span class="live-stat-lbl">Streak</span></div>
    `;
  };

  document.querySelectorAll('.rps-btn').forEach(btn => {
    btn.onclick = () => {
      const you = +btn.dataset.c;
      const cpu = Math.floor(Math.random() * 3);
      document.getElementById('rps-vs').style.display = 'flex';
      document.getElementById('rps-you').textContent = choices[you];
      document.getElementById('rps-cpu').textContent = choices[cpu];

      let result, won;
      if (you === cpu) {
        result = "It's a Draw!";
        draws++;
        won = null;
      } else if ((you === 0 && cpu === 2) || (you === 1 && cpu === 0) || (you === 2 && cpu === 1)) {
        result = 'You Win!';
        wins++;
        won = true;
      } else {
        result = 'You Lose!';
        losses++;
        won = false;
      }
      document.getElementById('rps-result').textContent = result;
      document.getElementById('rps-end').style.display = 'inline-flex';

      // Record each round lightly
      if (won === true) {
        player.winStreak++;
        player.stats.rpsWins = (player.stats.rpsWins || 0) + 1;
      } else if (won === false) {
        player.winStreak = 0;
      }
      savePlayer();
      updateLive();
      checkAchievements();
    };
  });

  document.getElementById('rps-end').onclick = () => {
    const score = wins * 100 + draws * 20;
    const { isHigh, xp } = recordGame('rps', score, {
      xp: wins * 15 + draws * 5,
      won: wins > losses
    });
    showResult({
      score,
      best: player.bestScores.rps || score,
      time: `${wins}W / ${losses}L / ${draws}D`,
      xp,
      isHigh
    });
  };

  updateLive();
}

// ---------- GAME: CLICK CHALLENGE ----------
function initClick() {
  const stage = document.getElementById('game-stage');
  const DURATION = 10;
  let clicks = 0;
  let running = false;
  let timeLeft = DURATION;
  let timerId = null;

  stage.innerHTML = `
    <div class="game-intro" id="clk-intro">
      <h3>Click Challenge</h3>
      <p>Click as fast as you can for ${DURATION} seconds. Ready?</p>
      <button class="btn btn-primary btn-lg" id="clk-start">Start</button>
    </div>
    <div class="click-area" id="clk-area" style="display:none">
      <div class="click-count" id="clk-count">0</div>
      <div class="click-timer" id="clk-timer">${DURATION}s</div>
      <div class="click-instruction">Click anywhere!</div>
    </div>
  `;

  const updateLive = () => {
    const cps = running ? (clicks / (DURATION - timeLeft || 1)).toFixed(1) : '0';
    document.getElementById('game-live-stats').innerHTML = `
      <div class="live-stat"><span class="live-stat-val">${clicks}</span><span class="live-stat-lbl">Clicks</span></div>
      <div class="live-stat"><span class="live-stat-val">${cps}</span><span class="live-stat-lbl">CPS</span></div>
      <div class="live-stat"><span class="live-stat-val">${timeLeft}s</span><span class="live-stat-lbl">Time</span></div>
    `;
  };

  document.getElementById('clk-start').onclick = () => {
    document.getElementById('clk-intro').style.display = 'none';
    const area = document.getElementById('clk-area');
    area.style.display = 'flex';
    area.classList.add('active');
    running = true;
    clicks = 0;
    timeLeft = DURATION;
    updateLive();

    timerId = setInterval(() => {
      timeLeft--;
      document.getElementById('clk-timer').textContent = `${timeLeft}s`;
      updateLive();
      if (timeLeft <= 0) {
        clearInterval(timerId);
        running = false;
        area.classList.remove('active');
        const cps = (clicks / DURATION).toFixed(1);
        const { isHigh, xp } = recordGame('click', clicks, {
          xp: Math.floor(clicks * 1.5),
          won: clicks >= 50
        });
        showResult({
          score: clicks,
          best: player.bestScores.click || clicks,
          time: `${cps} CPS`,
          xp,
          isHigh
        });
      }
    }, 1000);

    area.onclick = () => {
      if (!running) return;
      clicks++;
      document.getElementById('clk-count').textContent = clicks;
      updateLive();
    };
  };
}

// ---------- UTILITIES ----------
function formatNum(n) {
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function showToast(text, icon = '✨', isAchievement = false) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast' + (isAchievement ? ' achievement-toast' : '');
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${text}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = '0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Confetti
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const pieces = [];
  const colors = ['#6366f1', '#22d3ee', '#a78bfa', '#f472b6', '#fbbf24', '#34d399'];

  for (let i = 0; i < 120; i++) {
    pieces.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: 6 + Math.random() * 6,
      h: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 4,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * 360,
      vr: -4 + Math.random() * 8
    });
  }

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rot * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    frame++;
    if (frame < 120) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  draw();
}

// ---------- INIT ----------
document.addEventListener('DOMContentLoaded', () => {
  // Nav links
  document.querySelectorAll('.nav-link').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.page));
  });

  // Mobile toggle
  document.getElementById('nav-toggle').addEventListener('click', () => {
    document.getElementById('mobile-menu').classList.toggle('open');
  });

  // Category filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      renderLibrary();
    });
  });

  // Name edit
  document.getElementById('player-name-input').addEventListener('change', (e) => {
    const name = e.target.value.trim().slice(0, 16) || 'Player';
    player.name = name;
    e.target.value = name;
    savePlayer();
    updateUI();
  });

  updateUI();
  navigate('home');
});
