const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ các file tĩnh trong cùng thư mục
app.use(express.static(__dirname));

let waitingPlayer = null; // Lưu người chơi đang chờ tìm trận
const players = new Map(); // Lưu thông tin Leaderboard & Bảy chọ (socket.id -> { id, name, elo, blockedUntil })

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
    players.set(socket.id, { id: socket.id, name: 'Player_' + socket.id.slice(0, 4), elo: 100, blockedUntil: 0 });
    emitLeaderboard();

    // Cập nhật tên, điểm ELO hoặc trạng thái Bảy chọ lên Leaderboard
    socket.on('sync_player', (data) => {
        const p = players.get(socket.id);
        if (!p || !data) return;
        if (data.name) p.name = String(data.name).slice(0, 20);
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

        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = 'room_' + Math.random().toString(36).substr(2, 9);
            
            socket.join(roomId);
            waitingPlayer.join(roomId);

            // Báo cho cả 2 máy tìm thấy đối thủ
            io.to(roomId).emit('match_found', { roomId, p1: waitingPlayer.id, p2: socket.id });

            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', { message: 'Đang tìm kiếm đối thủ ngẫu nhiên...' });
        }
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) {
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
