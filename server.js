const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const START_ELO = 500;
const K_FACTOR = 32;
const ALLOWED_NODE_COUNTS = [4, 5, 6];
const MATCH_MINUTES = 5;
const REPORT_GRACE_MS = 8000;
const PID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const app = express();
app.disable('x-powered-by');
const server = http.createServer(app);

app.get('/healthz', (req, res) => res.status(200).send('ok'));
app.get(['/', '/index.html'], (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.use(express.static(path.join(__dirname, 'public')));

const io = new Server(server, {
  cors: { origin: process.env.CORS_ORIGIN || '*', methods: ['GET', 'POST'] },
  transports: ['websocket', 'polling'],
  pingInterval: 25000,
  pingTimeout: 30000,
  maxHttpBufferSize: 5e6
});

// Load questions
let questionsBank = [];
try {
  const qPath = path.join(__dirname, 'questions.json');
  if (fs.existsSync(qPath)) {
    questionsBank = JSON.parse(fs.readFileSync(qPath, 'utf-8'));
  }
} catch (e) {
  console.error('Không thể đọc questions.json:', e);
}

const ratings = new Map(); // pid -> { pub, name, elo, games, wins }
const usernames = new Map(); // normalized name -> pid
let waitingPlayer = null;
let rooms = {};
let users = {};
let quizSessions = {}; // sessionId -> { pid, questions: [], currentIndex: 0, correctCount: 0, matchId, resultType, baseEloGain, baseEloLoss }

const cleanName = (x) => String(x == null ? '' : x).replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 16);

function isUsernameTaken(name, currentPid) {
  const norm = name.toLowerCase();
  if (usernames.has(norm)) {
    return usernames.get(norm) !== currentPid;
  }
  return false;
}

function registerUsername(pid, name) {
  const norm = name.toLowerCase();
  for (let [p, rec] of ratings.entries()) {
    if (p !== pid && rec.name.toLowerCase() === norm) {
      return false;
    }
  }
  // Remove old username mapping if exists
  for (let [n, p] of usernames.entries()) {
    if (p === pid) usernames.delete(n);
  }
  usernames.set(norm, pid);
  return true;
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
    while (isUsernameTaken(baseName, u.pid)) {
      baseName = 'Player_' + crypto.randomBytes(2).toString('hex');
    }
    rec = { pub: crypto.randomBytes(4).toString('hex'), name: baseName, elo: START_ELO, games: 0, wins: 0 };
    ratings.set(u.pid, rec);
    usernames.set(baseName.toLowerCase(), u.pid);
  } else if (d.name !== undefined) {
    const requestedName = cleanName(d.name);
    if (requestedName && requestedName.length > 0) {
      if (!isUsernameTaken(requestedName, u.pid)) {
        usernames.delete(rec.name.toLowerCase());
        rec.name = requestedName;
        usernames.set(requestedName.toLowerCase(), u.pid);
        socket.emit('name_result', { success: true, name: requestedName });
      } else {
        socket.emit('name_result', { success: false, message: 'Tên này đã được sử dụng, vui lòng chọn tên khác!' });
      }
    }
  }
  return rec;
}

const recOf = (socketId) => (users[socketId] ? ratings.get(users[socketId].pid) : null);
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

function generateSpots(n = 4) {
  const spots = [];
  const W = 900, H = 600;
  for (let t = 0; spots.length < n && t < 2000; t++) {
    const p = { x: (Math.random() - 0.5) * (W - 140), y: (Math.random() - 0.5) * (H - 140), d: 0 };
    if (spots.every((s) => Math.hypot(s.x - p.x, s.y - p.y) > (t > 1000 ? 70 : 130))) spots.push(p);
  }
  return spots;
}

function startQuizSession(socketId, matchId, resultType, baseGain, baseLoss) {
  if (questionsBank.length === 0) return;
  const shuffled = [...questionsBank].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map(q => ({
    id: q.id,
    question: q.question,
    options: q.options
  }));

  const sessionId = crypto.randomBytes(16).toString('hex');
  quizSessions[sessionId] = {
    socketId,
    questions: selected,
    currentIndex: 0,
    correctCount: 0,
    matchId,
    resultType, // 'win', 'loss', 'draw'
    baseGain,
    baseLoss,
    completed: false
  };

  const socket = io.sockets.sockets.get(socketId);
  if (socket) {
    socket.emit('quiz_start', {
      sessionId,
      resultType,
      total: 3,
      currentQuestion: {
        index: 1,
        id: selected[0].id,
        question: selected[0].question,
        options: selected[0].options
      }
    });
  }
}

function finishRoom(room, winnerRole, reason) {
  if (room.finished) return;
  room.finished = true;
  clearTimeout(room.timer);

  const p1SocketId = room.p1;
  const p2SocketId = room.p2;
  const W_sock = winnerRole === 0 ? p1SocketId : p2SocketId;
  const L_sock = winnerRole === 0 ? p2SocketId : p1SocketId;

  const W = recOf(W_sock);
  const L = recOf(L_sock);
  if (!W || !L) return;

  const expected = 1 / (1 + Math.pow(10, (L.elo - W.elo) / 400));
  const baseGain = Math.max(1, Math.round(K_FACTOR * (1 - expected)));
  const newL = Math.max(0, L.elo - baseGain);
  const baseLoss = L.elo - newL;

  room.baseGain = baseGain;
  room.baseLoss = baseLoss;
  room.winnerRole = winnerRole;

  // Start quiz session for both players independently
  startQuizSession(W_sock, room.id, 'win', baseGain, baseLoss);
  startQuizSession(L_sock, room.id, 'loss', baseGain, baseLoss);
}

function voidRoom(room) {
  if (room.finished) return;
  room.finished = true;
  clearTimeout(room.timer);
  io.to(room.id).emit('elo_result', { void: true });
}

function leaveRoom(socket) {
  const room = rooms[socket.id];
  if (!room) return;
  const role = room.p1 === socket.id ? 0 : 1;
  const otherId = role === 0 ? room.p2 : room.p1;

  if (!room.finished) {
    const rep = room.reports[role] !== null ? room.reports[role] : room.reports[role ^ 1];
    if (rep !== null) finishRoom(room, rep, 'normal');
    else finishRoom(room, role ^ 1, 'forfeit');
    room.finished = true;
  }
  delete rooms[room.p1];
  delete rooms[room.p2];
  socket.leave(room.id);
  const other = io.sockets.sockets.get(otherId);
  if (other) { other.leave(room.id); other.emit('opponent_left'); }
}

io.on('connection', (socket) => {
  socket.emit('leaderboard_update', getLeaderboard());

  socket.on('set_name', (data) => {
    const rec = identify(socket, data);
    socket.emit('profile', profileOf(rec));
    broadcastLeaderboard();
  });

  socket.on('find_match', (data) => {
    const rec = identify(socket, data);
    socket.emit('profile', profileOf(rec));

    let nodeCount = 4;
    if (data && ALLOWED_NODE_COUNTS.includes(Number(data.nodes))) {
      nodeCount = Number(data.nodes);
    }

    if (rooms[socket.id]) {
      if (rooms[socket.id].finished) leaveRoom(socket);
      else return socket.emit('match_error', { msg: 'Bạn đang trong một ván đấu.' });
    }
    if (waitingPlayer && waitingPlayer.id === socket.id) return;
    if (waitingPlayer && !waitingPlayer.connected) waitingPlayer = null;

    if (waitingPlayer) {
      const p1 = waitingPlayer;
      const p2 = socket;
      if (users[p1.id] && users[p1.id].pid === users[p2.id].pid) {
        return socket.emit('match_error', { msg: 'Tài khoản này đang tìm trận ở một tab khác.' });
      }
      waitingPlayer = null;

      const roomId = 'room_' + p1.id + '_' + p2.id;
      p1.join(roomId);
      p2.join(roomId);
      const room = { id: roomId, p1: p1.id, p2: p2.id, finished: false, reports: [null, null], timer: null, reason: 'normal', nodeCount };
      rooms[p1.id] = room;
      rooms[p2.id] = room;

      const r1 = recOf(p1.id), r2 = recOf(p2.id);
      const matchData = {
        roomId,
        spots: generateSpots(nodeCount),
        lines: [],
        turn: Math.random() < 0.5 ? 0 : 1,
        tm: MATCH_MINUTES,
        p1Name: r1.name,
        p2Name: r2.name,
        elo: [r1.elo, r2.elo]
      };
      p1.emit('match_start', { ...matchData, role: 0, opponent: r2.name });
      p2.emit('match_start', { ...matchData, role: 1, opponent: r1.name });
    } else {
      waitingPlayer = socket;
      socket.emit('waiting_for_match');
    }
  });

  socket.on('cancel_match', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
  });

  socket.on('game_action', (data) => {
    const room = rooms[socket.id];
    if (room && data && typeof data === 'object') socket.to(room.id).emit('game_action', data);
  });

  socket.on('game_over', (data) => {
    const room = rooms[socket.id];
    if (!room || room.finished || !data) return;
    const w = data.winner;
    if (w !== 0 && w !== 1) return;
    const role = room.p1 === socket.id ? 0 : 1;
    room.reports[role] = w;
    if (['resign', 'timeout', 'nomoves'].includes(data.reason)) room.reason = data.reason;

    const [a, b] = room.reports;
    if (a !== null && b !== null) {
      if (a === b) finishRoom(room, a, room.reason);
      else voidRoom(room);
    } else if (!room.timer) {
      room.timer = setTimeout(() => {
        const only = room.reports[0] !== null ? room.reports[0] : room.reports[1];
        if (only !== null) finishRoom(room, only, room.reason);
      }, REPORT_GRACE_MS);
    }
  });

  socket.on('submit_quiz_answer', (data) => {
    if (!data || !data.sessionId || !data.selectedAnswer) return;
    const session = quizSessions[data.sessionId];
    if (!session || session.completed || session.socketId !== socket.id) {
      return socket.emit('error_message', { message: 'Phiên thử thách không hợp lệ hoặc đã kết thúc!' });
    }

    const currentQData = session.questions[session.currentIndex];
    const originalQ = questionsBank.find(q => q.id === currentQData.id);
    const isCorrect = originalQ && originalQ.correctAnswer === data.selectedAnswer.toUpperCase();

    if (isCorrect) {
      session.correctCount++;
    }

    session.currentIndex++;

    if (session.currentIndex < 3) {
      const nextQ = session.questions[session.currentIndex];
      socket.emit('quiz_answer_result', {
        correct: isCorrect,
        nextQuestion: {
          index: session.currentIndex + 1,
          id: nextQ.id,
          question: nextQ.question,
          options: nextQ.options
        }
      });
    } else {
      session.completed = true;
      let finalEloDelta = 0;
      const W = recOf(session.socketId);
      if (!W) return;

      if (session.resultType === 'win') {
        if (session.correctCount === 3) {
          finalEloDelta = session.baseGain + Math.round(session.baseGain * 1.5);
        } else {
          finalEloDelta = session.baseGain;
        }
        W.elo += finalEloDelta;
        W.games++;
        W.wins++;
      } else if (session.resultType === 'loss') {
        if (session.correctCount === 3) {
          finalEloDelta = -0.5;
        } else {
          finalEloDelta = -session.baseLoss;
        }
        W.elo = Math.max(0, W.elo + finalEloDelta);
        W.games++;
      }

      socket.emit('quiz_completed', {
        correctCount: session.correctCount,
        finalEloDelta,
        newElo: W.elo
      });

      socket.emit('profile', profileOf(W));
      broadcastLeaderboard();
      delete quizSessions[data.sessionId];
    }
  });

  socket.on('leave_match', () => leaveRoom(socket));

  socket.on('disconnect', () => {
    if (waitingPlayer && waitingPlayer.id === socket.id) waitingPlayer = null;
    leaveRoom(socket);

    const u = users[socket.id];
    delete users[socket.id];
    if (u) {
      const stillOnline = Object.values(users).some((x) => x.pid === u.pid);
      const r = ratings.get(u.pid);
      if (r && !stillOnline && (r.games === 0 || u.pid.startsWith('anon_'))) {
        ratings.delete(u.pid);
        for (let [n, p] of usernames.entries()) {
          if (p === u.pid) usernames.delete(n);
        }
      }
    }
    broadcastLeaderboard();
  });
});

server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
