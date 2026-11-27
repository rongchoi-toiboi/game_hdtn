const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const START_ELO = 500;
const K_FACTOR = 32;
const ALLOWED_NODE_COUNTS = [2, 3, 4, 5, 6, 7, 8];
const MATCH_MINUTES = 5;
const PID_RE = /^[A-Za-z0-9_-]{8,64}$/;

// Lucky Wheel & Reconnect constants
const WHEEL_MATCH_STEP = 3; // Kích hoạt Vòng quay may mắn sau mỗi 3 trận hoàn thành
const WHEEL_SPIN_DURATION_MS = 3400;
const GUESS_TIMEOUT = 10000;
const WHEEL_RESULT_HOLD_MS = 2300;
const WHEEL_GUESS_RESULT_HOLD_MS = 3200;
const RECONNECT_GRACE_MS = 12000;

// Cấu hình thông số Item & Quiz
const QUIZ_WIN_MULTIPLIER = 2.5; // Hệ số X khi trả lời đúng 3/3 lúc thắng (x2.5 baseGain)
const BET_MULTIPLIER = 2.0;      // Hệ số X khi dùng item Đặt cược Elo (thắng x2, thua -x2)
const ITEM_ADD_SPOT_CONNECTIONS = 2; // Số kết nối sẵn có X của nút mới thêm (max bậc 3 => còn 1 lượt nối)
const ITEM_CUT_EDGES_COUNT = 1;       // Số nước đi (cặp đường nối) bị xóa ngẫu nhiên

const ITEM_CATALOG = {
  shield: {
    id: 'shield',
    icon: '🛡️',
    name: 'Khiên Elo',
    desc: 'Không bị trừ Elo nếu thua trận này.'
  },
  bet: {
    id: 'bet',
    icon: '🎲',
    name: `Cược Elo x${BET_MULTIPLIER}`,
    desc: `Dùng ở đầu trận: Thắng x${BET_MULTIPLIER} Elo nhận, thua -x${BET_MULTIPLIER} Elo mất.`
  },
  add_spot: {
    id: 'add_spot',
    icon: '➕',
    name: `Thêm 1 Nút (${ITEM_ADD_SPOT_CONNECTIONS} kết nối)`,
    desc: `Tạo thêm 1 điểm nối mới có sẵn ${ITEM_ADD_SPOT_CONNECTIONS} kết nối trên bàn.`
  },
  cut_edges: {
    id: 'cut_edges',
    icon: '✂️',
    name: 'Cắt Đường Ngẫu Nhiên',
    desc: 'Xóa ngẫu nhiên 1 cặp đường nối trên bàn cờ và trả lại kết nối.'
  },
  risk_wheel: {
    id: 'risk_wheel',
    icon: '🎰',
    name: 'Vòng Quay May Rủi',
    desc: 'Quay ngay trong trận: +2 lượt liên tiếp, mất lượt, swap 2 nút, thêm nút, cắt đường hoặc +30s.'
  }
};

// Các ô của Vòng quay may mắn sau mỗi 3 trận (giữ nguyên các ô cũ + thêm ô nhận Item)
const WHEEL_SEGMENTS = [
  { type: 'x2', label: 'x2 ELO', short: 'x2 ELO', color: '#f59f00' },
  { type: 'steal', label: 'Cướp 5% ELO', short: 'STEAL 5%', color: '#e03131' },
  { type: 'guess_swap', label: 'Đoán Elo · Swap', short: 'SWAP ELO', color: '#7950f2' },
  { type: 'item_shield', itemId: 'shield', label: '🛡️ Khiên Không Mất Elo', short: '🛡️ KHIÊN', color: '#0ca678' },
  { type: 'item_bet', itemId: 'bet', label: `🎲 Item Cược Elo x${BET_MULTIPLIER}`, short: `🎲 CƯỢC x${BET_MULTIPLIER}`, color: '#d9480f' },
  { type: 'item_risk_wheel', itemId: 'risk_wheel', label: '🎰 Vòng Quay May Rủi', short: '🎰 MAY RỦI', color: '#5f3dc4' },
  { type: 'item_add_spot', itemId: 'add_spot', label: '➕ Item Thêm 1 Điểm Nối', short: '➕ THÊM NÚT', color: '#1c7ed6' },
  { type: 'item_cut_edges', itemId: 'cut_edges', label: '✂️ Item Cắt Đường Nối', short: '✂️ CẮT DÂY', color: '#c92a2a' }
];

// Các ô của Item Vòng quay may rủi (xài trực tiếp trong ván đấu)
const IN_MATCH_RISK_SEGMENTS = [
  { type: 'double_turn', label: '⚡ Được 2 lượt nối liên tiếp', short: '2 LƯỢT', color: '#16a34a' },
  { type: 'lose_turn', label: '⏭️ Mất lượt nối hiện tại', short: 'MẤT LƯỢT', color: '#e03131' },
  { type: 'swap_nodes', label: '🔄 Swap vị trí 2 nút bất kỳ', short: 'SWAP NÚT', color: '#7950f2' },
  { type: 'spawn_node', label: '➕ Thêm 1 nút mới trên bàn', short: '+1 NÚT', color: '#1c7ed6' },
  { type: 'cut_random', label: '✂️ Mất ngẫu nhiên 1 cặp đường', short: 'CẮT DÂY', color: '#d9480f' },
  { type: 'bonus_time', label: '⏳ Cộng thêm 30 giây đồng hồ', short: '+30 GIÂY', color: '#0ca678' }
];

const VIRTUAL_BOT_NAMES = [
  'AstraBot', 'NovaBot', 'VertexBot', 'EulerBot', 'GraphBot', 'CipherBot'
];

const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);

app.get('/healthz', (req, res) => res.status(200).send('ok'));
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling']
});

const FALLBACK_QUESTIONS = [
  {
    id: 1,
    question: "Trong trò chơi Sprouts, mỗi chấm (node) có thể nối tối đa bao nhiêu đường?",
    options: { A: "2 đường", B: "3 đường", C: "4 đường", D: "Không giới hạn" },
    correctAnswer: "B",
    explanation: ""
  },
  {
    id: 2,
    question: "Khi vẽ một đường nối hợp lệ trong Sprouts, điều gì xảy ra ở giữa đường vừa vẽ?",
    options: { A: "Xóa bỏ 1 chấm cũ", B: "Thêm 1 chấm mới có bậc 2", C: "Thêm 2 chấm mới", D: "Không có gì thay đổi" },
    correctAnswer: "B",
    explanation: ""
  },
  {
    id: 3,
    question: "Nếu trò chơi Sprouts bắt đầu với n chấm ban đầu, số nước đi tối đa có thể thực hiện là bao nhiêu?",
    options: { A: "2n - 1", B: "3n - 1", C: "3n", D: "4n - 2" },
    correctAnswer: "B",
    explanation: ""
  }
];

let questionsBank = [];
try {
  const qPath = path.join(__dirname, 'questions.json');
  if (fs.existsSync(qPath)) {
    const parsed = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
    if (Array.isArray(parsed) && parsed.length >= 3) questionsBank = parsed;
  }
} catch (e) {
  console.error('Lỗi đọc questions.json:', e);
}
if (questionsBank.length < 3) questionsBank = FALLBACK_QUESTIONS;

// Lưu trữ người chơi theo PID (tránh trùng lặp khi F5, reconnect hoặc mở nhiều tab)
const ratings = new Map();
const usernames = new Map();
let waitingPlayer = null;
let rooms = {};                      // socketId -> room
const roomsById = new Map();         // roomId -> room
const pidToRoom = new Map();         // pid -> roomId
const pidToActiveWheel = new Map();  // pid -> wheelState (Post-match Lucky Wheel)
let users = {};                      // socketId -> { pid }
let quizSessions = {};               // sessionId -> session

const cleanName = (x) => String(x == null ? '' : x).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);
const roundElo = (v) => Math.max(0, Number(Number(v).toFixed(1)));

function isUsernameTaken(name, currentPid) {
  const norm = name.toLowerCase();
  return usernames.has(norm) && usernames.get(norm) !== currentPid;
}

function getSystemStats() {
  const onlinePids = new Set();
  for (const sid of Object.keys(users)) {
    const sock = io.sockets.sockets.get(sid);
    if (sock && sock.connected && users[sid] && users[sid].pid) {
      onlinePids.add(users[sid].pid);
    }
  }
  return {
    totalParticipants: ratings.size,
    onlineCount: onlinePids.size
  };
}

const broadcastSystemStats = () => io.emit('stats_update', getSystemStats());

function createDefaultInventory() {
  // Tặng sẵn mỗi loại 1 item cho người chơi mới trải nghiệm ngay, và nhận thêm từ Vòng quay may mắn
  return {
    shield: 1,
    bet: 1,
    add_spot: 1,
    cut_edges: 1,
    risk_wheel: 1
  };
}

function identify(socket, data) {
  const d = data && typeof data === 'object' ? data : {};
  let u = users[socket.id];
  if (!u) {
    const pid = typeof d.pid === 'string' && PID_RE.test(d.pid) ? d.pid : 'anon_' + socket.id;
    u = users[socket.id] = { pid };
  }
  let rec = ratings.get(u.pid);
  if (!rec) {
    let baseName = cleanName(d.name) || 'Player_' + crypto.randomBytes(2).toString('hex');
    while (isUsernameTaken(baseName, u.pid)) baseName = 'Player_' + crypto.randomBytes(2).toString('hex');
    rec = {
      pub: crypto.randomBytes(4).toString('hex'),
      name: baseName,
      elo: START_ELO,
      games: 0,
      wins: 0,
      completedMatches: 0,
      wheelProgress: 0,
      pendingX2Buff: false,
      inventory: createDefaultInventory(),
      countedRooms: new Set()
    };
    ratings.set(u.pid, rec);
    usernames.set(baseName.toLowerCase(), u.pid);
  } else if (d.name !== undefined) {
    const requestedName = cleanName(d.name);
    if (requestedName) {
      if (!isUsernameTaken(requestedName, u.pid)) {
        usernames.delete(rec.name.toLowerCase());
        rec.name = requestedName;
        usernames.set(requestedName.toLowerCase(), u.pid);
        socket.emit('name_result', { success: true, name: requestedName });
      } else {
        socket.emit('name_result', { success: false, message: 'Tên này đã có người sử dụng!' });
        socket.emit('profile', profileOf(rec));
      }
    }
  }
  return rec;
}

const recOf = (socketId) => (users[socketId] ? ratings.get(users[socketId].pid) : null);
const recByPid = (pid) => (pid ? ratings.get(pid) : null);
const profileOf = (rec) => ({
  pub: rec.pub,
  name: rec.name,
  elo: rec.elo,
  games: rec.games,
  completedMatches: rec.completedMatches,
  wheelProgress: rec.wheelProgress,
  wheelStep: WHEEL_MATCH_STEP,
  pendingX2Buff: !!rec.pendingX2Buff,
  inventory: { ...(rec.inventory || {}) },
  itemCatalog: ITEM_CATALOG
});

function getSocketByPid(pid) {
  if (!pid) return null;
  for (const [sid, u] of Object.entries(users)) {
    if (u && u.pid === pid) {
      const s = io.sockets.sockets.get(sid);
      if (s && s.connected) return s;
    }
  }
  return null;
}

function getLeaderboard() {
  const online = new Set(Object.values(users).map((u) => u.pid));
  return [...ratings.entries()]
    .filter(([pid, r]) => r.games > 0 || online.has(pid))
    .map(([pid, r]) => ({ pub: r.pub, name: r.name, elo: r.elo, games: r.games, online: online.has(pid) }))
    .sort((a, b) => b.elo - a.elo || b.games - a.games)
    .slice(0, 10);
}
const broadcastLeaderboard = () => io.emit('leaderboard_update', getLeaderboard());

function generateSpots(n = 3) {
  const spots = [];
  const W = 900, H = 600;
  for (let t = 0; spots.length < n && t < 2000; t++) {
    const p = { x: (Math.random() - 0.5) * (W - 140), y: (Math.random() - 0.5) * (H - 140), d: 0 };
    if (spots.every((s) => Math.hypot(s.x - p.x, s.y - p.y) > (t > 1000 ? 70 : 130))) spots.push(p);
  }
  return spots;
}

function getRoomRole(room, socketId) {
  if (!room) return -1;
  if (room.p1 === socketId) return 0;
  if (room.p2 === socketId) return 1;
  return -1;
}

function getRoomSocket(room, role) {
  const sid = role === 0 ? room.p1 : room.p2;
  const s = sid ? io.sockets.sockets.get(sid) : null;
  if (s && s.connected) return s;
  const pid = role === 0 ? room.p1Pid : room.p2Pid;
  return getSocketByPid(pid);
}

function getRoomRec(room, role) {
  return recByPid(role === 0 ? room.p1Pid : room.p2Pid);
}

function clearWheelTimers(wheel) {
  if (!wheel) return;
  if (wheel.resolveTimer) clearTimeout(wheel.resolveTimer);
  if (wheel.completeTimer) clearTimeout(wheel.completeTimer);
  wheel.resolveTimer = null;
  wheel.completeTimer = null;
}

function clearDisconnectTimers(room) {
  if (!room || !room.disconnectTimers) return;
  [0, 1].forEach((r) => {
    if (room.disconnectTimers[r]) {
      clearTimeout(room.disconnectTimers[r]);
      room.disconnectTimers[r] = null;
    }
  });
}

function cleanupRoomRefs(room) {
  if (!room) return;
  clearDisconnectTimers(room);
  if (rooms[room.p1] === room) delete rooms[room.p1];
  if (rooms[room.p2] === room) delete rooms[room.p2];
  if (pidToRoom.get(room.p1Pid) === room.id) pidToRoom.delete(room.p1Pid);
  if (pidToRoom.get(room.p2Pid) === room.id) pidToRoom.delete(room.p2Pid);
  roomsById.delete(room.id);
}

function buildGuessCandidates(spinnerPid) {
  const spinnerRec = recByPid(spinnerPid);
  if (!spinnerRec) return [];

  const candidates = [{
    id: spinnerRec.pub,
    name: spinnerRec.name,
    elo: spinnerRec.elo,
    isBot: false
  }];
  const usedIds = new Set([spinnerRec.pub]);

  const otherReals = [...ratings.entries()]
    .filter(([pid, r]) => pid !== spinnerPid && r && !usedIds.has(r.pub))
    .map(([, r]) => r)
    .sort(() => Math.random() - 0.5);

  for (const r of otherReals) {
    if (candidates.length >= 3) break;
    usedIds.add(r.pub);
    candidates.push({
      id: r.pub,
      name: r.name,
      elo: r.elo,
      isBot: false
    });
  }

  let botIdx = 0;
  const shuffledBots = [...VIRTUAL_BOT_NAMES].sort(() => Math.random() - 0.5);
  while (candidates.length < 3) {
    const botId = 'bot_' + crypto.randomBytes(4).toString('hex');
    const offset = Math.round((Math.random() - 0.45) * 260);
    const botElo = Math.max(200, Math.round(spinnerRec.elo + offset));
    const botName = shuffledBots[botIdx % shuffledBots.length] + '_' + (10 + Math.floor(Math.random() * 89));
    botIdx++;
    candidates.push({
      id: botId,
      name: botName,
      elo: botElo,
      isBot: true
    });
  }

  return candidates.sort(() => Math.random() - 0.5);
}

/**
 * Kích hoạt Vòng quay may mắn sau khi người chơi hoàn thành đủ 3 trận đấu.
 */
function triggerPostMatchLuckyWheel(spinnerPid, opponentPid, matchNumber, onWheelFinished) {
  const spinnerRec = recByPid(spinnerPid);
  const spinnerSock = getSocketByPid(spinnerPid);

  if (!spinnerRec || !spinnerSock || !spinnerSock.connected) {
    if (typeof onWheelFinished === 'function') onWheelFinished();
    return;
  }

  const existing = pidToActiveWheel.get(spinnerPid);
  if (existing) {
    clearWheelTimers(existing);
    pidToActiveWheel.delete(spinnerPid);
  }

  const targetIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
  const selectedSeg = WHEEL_SEGMENTS[targetIndex];
  const rewardType = selectedSeg.type;
  const eventId = 'lw_' + crypto.randomBytes(8).toString('hex');

  let candidates = null;
  let publicCandidates = null;
  if (rewardType === 'guess_swap') {
    candidates = buildGuessCandidates(spinnerPid);
    publicCandidates = candidates.map((c) => ({
      id: c.id,
      name: c.name,
      isBot: c.isBot
    }));
  }

  const startedAt = Date.now();
  const wheelState = {
    eventId,
    spinnerPid,
    opponentPid,
    spinnerName: spinnerRec.name,
    matchNumber,
    targetIndex,
    rewardType,
    itemId: selectedSeg.itemId || null,
    candidates,
    publicCandidates,
    startedAt,
    spinDurationMs: WHEEL_SPIN_DURATION_MS,
    guessTimeoutMs: rewardType === 'guess_swap' ? GUESS_TIMEOUT : 0,
    guessDeadlineAt: rewardType === 'guess_swap' ? startedAt + WHEEL_SPIN_DURATION_MS + GUESS_TIMEOUT : 0,
    guessSubmitted: false,
    chosenId: null,
    processed: false,
    resultPayload: null,
    resolveTimer: null,
    completeTimer: null,
    onComplete: onWheelFinished
  };

  pidToActiveWheel.set(spinnerPid, wheelState);

  spinnerSock.emit('lucky_wheel_start', {
    mode: 'post_match',
    eventId,
    spinnerPid,
    spinnerName: spinnerRec.name,
    matchNumber,
    milestone: matchNumber,
    segments: WHEEL_SEGMENTS,
    targetIndex,
    rewardType,
    candidates: publicCandidates,
    startedAt,
    spinDurationMs: WHEEL_SPIN_DURATION_MS,
    guessTimeoutMs: wheelState.guessTimeoutMs
  });

  if (rewardType === 'guess_swap') {
    wheelState.resolveTimer = setTimeout(() => {
      const curW = pidToActiveWheel.get(spinnerPid);
      if (!curW || curW.eventId !== eventId || curW.processed) return;
      const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
      resolvePostMatchLuckyWheel(spinnerPid, eventId, randomPick ? randomPick.id : null, true);
    }, WHEEL_SPIN_DURATION_MS + GUESS_TIMEOUT);
  } else {
    wheelState.resolveTimer = setTimeout(() => {
      resolvePostMatchLuckyWheel(spinnerPid, eventId, null, false);
    }, WHEEL_SPIN_DURATION_MS);
  }
}

function resolvePostMatchLuckyWheel(spinnerPid, eventId, chosenId, timedOut) {
  const wheel = pidToActiveWheel.get(spinnerPid);
  if (!wheel || wheel.eventId !== eventId || wheel.processed) return;

  wheel.processed = true;
  if (wheel.resolveTimer) {
    clearTimeout(wheel.resolveTimer);
    wheel.resolveTimer = null;
  }

  const spinnerRec = recByPid(spinnerPid);
  const oppRec = recByPid(wheel.opponentPid);
  if (!spinnerRec) {
    finishPostMatchLuckyWheel(spinnerPid, eventId);
    return;
  }

  let stolenAmount = 0;
  let swapped = false;
  let guessResult = null;
  let summaryText = '';

  if (wheel.rewardType === 'x2') {
    spinnerRec.pendingX2Buff = true;
    summaryText = `${spinnerRec.name} nhận buff x2 ELO cho phần thưởng dương!`;
  } else if (wheel.rewardType === 'steal') {
    if (oppRec && oppRec.elo > 0) {
      const rawStolen = Math.max(1, Math.round(oppRec.elo * 0.05));
      stolenAmount = Math.min(rawStolen, oppRec.elo);
      if (stolenAmount > 0) {
        oppRec.elo = roundElo(oppRec.elo - stolenAmount);
        spinnerRec.elo = roundElo(spinnerRec.elo + stolenAmount);
        const oppSock = getSocketByPid(wheel.opponentPid);
        if (oppSock) oppSock.emit('profile', profileOf(oppRec));
        broadcastLeaderboard();
      }
      summaryText = `${spinnerRec.name} cướp thành công ${stolenAmount} ELO từ ${oppRec.name}!`;
    } else {
      const bonus = 15;
      spinnerRec.elo = roundElo(spinnerRec.elo + bonus);
      stolenAmount = bonus;
      broadcastLeaderboard();
      summaryText = `${spinnerRec.name} nhận được +${bonus} ELO may mắn!`;
    }
  } else if (wheel.rewardType === 'guess_swap') {
    const cands = wheel.candidates || [];
    const maxElo = cands.length ? Math.max(...cands.map((c) => c.elo)) : 0;
    const chosen = cands.find((c) => c.id === chosenId) || cands[0] || null;
    const isCorrect = !!chosen && chosen.elo === maxElo;

    if (isCorrect && oppRec) {
      const oldSpinnerElo = spinnerRec.elo;
      const oldOppElo = oppRec.elo;
      spinnerRec.elo = oldOppElo;
      oppRec.elo = oldSpinnerElo;
      swapped = true;
      const oppSock = getSocketByPid(wheel.opponentPid);
      if (oppSock) oppSock.emit('profile', profileOf(oppRec));
      broadcastLeaderboard();
      summaryText = `${spinnerRec.name} đoán ĐÚNG người có Elo cao nhất và HOÁN ĐỔI Elo với ${oppRec.name}!`;
    } else if (isCorrect) {
      summaryText = `${spinnerRec.name} đoán ĐÚNG nhưng không có đối thủ hợp lệ để hoán đổi.`;
    } else {
      summaryText = `${spinnerRec.name} đoán SAI — không có hoán đổi Elo nào xảy ra.`;
    }

    guessResult = {
      chosenId: chosen ? chosen.id : null,
      chosenName: chosen ? chosen.name : '',
      timedOut: !!timedOut,
      isCorrect,
      maxElo,
      candidates: cands.map((c) => ({
        id: c.id,
        name: c.name,
        elo: c.elo,
        isBot: c.isBot,
        isHighest: c.elo === maxElo
      }))
    };
  } else if (wheel.itemId && ITEM_CATALOG[wheel.itemId]) {
    if (!spinnerRec.inventory) spinnerRec.inventory = createDefaultInventory();
    spinnerRec.inventory[wheel.itemId] = (spinnerRec.inventory[wheel.itemId] || 0) + 1;
    const itemMeta = ITEM_CATALOG[wheel.itemId];
    summaryText = `${spinnerRec.name} nhận được vật phẩm: ${itemMeta.icon} ${itemMeta.name}!`;
  }

  const spinnerSock = getSocketByPid(spinnerPid);
  if (spinnerSock) spinnerSock.emit('profile', profileOf(spinnerRec));

  const resumeInMs = wheel.rewardType === 'guess_swap' ? WHEEL_GUESS_RESULT_HOLD_MS : WHEEL_RESULT_HOLD_MS;
  const resultPayload = {
    mode: 'post_match',
    eventId,
    spinnerPid,
    spinnerName: spinnerRec.name,
    rewardType: wheel.rewardType,
    itemId: wheel.itemId || null,
    stolenAmount,
    swapped,
    newElo: spinnerRec.elo,
    pendingX2Buff: !!spinnerRec.pendingX2Buff,
    inventory: { ...(spinnerRec.inventory || {}) },
    guessResult,
    summaryText,
    resumeInMs
  };

  wheel.resultPayload = resultPayload;
  if (spinnerSock) spinnerSock.emit('lucky_wheel_result', resultPayload);

  wheel.completeTimer = setTimeout(() => {
    finishPostMatchLuckyWheel(spinnerPid, eventId);
  }, resumeInMs);
}

function finishPostMatchLuckyWheel(spinnerPid, eventId) {
  const wheel = pidToActiveWheel.get(spinnerPid);
  if (!wheel || wheel.eventId !== eventId) return;
  clearWheelTimers(wheel);
  pidToActiveWheel.delete(spinnerPid);

  const spinnerRec = recByPid(spinnerPid);
  const spinnerSock = getSocketByPid(spinnerPid);
  if (spinnerSock) {
    spinnerSock.emit('lucky_wheel_complete', {
      mode: 'post_match',
      eventId,
      newElo: spinnerRec ? spinnerRec.elo : START_ELO,
      pendingX2Buff: spinnerRec ? !!spinnerRec.pendingX2Buff : false,
      inventory: spinnerRec ? { ...(spinnerRec.inventory || {}) } : {}
    });
    if (spinnerRec) spinnerSock.emit('profile', profileOf(spinnerRec));
  }

  if (typeof wheel.onComplete === 'function') {
    wheel.onComplete();
  }
}

function startQuizSession(room, role, resultType, baseGain, baseLoss, eloBeforeMatch) {
  const pid = role === 0 ? room.p1Pid : room.p2Pid;
  const playerRec = recByPid(pid);
  if (!playerRec) return;

  const hasX2 = !!playerRec.pendingX2Buff;
  const hasShield = !!(room.matchEffects && room.matchEffects[role] && room.matchEffects[role].shield);
  const hasBet = !!(room.matchEffects && room.matchEffects[role] && room.matchEffects[role].bet);
  const eloBefore = eloBeforeMatch != null ? eloBeforeMatch : room.eloBefore[role];

  const socket = getRoomSocket(room, role);
  if (!socket || !socket.connected) {
    if (resultType === 'win') {
      const betMult = hasBet ? BET_MULTIPLIER : 1;
      const x2Mult = hasX2 ? 2 : 1;
      const totalGain = roundElo(baseGain * betMult * x2Mult);
      playerRec.elo = roundElo(playerRec.elo + totalGain);
      playerRec.wins++;
      playerRec.games++;
    } else {
      if (!hasShield) {
        const betMult = hasBet ? BET_MULTIPLIER : 1;
        playerRec.elo = roundElo(playerRec.elo - roundElo(baseLoss * betMult));
      }
      playerRec.games++;
    }
    if (hasX2) playerRec.pendingX2Buff = false;
    broadcastLeaderboard();
    return;
  }

  const shuffled = [...questionsBank].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map((q) => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));
  const sessionId = crypto.randomBytes(16).toString('hex');

  quizSessions[sessionId] = {
    socketId: socket.id,
    pid,
    role,
    questions: selected,
    answeredIndices: new Set(),
    currentIndex: 0,
    correctCount: 0,
    resultType,
    baseGain,
    baseLoss,
    hasX2,
    hasShield,
    hasBet,
    eloBefore,
    completed: false
  };

  socket.emit('quiz_start', {
    sessionId,
    resultType,
    total: 3,
    hasX2,
    hasShield,
    hasBet,
    winMultiplier: QUIZ_WIN_MULTIPLIER,
    betMultiplier: BET_MULTIPLIER,
    currentQuestion: { index: 1, ...selected[0] }
  });
}

function recordPlayerMatchCompletion(pid, roomId) {
  const rec = recByPid(pid);
  if (!rec || !roomId) {
    return { counted: false, completedMatches: 0, wheelProgress: 0, triggeredWheel: false };
  }
  if (!rec.countedRooms) rec.countedRooms = new Set();

  if (rec.countedRooms.has(roomId)) {
    return {
      counted: false,
      completedMatches: rec.completedMatches,
      wheelProgress: rec.wheelProgress,
      triggeredWheel: false
    };
  }

  rec.countedRooms.add(roomId);
  rec.completedMatches = (rec.completedMatches || 0) + 1;
  rec.wheelProgress = (rec.wheelProgress || 0) + 1;

  let triggeredWheel = false;
  if (rec.wheelProgress >= WHEEL_MATCH_STEP) {
    triggeredWheel = true;
    rec.wheelProgress = 0;
  }

  return {
    counted: true,
    completedMatches: rec.completedMatches,
    wheelProgress: rec.wheelProgress,
    triggeredWheel
  };
}

function finishRoom(room, winnerRole, reason = 'nomoves') {
  if (!room || room.finished) return;
  room.finished = true;
  room.paused = false;
  if (room.inMatchWheel && room.inMatchWheel.timer) {
    clearTimeout(room.inMatchWheel.timer);
    room.inMatchWheel = null;
  }
  clearDisconnectTimers(room);

  const W = getRoomRec(room, winnerRole);
  const L = getRoomRec(room, winnerRole ^ 1);

  io.to(room.id).emit('match_ended', { winner: winnerRole, reason });

  if (W && L) {
    const expected = 1 / (1 + Math.pow(10, (L.elo - W.elo) / 400));
    const baseGain = Math.max(1, Math.round(K_FACTOR * (1 - expected)));
    const newL = Math.max(0, L.elo - baseGain);
    const baseLoss = Number((L.elo - newL).toFixed(1));

    const roles = [winnerRole, winnerRole ^ 1];
    roles.forEach((role) => {
      const pid = role === 0 ? room.p1Pid : room.p2Pid;
      const oppPid = role === 0 ? room.p2Pid : room.p1Pid;
      const resultType = role === winnerRole ? 'win' : 'loss';
      const eloBefore = room.eloBefore[role];

      const status = recordPlayerMatchCompletion(pid, room.id);
      const playerRec = recByPid(pid);
      const sock = getRoomSocket(room, role);
      if (sock && playerRec) {
        sock.emit('profile', profileOf(playerRec));
        sock.emit('match_progress_update', {
          completedMatches: status.completedMatches,
          wheelProgress: status.wheelProgress,
          wheelStep: WHEEL_MATCH_STEP,
          triggeredWheel: status.triggeredWheel
        });
      }

      if (status.triggeredWheel) {
        triggerPostMatchLuckyWheel(pid, oppPid, status.completedMatches, () => {
          startQuizSession(room, role, resultType, baseGain, baseLoss, eloBefore);
        });
      } else {
        startQuizSession(room, role, resultType, baseGain, baseLoss, eloBefore);
      }
    });
  }

  if (pidToRoom.get(room.p1Pid) === room.id) pidToRoom.delete(room.p1Pid);
  if (pidToRoom.get(room.p2Pid) === room.id) pidToRoom.delete(room.p2Pid);
  roomsById.delete(room.id);
}

function leaveRoom(socket, immediate = true) {
  const room = rooms[socket.id];
  if (!room) return;
  const role = getRoomRole(room, socket.id);
  if (role < 0) return;

  if (immediate || room.finished) {
    if (!room.finished) {
      socket.to(room.id).emit('opponent_left');
      finishRoom(room, role ^ 1, 'forfeit');
    }
    delete rooms[room.p1];
    delete rooms[room.p2];
    socket.leave(room.id);
    return;
  }

  room.disconnected[role] = true;
  if (room.disconnectTimers[role]) clearTimeout(room.disconnectTimers[role]);
  room.disconnectTimers[role] = setTimeout(() => {
    if (!room || room.finished || !room.disconnected[role]) return;
    const oppSock = getRoomSocket(room, role ^ 1);
    if (oppSock) oppSock.emit('opponent_left');
    finishRoom(room, role ^ 1, 'forfeit');
    cleanupRoomRefs(room);
  }, RECONNECT_GRACE_MS);
}

function tryReconnectPlayer(socket, pid) {
  const activeWheel = pidToActiveWheel.get(pid);
  if (activeWheel) {
    socket.emit('lucky_wheel_start', {
      mode: 'post_match',
      eventId: activeWheel.eventId,
      spinnerPid: activeWheel.spinnerPid,
      spinnerName: activeWheel.spinnerName,
      matchNumber: activeWheel.matchNumber,
      milestone: activeWheel.matchNumber,
      segments: WHEEL_SEGMENTS,
      targetIndex: activeWheel.targetIndex,
      rewardType: activeWheel.rewardType,
      candidates: activeWheel.publicCandidates,
      startedAt: activeWheel.startedAt,
      spinDurationMs: activeWheel.spinDurationMs,
      guessTimeoutMs: activeWheel.guessTimeoutMs,
      guessRemainingMs: activeWheel.guessDeadlineAt ? Math.max(0, activeWheel.guessDeadlineAt - Date.now()) : 0
    });
    if (activeWheel.processed && activeWheel.resultPayload) {
      socket.emit('lucky_wheel_result', activeWheel.resultPayload);
    }
  }

  const roomId = pidToRoom.get(pid);
  if (!roomId) return false;
  const room = roomsById.get(roomId);
  if (!room || room.finished) {
    pidToRoom.delete(pid);
    return false;
  }

  const role = room.p1Pid === pid ? 0 : (room.p2Pid === pid ? 1 : -1);
  if (role < 0) return false;

  const oldSocketId = role === 0 ? room.p1 : room.p2;
  if (oldSocketId && rooms[oldSocketId] === room) delete rooms[oldSocketId];

  if (role === 0) room.p1 = socket.id;
  else room.p2 = socket.id;

  rooms[socket.id] = room;
  room.disconnected[role] = false;
  if (room.disconnectTimers[role]) {
    clearTimeout(room.disconnectTimers[role]);
    room.disconnectTimers[role] = null;
  }

  socket.join(room.id);

  const r1 = getRoomRec(room, 0);
  const r2 = getRoomRec(room, 1);

  socket.emit('match_sync', {
    roomId: room.id,
    role,
    spots: room.initialSpots,
    turn: room.currentTurn,
    tm: room.tm,
    p1Name: r1 ? r1.name : room.p1Name,
    p2Name: r2 ? r2.name : room.p2Name,
    elo: [r1 ? r1.elo : START_ELO, r2 ? r2.elo : START_ELO],
    moveCount: room.moveCount,
    extraTurns: room.extraTurns || [0, 0],
    paused: !!room.paused,
    buffs: {
      0: { x2: !!(r1 && r1.pendingX2Buff) },
      1: { x2: !!(r2 && r2.pendingX2Buff) }
    },
    matchEffects: room.matchEffects,
    lastStatePacket: room.lastStatePacket
  });

  return true;
}

io.on('connection', (socket) => {
  socket.emit('leaderboard_update', getLeaderboard());
  socket.emit('stats_update', getSystemStats());

  socket.on('set_name', (data) => {
    const rec = identify(socket, data);
    socket.emit('profile', profileOf(rec));
    broadcastLeaderboard();
    broadcastSystemStats();

    const u = users[socket.id];
    if (u && u.pid) {
      tryReconnectPlayer(socket, u.pid);
    }
  });

  socket.on('find_match', (data) => {
    const rec = identify(socket, data);
    socket.emit('profile', profileOf(rec));
    broadcastSystemStats();

    const u = users[socket.id];
    if (u && tryReconnectPlayer(socket, u.pid)) return;

    let nodeCount = 3;
    if (data && ALLOWED_NODE_COUNTS.includes(Number(data.nodes))) {
      nodeCount = Number(data.nodes);
    }

    if (waitingPlayer && waitingPlayer.id === socket.id) return;
    if (waitingPlayer && !waitingPlayer.connected) waitingPlayer = null;

    if (waitingPlayer) {
      const p1 = waitingPlayer, p2 = socket;
      waitingPlayer = null;
      const roomId = 'room_' + p1.id + '_' + p2.id + '_' + crypto.randomBytes(3).toString('hex');
      p1.join(roomId); p2.join(roomId);

      const p1Pid = users[p1.id] ? users[p1.id].pid : 'anon_' + p1.id;
      const p2Pid = users[p2.id] ? users[p2.id].pid : 'anon_' + p2.id;
      const r1 = recOf(p1.id), r2 = recOf(p2.id);
      const initialSpots = generateSpots(nodeCount);
      const firstTurn = Math.random() < 0.5 ? 0 : 1;

      const room = {
        id: roomId,
        p1: p1.id,
        p2: p2.id,
        p1Pid,
        p2Pid,
        p1Name: r1.name,
        p2Name: r2.name,
        tm: MATCH_MINUTES,
        initialSpots,
        currentTurn: firstTurn,
        moveCount: 0,
        extraTurns: [0, 0],
        lastSpotsCount: initialSpots.length,
        lastLinesCount: 0,
        lastStatePacket: null,
        paused: false,
        finished: false,
        inMatchWheel: null,
        buffs: {
          0: { x2: !!r1.pendingX2Buff },
          1: { x2: !!r2.pendingX2Buff }
        },
        matchEffects: {
          0: { shield: false, bet: false },
          1: { shield: false, bet: false }
        },
        eloBefore: [r1.elo, r2.elo],
        disconnected: { 0: false, 1: false },
        disconnectTimers: { 0: null, 1: null }
      };

      rooms[p1.id] = room;
      rooms[p2.id] = room;
      roomsById.set(roomId, room);
      pidToRoom.set(p1Pid, roomId);
      pidToRoom.set(p2Pid, roomId);

      const matchData = {
        roomId,
        spots: initialSpots,
        turn: firstTurn,
        tm: MATCH_MINUTES,
        p1Name: r1.name,
        p2Name: r2.name,
        elo: [r1.elo, r2.elo],
        buffs: room.buffs,
        matchEffects: room.matchEffects
      };
      p1.emit('match_start', { ...matchData, role: 0 });
      p2.emit('match_start', { ...matchData, role: 1 });
    } else {
      waitingPlayer = socket;
      socket.emit('waiting_for_match');
    }
  });

  socket.on('cancel_match', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
  });

  socket.on('leave_match', () => leaveRoom(socket, true));

  // Sử dụng vật phẩm trực tiếp trong trận đấu
  socket.on('use_item', (data) => {
    const room = rooms[socket.id];
    if (!room || room.finished || room.paused || !data || typeof data !== 'object') return;
    const role = getRoomRole(room, socket.id);
    if (role < 0) return;

    const itemId = String(data.itemId || '');
    const meta = ITEM_CATALOG[itemId];
    if (!meta) {
      socket.emit('item_error', { message: 'Vật phẩm không tồn tại.' });
      return;
    }

    const playerRec = getRoomRec(room, role);
    if (!playerRec || !playerRec.inventory || (playerRec.inventory[itemId] || 0) <= 0) {
      socket.emit('item_error', { message: 'Bạn không còn vật phẩm này trong túi.' });
      return;
    }

    // Kiểm tra điều kiện hợp lệ theo từng loại item
    if (itemId === 'shield') {
      if (room.matchEffects[role].shield) {
        socket.emit('item_error', { message: 'Khiên Elo đã được kích hoạt trong trận này.' });
        return;
      }
      playerRec.inventory.shield -= 1;
      room.matchEffects[role].shield = true;
      socket.emit('profile', profileOf(playerRec));
      io.to(room.id).emit('item_used', {
        role,
        playerName: playerRec.name,
        itemId,
        itemName: meta.name,
        icon: meta.icon,
        matchEffects: room.matchEffects,
        summaryText: `${playerRec.name} kích hoạt ${meta.icon} ${meta.name} — miễn nhiễm trừ Elo nếu thua!`
      });
      return;
    }

    if (itemId === 'bet') {
      if (room.moveCount > 2) {
        socket.emit('item_error', { message: 'Item Đặt cược Elo chỉ dùng được ở đầu trận (2 lượt đầu).' });
        return;
      }
      if (room.matchEffects[role].bet) {
        socket.emit('item_error', { message: 'Bạn đã kích hoạt Cược Elo trong trận này rồi.' });
        return;
      }
      playerRec.inventory.bet -= 1;
      room.matchEffects[role].bet = true;
      socket.emit('profile', profileOf(playerRec));
      io.to(room.id).emit('item_used', {
        role,
        playerName: playerRec.name,
        itemId,
        itemName: meta.name,
        icon: meta.icon,
        matchEffects: room.matchEffects,
        summaryText: `${playerRec.name} đặt cược ${meta.icon} x${BET_MULTIPLIER} Elo cho trận đấu này!`
      });
      return;
    }

    if (itemId === 'add_spot' || itemId === 'cut_edges') {
      if (role !== room.currentTurn) {
        socket.emit('item_error', { message: 'Chỉ dùng được vật phẩm tác động bàn cờ khi đang tới lượt của bạn.' });
        return;
      }
      if (itemId === 'cut_edges' && room.lastLinesCount < 2) {
        socket.emit('item_error', { message: 'Chưa có đường nối nào trên bàn cờ để cắt.' });
        return;
      }

      playerRec.inventory[itemId] -= 1;
      if (itemId === 'add_spot') room.lastSpotsCount += 1;
      if (itemId === 'cut_edges') room.lastLinesCount = Math.max(0, room.lastLinesCount - 2);

      socket.emit('profile', profileOf(playerRec));
      io.to(room.id).emit('item_used', {
        role,
        playerName: playerRec.name,
        itemId,
        itemName: meta.name,
        icon: meta.icon,
        connections: ITEM_ADD_SPOT_CONNECTIONS,
        cutCount: ITEM_CUT_EDGES_COUNT,
        matchEffects: room.matchEffects,
        summaryText: itemId === 'add_spot'
          ? `${playerRec.name} dùng ${meta.icon} Thêm 1 điểm nối (gồm ${ITEM_ADD_SPOT_CONNECTIONS} kết nối sẵn có)!`
          : `${playerRec.name} dùng ${meta.icon} Cắt đứt ngẫu nhiên 1 cặp đường nối trên bàn cờ!`
      });
      return;
    }

    if (itemId === 'risk_wheel') {
      if (role !== room.currentTurn) {
        socket.emit('item_error', { message: 'Chỉ dùng được Vòng quay may rủi khi đang tới lượt của bạn.' });
        return;
      }
      playerRec.inventory.risk_wheel -= 1;
      socket.emit('profile', profileOf(playerRec));

      room.paused = true;
      const targetIndex = Math.floor(Math.random() * IN_MATCH_RISK_SEGMENTS.length);
      const outcome = IN_MATCH_RISK_SEGMENTS[targetIndex];
      const eventId = 'rw_' + crypto.randomBytes(6).toString('hex');

      io.to(room.id).emit('risk_wheel_start', {
        eventId,
        role,
        playerName: playerRec.name,
        segments: IN_MATCH_RISK_SEGMENTS,
        targetIndex,
        outcomeType: outcome.type,
        spinDurationMs: 2800
      });

      const timer = setTimeout(() => {
        if (!room || room.finished) return;
        room.paused = false;
        room.inMatchWheel = null;

        let nextTurn = room.currentTurn;
        let effectSummary = '';

        if (outcome.type === 'lose_turn') {
          room.extraTurns[role] = 0;
          nextTurn = role ^ 1;
          room.currentTurn = nextTurn;
          effectSummary = `⏭️ ${playerRec.name} quay trúng MẤT LƯỢT NỐI! Lượt chuyển sang đối thủ.`;
        } else if (outcome.type === 'double_turn') {
          room.extraTurns[role] = 1; // Sau nước đi hiện tại sẽ được đi thêm 1 nước nữa
          nextTurn = role;
          effectSummary = `⚡ ${playerRec.name} quay trúng ĐƯỢC 2 LƯỢT NỐI LIÊN TIẾP!`;
        } else if (outcome.type === 'swap_nodes') {
          effectSummary = `🔄 ${playerRec.name} quay trúng HOÁN ĐỔI VỊ TRÍ 2 NÚT BẤT KỲ trên bàn cờ!`;
        } else if (outcome.type === 'spawn_node') {
          room.lastSpotsCount += 1;
          effectSummary = `➕ ${playerRec.name} quay trúng THÊM 1 ĐIỂM NỐI MỚI (${ITEM_ADD_SPOT_CONNECTIONS} kết nối)!`;
        } else if (outcome.type === 'cut_random') {
          if (room.lastLinesCount >= 2) {
            room.lastLinesCount = Math.max(0, room.lastLinesCount - 2);
            effectSummary = `✂️ ${playerRec.name} quay trúng MẤT NGẪU NHIÊN 1 CẶP ĐƯỜNG NỐI trên bàn!`;
          } else {
            effectSummary = `✂️ ${playerRec.name} quay trúng CẮT ĐƯỜNG nhưng bàn cờ chưa có đường nào!`;
          }
        } else if (outcome.type === 'bonus_time') {
          effectSummary = `⏳ ${playerRec.name} quay trúng +30 GIÂY vào đồng hồ thi đấu!`;
        }

        io.to(room.id).emit('risk_wheel_complete', {
          eventId,
          role,
          playerName: playerRec.name,
          outcomeType: outcome.type,
          nextTurn,
          extraTurns: room.extraTurns,
          summaryText: effectSummary
        });
      }, 3300);

      room.inMatchWheel = { eventId, timer };
    }
  });

  socket.on('game_action', (msg) => {
    const room = rooms[socket.id];
    if (!room || !msg || typeof msg !== 'object') return;
    if (room.finished) return;

    const senderRole = getRoomRole(room, socket.id);
    if (senderRole < 0) return;

    if (room.paused) {
      socket.emit('item_error', { message: 'Vòng quay may rủi đang diễn ra, tạm khóa thao tác.' });
      return;
    }

    if (msg.t === 'resign') {
      socket.to(room.id).emit('game_action', { t: 'resign', i: senderRole });
      finishRoom(room, senderRole ^ 1, 'resign');
      return;
    }

    // Đồng bộ bàn cờ sau khi item tác động (thêm nút, cắt đường, hoán đổi nút, cộng giờ)
    if (msg.t === 'item_board_sync' && typeof msg.s === 'string') {
      try {
        const parsed = JSON.parse(msg.s);
        if (parsed && Array.isArray(parsed.spots) && Array.isArray(parsed.lines)) {
          room.lastSpotsCount = parsed.spots.length;
          room.lastLinesCount = parsed.lines.length;
          room.lastStatePacket = msg.s;
          socket.to(room.id).emit('game_action', msg);
        }
      } catch (e) {}
      return;
    }

    if (msg.t === 'state' && typeof msg.s === 'string') {
      let parsed = null;
      try {
        parsed = JSON.parse(msg.s);
      } catch (e) {
        return;
      }
      if (!parsed || !Array.isArray(parsed.spots) || !Array.isArray(parsed.lines)) return;

      if (!msg.lot) {
        if (senderRole !== room.currentTurn) return;
        const isValidNewCommit =
          parsed.spots.length === room.lastSpotsCount + 1 &&
          parsed.lines.length === room.lastLinesCount + 2;

        if (!isValidNewCommit) {
          return;
        }

        room.lastSpotsCount = parsed.spots.length;
        room.lastLinesCount = parsed.lines.length;
        room.moveCount += 1;

        // Xử lý nếu người chơi đang có lượt đi liên tiếp từ Vòng quay may rủi
        if (room.extraTurns && room.extraTurns[senderRole] > 0) {
          room.extraTurns[senderRole] -= 1;
          room.currentTurn = senderRole;
          parsed.turn = senderRole;
        } else {
          room.currentTurn = senderRole ^ 1;
          parsed.turn = room.currentTurn;
        }

        const updatedStateStr = JSON.stringify(parsed);
        room.lastStatePacket = updatedStateStr;

        io.to(room.id).emit('game_action', {
          t: 'state',
          s: updatedStateStr,
          actor: senderRole,
          nextTurn: room.currentTurn,
          extraTurnUsed: room.currentTurn === senderRole
        });
        return;
      }
    }

    socket.to(room.id).emit('game_action', msg);
  });

  socket.on('lucky_wheel_guess', (data) => {
    const u = users[socket.id];
    const pid = u ? u.pid : null;
    const wheel = pid ? pidToActiveWheel.get(pid) : null;

    if (!wheel) {
      socket.emit('lucky_wheel_error', { message: 'Không có sự kiện vòng quay đang hoạt động.' });
      return;
    }
    if (!data || typeof data !== 'object' || data.eventId !== wheel.eventId) {
      socket.emit('lucky_wheel_error', { message: 'Mã sự kiện vòng quay không hợp lệ.' });
      return;
    }
    if (wheel.rewardType !== 'guess_swap') {
      socket.emit('lucky_wheel_error', { message: 'Phần thưởng hiện tại không yêu cầu dự đoán.' });
      return;
    }
    if (wheel.processed || wheel.guessSubmitted) {
      socket.emit('lucky_wheel_error', { message: 'Lựa chọn đã được ghi nhận trước đó.' });
      return;
    }
    if (wheel.guessDeadlineAt && Date.now() > wheel.guessDeadlineAt + 500) {
      socket.emit('lucky_wheel_error', { message: 'Đã hết thời gian lựa chọn.' });
      return;
    }

    const candidateId = String(data.candidateId || '');
    const validCandidate = (wheel.candidates || []).some((c) => c.id === candidateId);
    if (!validCandidate) {
      socket.emit('lucky_wheel_error', { message: 'Ứng viên không nằm trong danh sách hợp lệ.' });
      return;
    }

    wheel.guessSubmitted = true;
    wheel.chosenId = candidateId;
    resolvePostMatchLuckyWheel(pid, wheel.eventId, candidateId, false);
  });

  socket.on('game_over', (data) => {
    const room = rooms[socket.id];
    if (!room || room.finished || !data) return;
    const winner = data.winner === 0 || data.winner === 1 ? data.winner : null;
    if (winner !== null) {
      const reason = ['nomoves', 'timeout', 'resign', 'forfeit'].includes(data.reason) ? data.reason : 'nomoves';
      finishRoom(room, winner, reason);
    }
  });

  socket.on('submit_quiz_answer', (data) => {
    if (!data || !data.sessionId || !data.selectedAnswer) return;
    const session = quizSessions[data.sessionId];
    if (!session || session.completed || session.socketId !== socket.id) return;

    const qIdx = session.currentIndex;
    if (qIdx >= 3 || session.answeredIndices.has(qIdx)) return;
    session.answeredIndices.add(qIdx);

    const currentQData = session.questions[qIdx];
    const originalQ = questionsBank.find((q) => q.id === currentQData.id);

    const userAns = String(data.selectedAnswer).trim().toUpperCase();
    if (!['A', 'B', 'C', 'D'].includes(userAns)) {
      session.answeredIndices.delete(qIdx);
      return;
    }

    const correctAns = originalQ ? String(originalQ.correctAnswer).trim().toUpperCase() : 'B';
    const correctText = (originalQ && originalQ.options && originalQ.options[correctAns]) ? originalQ.options[correctAns] : '';
    const isCorrect = userAns === correctAns;

    if (isCorrect) session.correctCount++;
    session.currentIndex++;

    const rawExp = originalQ && typeof originalQ.explanation === 'string' ? originalQ.explanation.trim() : '';
    const explanation = rawExp || (isCorrect
      ? `Chính xác! Đáp án đúng là ${correctAns}: "${correctText}".`
      : `Chưa chính xác. Đáp án đúng là ${correctAns}: "${correctText}".`);

    socket.emit('quiz_answer_feedback', {
      correct: isCorrect,
      correctKey: correctAns,
      correctText,
      selectedKey: userAns,
      explanation,
      correctCount: session.correctCount,
      answeredIndex: qIdx + 1,
      total: 3
    });

    setTimeout(() => {
      if (!session || session.completed) return;
      if (session.currentIndex < 3) {
        const nextQ = session.questions[session.currentIndex];
        socket.emit('quiz_answer_result', {
          correct: isCorrect,
          nextQuestion: { index: session.currentIndex + 1, ...nextQ }
        });
      } else {
        session.completed = true;
        const playerRec = recByPid(session.pid);
        if (!playerRec) {
          delete quizSessions[data.sessionId];
          return;
        }

        let matchResultDelta = 0;
        let quizBonus = 0;
        let betDelta = 0;
        let x2Bonus = 0;
        let shieldSaved = 0;
        let endOfMatchDelta = 0;

        if (session.resultType === 'win') {
          matchResultDelta = session.baseGain;
          // Đúng 3/3 câu khi thắng: nhân hệ số X (QUIZ_WIN_MULTIPLIER = 2.5x)
          const multipliedWin = session.correctCount === 3
            ? roundElo(session.baseGain * QUIZ_WIN_MULTIPLIER)
            : session.baseGain;
          quizBonus = Number((multipliedWin - matchResultDelta).toFixed(1));

          // Item Đặt cược Elo (thắng nhân hệ số BET_MULTIPLIER)
          const afterBet = session.hasBet ? roundElo(multipliedWin * BET_MULTIPLIER) : multipliedWin;
          betDelta = Number((afterBet - multipliedWin).toFixed(1));

          // Buff x2 ELO từ Vòng quay may mắn
          x2Bonus = session.hasX2 && afterBet > 0 ? afterBet : 0;
          endOfMatchDelta = Number((afterBet + x2Bonus).toFixed(1));

          playerRec.elo = roundElo(playerRec.elo + endOfMatchDelta);
          playerRec.wins++;
          playerRec.games++;
        } else {
          // Thua trận:
          // - Nếu dùng Khiên Elo -> Không mất Elo (0)
          // - Nếu trả lời đúng 3/3 -> Chỉ bị trừ 50% số điểm
          // - Nếu dùng Cược Elo -> Nhân hệ số X số điểm bị trừ
          const rawLoss = session.baseLoss;
          const afterQuizLoss = session.correctCount === 3 ? roundElo(rawLoss * 0.5) : rawLoss;
          const afterBetLoss = session.hasBet ? roundElo(afterQuizLoss * BET_MULTIPLIER) : afterQuizLoss;

          matchResultDelta = -rawLoss;
          quizBonus = Number((rawLoss - afterQuizLoss).toFixed(1));
          betDelta = Number((afterQuizLoss - afterBetLoss).toFixed(1));

          if (session.hasShield) {
            shieldSaved = afterBetLoss;
            endOfMatchDelta = 0;
          } else {
            endOfMatchDelta = -afterBetLoss;
          }

          x2Bonus = 0;
          playerRec.elo = roundElo(playerRec.elo + endOfMatchDelta);
          playerRec.games++;
        }

        if (session.hasX2) {
          playerRec.pendingX2Buff = false;
        }

        const wheelTotal = Number((playerRec.elo - session.eloBefore - endOfMatchDelta).toFixed(1));
        const finalEloChange = Number((playerRec.elo - session.eloBefore).toFixed(1));

        socket.emit('quiz_completed', {
          correctCount: session.correctCount,
          finalEloDelta: endOfMatchDelta,
          newElo: playerRec.elo,
          breakdown: {
            eloBefore: session.eloBefore,
            matchResult: matchResultDelta,
            quizBonus,
            betDelta,
            shieldSaved,
            luckyWheelBonus: x2Bonus,
            stealSwapTotal: wheelTotal,
            finalEloChange,
            eloAfter: playerRec.elo
          }
        });
        socket.emit('profile', profileOf(playerRec));
        broadcastLeaderboard();
        delete quizSessions[data.sessionId];
      }
    }, 600);
  });

  socket.on('disconnect', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
    leaveRoom(socket, false);
    delete users[socket.id];
    broadcastLeaderboard();
    broadcastSystemStats();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
