const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ các file tĩnh trong cùng thư mục
app.use(express.static(__dirname));

let waitingPlayer = null; // Lưu người chơi đang chờ tìm trận
const players = new Map(); // socket.id -> { id, name, elo, blockedUntil }
const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function genRoomCode() {
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += ALPH[Math.floor(Math.random() * ALPH.length)];
    }
    return code;
}

function isNameTaken(name, excludeSocketId) {
    const target = String(name || '').trim().toLowerCase();
    if (!target) return false;
    for (const [id, p] of players.entries()) {
        if (id !== excludeSocketId && p.name.trim().toLowerCase() === target) {
            return true;
        }
    }
    return false;
}

function emitLeaderboard() {
    const list = Array.from(players.values())
        .sort((a, b) => b.elo - a.elo)
        .map((p, idx) => ({
            rank: idx + 1,
            id: p.id,
            name: p.name,
            elo: p.elo,
            blockedUntil: p.blockedUntil || 0
        }));
    io.emit('leaderboard_update', list);
}

io.on('connection', (socket) => {
    console.log('Có người chơi kết nối:', socket.id);
    // Tạo tên mặc định duy nhất không trùng lặp
    let defaultName = 'Player_' + socket.id.slice(0, 4);
    while (isNameTaken(defaultName, socket.id)) {
        defaultName = 'Player_' + Math.floor(1000 + Math.random() * 9000);
    }

    players.set(socket.id, { id: socket.id, name: defaultName, elo: 100, blockedUntil: 0 });
    socket.emit('init_profile', { name: defaultName });
    emitLeaderboard();

    // Cập nhật tên (có kiểm tra trùng), điểm ELO hoặc trạng thái Bảy chọ lên Leaderboard
    socket.on('sync_player', (data) => {
        const p = players.get(socket.id);
        if (!p || !data) return;

        if (typeof data.name === 'string') {
            const cleanName = data.name.trim().replace(/\s+/g, ' ').slice(0, 20);
            if (cleanName.length >= 2 && cleanName.length <= 20) {
                if (isNameTaken(cleanName, socket.id)) {
                    socket.emit('name_rejected', {
                        message: `Tên "${cleanName}" đã tồn tại! Vui lòng chọn tên khác.`,
                        fallback: p.name
                    });
                } else if (p.name !== cleanName) {
                    p.name = cleanName;
                    socket.emit('name_accepted', { name: cleanName });
                }
            }
        }

        if (typeof data.elo === 'number') p.elo = data.elo;
        if (typeof data.blockedUntil === 'number') p.blockedUntil = data.blockedUntil;
        emitLeaderboard();
    });

    // Kiểm tra chặn thách đấu khi có người thách đấu
    socket.on('challenge_player', (data) => {
        if (!data || !data.targetId) return;
        const target = players.get(data.targetId);
        if (!target) return;
        if (target.blockedUntil > Date.now()) {
            const left = Math.ceil((target.blockedUntil - Date.now()) / 1000);
            socket.emit('challenge_blocked', { message: `🚫 ${target.name} đang bật Bảy chọ! Chặn thách đấu còn ${left}s.` });
            return;
        }
        const sender = players.get(socket.id);
        io.to(data.targetId).emit('incoming_challenge', {
            fromId: socket.id,
            fromName: sender ? sender.name : 'Đối thủ',
            room: data.room
        });
    });

    // Khi người chơi bấm tìm trận ngẫu nhiên
    socket.on('find_match', (data) => {
        // Kiểm tra số lượng nodes hợp lệ (4, 5, hoặc 6)
        if (data && data.nodes && ![4, 5, 6].includes(Number(data.nodes))) {
            socket.emit('error_message', { message: 'Số lượng nodes không hợp lệ. Chỉ chấp nhận 4, 5 hoặc 6.' });
            return;
        }

        // Hủy tìm trận nếu đang chờ
        if (data && data.cancel) {
            if (waitingPlayer && waitingPlayer.id === socket.id) {
                waitingPlayer = null;
            }
            socket.emit('search_cancelled');
            return;
        }

        if (waitingPlayer && waitingPlayer.connected && waitingPlayer.id !== socket.id) {
            const roomCode = genRoomCode();
            const roomId = 'room_' + roomCode;
            const hostSocket = waitingPlayer;
            waitingPlayer = null;

            socket.join(roomId);
            hostSocket.join(roomId);

            // Gửi mã phòng 6 ký tự chuẩn để 2 máy tự động kết nối WebRTC vào nhau
            hostSocket.emit('match_found', { roomId, roomCode, role: 'host', p1: hostSocket.id, p2: socket.id });
            socket.emit('match_found', { roomId, roomCode, role: 'join', p1: hostSocket.id, p2: socket.id });
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', { message: 'Đang tìm kiếm đối thủ ngẫu nhiên...' });
        }
    });

    socket.on('disconnect', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        players.delete(socket.id);
        emitLeaderboard();
        console.log('Người chơi ngắt kết nối:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});
