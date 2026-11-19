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
const WHEEL_MILESTONE_STEP = 3;
const WHEEL_SPIN_DURATION_MS = 3600;
const GUESS_TIMEOUT = 10000;
const WHEEL_RESULT_HOLD_MS = 2400;
const WHEEL_GUESS_RESULT_HOLD_MS = 3200;
const RECONNECT_GRACE_MS = 12000;

const WHEEL_SEGMENTS = [
  { type: 'x2', label: 'x2 ELO', short: 'x2', color: '#f59f00' },
  { type: 'steal', label: 'Cướp 5% ELO', short: 'STEAL 5%', color: '#e03131' },
  { type: 'guess_swap', label: 'Đoán Elo · Swap', short: 'SWAP', color: '#7950f2' },
  { type: 'x2', label: 'x2 ELO', short: 'x2', color: '#f08c00' },
  { type: 'steal', label: 'Cướp 5% ELO', short: 'STEAL 5%', color: '#c92a2a' },
  { type: 'guess_swap', label: 'Đoán Elo · Swap', short: 'SWAP', color: '#6741d9' }
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

const ratings = new Map();
const usernames = new Map();
let waitingPlayer = null;
let rooms = {};          // socketId -> room
const roomsById = new Map(); // roomId -> room
const pidToRoom = new Map(); // pid -> roomId (for active match reconnect)
let users = {};          // socketId -> { pid }
let quizSessions = {};   // sessionId -> session

const cleanName = (x) => String(x == null ? '' : x).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);
const roundElo = (v) => Math.max(0, Number(Number(v).toFixed(1)));

function isUsernameTaken(name, currentPid) {
  const norm = name.toLowerCase();
  return usernames.has(norm) && usernames.get(norm) !== currentPid;
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
    rec = { pub: crypto.randomBytes(4).toString('hex'), name: baseName, elo: START_ELO, games: 0, wins: 0 };
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
const profileOf = (rec) => ({ pub: rec.pub, name: rec.name, elo: rec.elo, games: rec.games });

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
  return sid ? io.sockets.sockets.get(sid) : null;
}

function getRoomRec(room, role) {
  return recByPid(role === 0 ? room.p1Pid : room.p2Pid);
}

function clearWheelTimers(room) {
  if (!room || !room.activeWheel) return;
  if (room.activeWheel.resolveTimer) clearTimeout(room.activeWheel.resolveTimer);
  if (room.activeWheel.completeTimer) clearTimeout(room.activeWheel.completeTimer);
  room.activeWheel.resolveTimer = null;
  room.activeWheel.completeTimer = null;
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
  clearWheelTimers(room);
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

function triggerLuckyWheel(room, spinnerRole, milestone) {
  if (!room || room.finished || room.paused) return;
  if (room.triggeredMilestones.has(milestone)) return;

  const spinnerRec = getRoomRec(room, spinnerRole);
  if (!spinnerRec) return;

  room.triggeredMilestones.add(milestone);
  room.paused = true;

  const targetIndex = Math.floor(Math.random() * WHEEL_SEGMENTS.length);
  const selectedSeg = WHEEL_SEGMENTS[targetIndex];
  const rewardType = selectedSeg.type;
  const eventId = 'lw_' + crypto.randomBytes(8).toString('hex');

  let candidates = null;
  let publicCandidates = null;
  if (rewardType === 'guess_swap') {
    const spinnerPid = spinnerRole === 0 ? room.p1Pid : room.p2Pid;
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
    matchId: room.id,
    spinnerRole,
    spinnerName: spinnerRec.name,
    milestone,
    targetIndex,
    rewardType,
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
    completeTimer: null
  };

  room.activeWheel = wheelState;

  io.to(room.id).emit('lucky_wheel_start', {
    matchId: room.id,
    eventId,
    spinnerRole,
    spinnerName: spinnerRec.name,
    milestone,
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
      if (!room.activeWheel || room.activeWheel.eventId !== eventId || room.activeWheel.processed) return;
      const randomPick = candidates[Math.floor(Math.random() * candidates.length)];
      resolveLuckyWheel(room, eventId, randomPick ? randomPick.id : null, true);
    }, WHEEL_SPIN_DURATION_MS + GUESS_TIMEOUT);
  } else {
    wheelState.resolveTimer = setTimeout(() => {
      resolveLuckyWheel(room, eventId, null, false);
    }, WHEEL_SPIN_DURATION_MS);
  }
}

function resolveLuckyWheel(room, eventId, chosenId, timedOut) {
  if (!room || room.finished || !room.activeWheel) return;
  const wheel = room.activeWheel;
  if (wheel.eventId !== eventId || wheel.processed) return;

  wheel.processed = true;
  if (wheel.resolveTimer) {
    clearTimeout(wheel.resolveTimer);
    wheel.resolveTimer = null;
  }

  const spinnerRole = wheel.spinnerRole;
  const oppRole = spinnerRole ^ 1;
  const spinnerRec = getRoomRec(room, spinnerRole);
  const oppRec = getRoomRec(room, oppRole);
  if (!spinnerRec || !oppRec) {
    finishLuckyWheel(room, eventId);
    return;
  }

  let stolenAmount = 0;
  let swapped = false;
  let eloDeltas = [0, 0];
  let guessResult = null;
  let summaryText = '';

  if (wheel.rewardType === 'x2') {
    room.buffs[spinnerRole].x2 = true;
    summaryText = `${spinnerRec.name} nhận buff x2 ELO cho phần thưởng dương cuối trận!`;
  } else if (wheel.rewardType === 'steal') {
    const rawStolen = Math.max(1, Math.round(oppRec.elo * 0.05));
    stolenAmount = Math.min(rawStolen, oppRec.elo);
    if (stolenAmount > 0) {
      oppRec.elo = roundElo(oppRec.elo - stolenAmount);
      spinnerRec.elo = roundElo(spinnerRec.elo + stolenAmount);
      room.eloLedger[spinnerRole].stolen = Number((room.eloLedger[spinnerRole].stolen + stolenAmount).toFixed(1));
      room.eloLedger[oppRole].stolen = Number((room.eloLedger[oppRole].stolen - stolenAmount).toFixed(1));
      eloDeltas[spinnerRole] = stolenAmount;
      eloDeltas[oppRole] = -stolenAmount;
      syncProfilesAndLeaderboard(room);
    }
    summaryText = `${spinnerRec.name} cướp thành công ${stolenAmount} ELO từ ${oppRec.name}!`;
  } else if (wheel.rewardType === 'guess_swap') {
    const cands = wheel.candidates || [];
    const maxElo = cands.length ? Math.max(...cands.map((c) => c.elo)) : 0;
    const chosen = cands.find((c) => c.id === chosenId) || cands[0] || null;
    const isCorrect = !!chosen && chosen.elo === maxElo;

    if (isCorrect && !oppRec.isBot) {
      const oldSpinnerElo = spinnerRec.elo;
      const oldOppElo = oppRec.elo;
      spinnerRec.elo = oldOppElo;
      oppRec.elo = oldSpinnerElo;
      const sDelta = Number((oldOppElo - oldSpinnerElo).toFixed(1));
      const oDelta = Number((oldSpinnerElo - oldOppElo).toFixed(1));
      room.eloLedger[spinnerRole].swap = Number((room.eloLedger[spinnerRole].swap + sDelta).toFixed(1));
      room.eloLedger[oppRole].swap = Number((room.eloLedger[oppRole].swap + oDelta).toFixed(1));
      eloDeltas[spinnerRole] = sDelta;
      eloDeltas[oppRole] = oDelta;
      swapped = true;
      syncProfilesAndLeaderboard(room);
      summaryText = `${spinnerRec.name} đoán ĐÚNG người có Elo cao nhất và HOÁN ĐỔI Elo với ${oppRec.name}!`;
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
  }

  const r1 = getRoomRec(room, 0);
  const r2 = getRoomRec(room, 1);
  const resumeInMs = wheel.rewardType === 'guess_swap' ? WHEEL_GUESS_RESULT_HOLD_MS : WHEEL_RESULT_HOLD_MS;

  const resultPayload = {
    matchId: room.id,
    eventId,
    spinnerRole,
    spinnerName: spinnerRec.name,
    rewardType: wheel.rewardType,
    stolenAmount,
    swapped,
    eloDeltas,
    buffs: {
      0: { ...room.buffs[0] },
      1: { ...room.buffs[1] }
    },
    elo: [r1 ? r1.elo : START_ELO, r2 ? r2.elo : START_ELO],
    guessResult,
    summaryText,
    resumeInMs
  };

  wheel.resultPayload = resultPayload;
  io.to(room.id).emit('lucky_wheel_result', resultPayload);

  wheel.completeTimer = setTimeout(() => {
    finishLuckyWheel(room, eventId);
  }, resumeInMs);
}

function finishLuckyWheel(room, eventId) {
  if (!room || !room.activeWheel || room.activeWheel.eventId !== eventId) return;
  clearWheelTimers(room);
  room.activeWheel = null;
  room.paused = false;

  const r1 = getRoomRec(room, 0);
  const r2 = getRoomRec(room, 1);
  io.to(room.id).emit('lucky_wheel_complete', {
    matchId: room.id,
    eventId,
    paused: false,
    elo: [r1 ? r1.elo : START_ELO, r2 ? r2.elo : START_ELO],
    buffs: {
      0: { ...room.buffs[0] },
      1: { ...room.buffs[1] }
    }
  });
}

function syncProfilesAndLeaderboard(room) {
  [0, 1].forEach((r) => {
    const s = getRoomSocket(room, r);
    const rec = getRoomRec(room, r);
    if (s && rec) s.emit('profile', profileOf(rec));
  });
  broadcastLeaderboard();
}

function startQuizSession(room, role, resultType, baseGain, baseLoss) {
  const socketId = role === 0 ? room.p1 : room.p2;
  const pid = role === 0 ? room.p1Pid : room.p2Pid;
  const playerRec = recByPid(pid);
  if (!playerRec) return;

  const hasX2 = !!(room.buffs && room.buffs[role] && room.buffs[role].x2);
  const eloBefore = room.eloBefore[role];
  const midMatchSteal = room.eloLedger[role].stolen;
  const midMatchSwap = room.eloLedger[role].swap;

  const socket = io.sockets.sockets.get(socketId);
  if (!socket || !socket.connected) {
    // Player disconnected before quiz: settle base Elo immediately
    if (resultType === 'win') {
      const x2Bonus = hasX2 ? baseGain : 0;
      playerRec.elo = roundElo(playerRec.elo + baseGain + x2Bonus);
      playerRec.wins++;
      playerRec.games++;
    } else {
      playerRec.elo = roundElo(playerRec.elo - baseLoss);
      playerRec.games++;
    }
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
    socketId,
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
    eloBefore,
    midMatchSteal,
    midMatchSwap,
    completed: false
  };

  socket.emit('quiz_start', {
    sessionId,
    resultType,
    total: 3,
    hasX2,
    currentQuestion: { index: 1, ...selected[0] }
  });
}

function finishRoom(room, winnerRole, reason = 'nomoves') {
  if (!room || room.finished) return;
  room.finished = true;
  room.paused = false;
  clearWheelTimers(room);
  clearDisconnectTimers(room);

  const W = getRoomRec(room, winnerRole);
  const L = getRoomRec(room, winnerRole ^ 1);

  io.to(room.id).emit('match_ended', { winner: winnerRole, reason });

  if (W && L) {
    const expected = 1 / (1 + Math.pow(10, (L.elo - W.elo) / 400));
    const baseGain = Math.max(1, Math.round(K_FACTOR * (1 - expected)));
    const newL = Math.max(0, L.elo - baseGain);
    const baseLoss = Number((L.elo - newL).toFixed(1));

    startQuizSession(room, winnerRole, 'win', baseGain, baseLoss);
    startQuizSession(room, winnerRole ^ 1, 'loss', baseGain, baseLoss);
  }

  // Clean room lookup maps once finished
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

  // Disconnect grace window so player can reconnect without losing state
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

  let wheelSync = null;
  if (room.activeWheel) {
    const w = room.activeWheel;
    wheelSync = {
      matchId: room.id,
      eventId: w.eventId,
      spinnerRole: w.spinnerRole,
      spinnerName: w.spinnerName,
      milestone: w.milestone,
      segments: WHEEL_SEGMENTS,
      targetIndex: w.targetIndex,
      rewardType: w.rewardType,
      candidates: w.publicCandidates,
      startedAt: w.startedAt,
      spinDurationMs: w.spinDurationMs,
      guessTimeoutMs: w.guessTimeoutMs,
      guessRemainingMs: w.guessDeadlineAt ? Math.max(0, w.guessDeadlineAt - Date.now()) : 0,
      guessSubmitted: w.guessSubmitted,
      processed: w.processed,
      resultPayload: w.resultPayload
    };
  }

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
    paused: room.paused,
    buffs: { 0: { ...room.buffs[0] }, 1: { ...room.buffs[1] } },
    lastStatePacket: room.lastStatePacket,
    activeWheel: wheelSync
  });

  return true;
}

io.on('connection', (socket) => {
  socket.emit('leaderboard_update', getLeaderboard());

  socket.on('set_name', (data) => {
    const rec = identify(socket, data);
    socket.emit('profile', profileOf(rec));
    broadcastLeaderboard();

    const u = users[socket.id];
    if (u && u.pid) {
      tryReconnectPlayer(socket, u.pid);
    }
  });

  socket.on('find_match', (data) => {
    const rec = identify(socket, data);
    socket.emit('profile', profileOf(rec));

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
      const roomId = 'room_' + p1.id + '_' + p2.id;
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
        lastSpotsCount: initialSpots.length,
        lastLinesCount: 0,
        lastStatePacket: null,
        paused: false,
        finished: false,
        triggeredMilestones: new Set(),
        activeWheel: null,
        buffs: { 0: { x2: false }, 1: { x2: false } },
        eloBefore: [r1.elo, r2.elo],
        eloLedger: { 0: { stolen: 0, swap: 0 }, 1: { stolen: 0, swap: 0 } },
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
        elo: [r1.elo, r2.elo]
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

  socket.on('game_action', (msg) => {
    const room = rooms[socket.id];
    if (!room || !msg || typeof msg !== 'object') return;
    if (room.finished) return;

    const senderRole = getRoomRole(room, socket.id);
    if (senderRole < 0) return;

    // Block gameplay & resign actions while Lucky Wheel is active
    if (room.paused) {
      socket.emit('lucky_wheel_error', { message: 'Vòng quay may mắn đang diễn ra, tạm khóa thao tác.' });
      return;
    }

    if (msg.t === 'resign') {
      socket.to(room.id).emit('game_action', { t: 'resign', i: senderRole });
      finishRoom(room, senderRole ^ 1, 'resign');
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

      // Validate turn and genuine Sprouts commit (1 new spot, 2 new edges)
      if (!msg.lot) {
        if (senderRole !== room.currentTurn) return;
        const isValidNewCommit =
          parsed.spots.length === room.lastSpotsCount + 1 &&
          parsed.lines.length === room.lastLinesCount + 2;

        if (!isValidNewCommit) {
          // Ignore duplicate or malformed state packets
          return;
        }

        room.lastSpotsCount = parsed.spots.length;
        room.lastLinesCount = parsed.lines.length;
        room.moveCount += 1;
        room.currentTurn = senderRole ^ 1;
        room.lastStatePacket = msg.s;

        socket.to(room.id).emit('game_action', msg);

        if (!parsed.over && room.moveCount % WHEEL_MILESTONE_STEP === 0 && !room.triggeredMilestones.has(room.moveCount)) {
          triggerLuckyWheel(room, senderRole, room.moveCount);
        }
        return;
      }
    }

    socket.to(room.id).emit('game_action', msg);
  });

  socket.on('lucky_wheel_guess', (data) => {
    const room = rooms[socket.id];
    if (!room || room.finished || !room.activeWheel) {
      socket.emit('lucky_wheel_error', { message: 'Không có sự kiện vòng quay đang hoạt động.' });
      return;
    }
    const senderRole = getRoomRole(room, socket.id);
    const wheel = room.activeWheel;

    if (!data || typeof data !== 'object' || data.eventId !== wheel.eventId) {
      socket.emit('lucky_wheel_error', { message: 'Mã sự kiện vòng quay không hợp lệ.' });
      return;
    }
    if (senderRole !== wheel.spinnerRole) {
      socket.emit('lucky_wheel_error', { message: 'Chỉ người quay mới được chọn ứng viên.' });
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
    resolveLuckyWheel(room, wheel.eventId, candidateId, false);
  });

  socket.on('game_over', (data) => {
    const room = rooms[socket.id];
    if (!room || room.finished || room.paused || !data) return;
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

        // Standardized Elo calculation pipeline:
        // 1. Original match baseGain/baseLoss
        // 2. Original Quiz bonus/penalty
        // 3. Apply x2 buff only to eligible positive reward
        // 4. Mid-match steal & swap already applied in real time; never double-counted
        let matchResultDelta = 0;
        let quizBonus = 0;
        let x2Bonus = 0;
        let endOfMatchDelta = 0;

        if (session.resultType === 'win') {
          matchResultDelta = session.baseGain;
          quizBonus = session.correctCount === 3 ? Math.round(session.baseGain * 1.5) : 0;
          const positiveReward = matchResultDelta + quizBonus;
          x2Bonus = session.hasX2 && positiveReward > 0 ? positiveReward : 0;
          endOfMatchDelta = Number((positiveReward + x2Bonus).toFixed(1));
          playerRec.elo = roundElo(playerRec.elo + endOfMatchDelta);
          playerRec.wins++;
          playerRec.games++;
        } else {
          matchResultDelta = -session.baseLoss;
          if (session.correctCount === 3) {
            endOfMatchDelta = -0.5;
            quizBonus = Number((session.baseLoss - 0.5).toFixed(1));
          } else {
            endOfMatchDelta = -session.baseLoss;
            quizBonus = 0;
          }
          x2Bonus = 0;
          playerRec.elo = roundElo(playerRec.elo + endOfMatchDelta);
          playerRec.games++;
        }

        const midMatchTotal = Number((session.midMatchSteal + session.midMatchSwap).toFixed(1));
        const finalEloChange = Number((playerRec.elo - session.eloBefore).toFixed(1));

        socket.emit('quiz_completed', {
          correctCount: session.correctCount,
          finalEloDelta: endOfMatchDelta,
          newElo: playerRec.elo,
          breakdown: {
            eloBefore: session.eloBefore,
            matchResult: matchResultDelta,
            quizBonus,
            luckyWheelBonus: x2Bonus,
            stealDelta: session.midMatchSteal,
            swapDelta: session.midMatchSwap,
            stealSwapTotal: midMatchTotal,
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
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
