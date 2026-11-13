const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

let waitingPlayer = null;
const activeUsers = new Map(); // socket.id -> { name, elo, shieldUntil }

io.on('connection', (socket) => {
    activeUsers.set(socket.id, {
        id: socket.id,
        name: 'Player_' + socket.id.slice(0, 4),
        elo: 100,
        shieldUntil: 0 // Timestamp hết hạn "Bảy chọ"
    });

    const broadcastLobbyUsers = () => {
        const list = Array.from(activeUsers.values()).map(u => ({
            id: u.id,
            name: u.name,
            elo: u.elo,
            isProtected: u.shieldUntil > Date.now(),
            remainingShield: Math.max(0, Math.ceil((u.shieldUntil - Date.now()) / 1000))
        }));
        io.emit('lobby_users', list);
    };

    broadcastLobbyUsers();

    // Cập nhật thông tin người chơi (Tên, ELO)
    socket.on('update_profile', (data) => {
        const user = activeUsers.get(socket.id);
        if (!user) return;
        if (data.name) user.name = String(data.name).slice(0, 20);
        if (typeof data.elo === 'number') user.elo = Math.max(0, data.elo);
        broadcastLobbyUsers();
    });

    // Kích hoạt "Bảy chọ" (Chặn quyền thách đấu 3 phút = 180,000ms)
    socket.on('activate_bay_cho', () => {
        const user = activeUsers.get(socket.id);
        if (!user) return;
        user.shieldUntil = Date.now() + 3 * 60 * 1000;
        socket.emit('bay_cho_confirmed', { shieldUntil: user.shieldUntil });
        broadcastLobbyUsers();
    });

    // Gửi lời thách đấu trực tiếp tới người chơi khác
    socket.on('send_challenge', ({ targetId, roomCode }) => {
        const sender = activeUsers.get(socket.id);
        const target = activeUsers.get(targetId);
        if (!sender || !target) return;

        if (target.shieldUntil > Date.now()) {
            const left = Math.ceil((target.shieldUntil - Date.now()) / 1000);
            socket.emit('challenge_blocked', {
                message: `🚫 ${target.name} đang bật "Bảy chọ"! Không thể thách đấu trong ${left}s nữa.`
            });
            return;
        }

        io.to(targetId).emit('receive_challenge', {
            fromId: sender.id,
            fromName: sender.name,
            fromElo: sender.elo,
            roomCode
        });
    });

    // Tìm trận ngẫu nhiên
    socket.on('find_match', (data) => {
        if (data && data.nodes && ![4, 5, 6].includes(Number(data.nodes))) {
            socket.emit('error_message', { message: 'Số lượng nodes không hợp lệ. Chỉ chấp nhận 4, 5 hoặc 6.' });
            return;
        }

        if (waitingPlayer && waitingPlayer.id !== socket.id) {
            const roomId = 'room_' + Math.random().toString(36).substr(2, 9);
            socket.join(roomId);
            waitingPlayer.join(roomId);
            io.to(roomId).emit('match_found', { roomId, p1: waitingPlayer.id, p2: socket.id });
            waitingPlayer = null;
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', { message: 'Đang tìm kiếm đối thủ ngẫu nhiên...' });
        }
    });

    socket.on('disconnect', () => {
        if (waitingPlayer === socket) waitingPlayer = null;
        activeUsers.delete(socket.id);
        broadcastLobbyUsers();
    });
});

// Cập nhật đếm ngược "Bảy chọ" định kỳ mỗi 5 giây
setInterval(() => {
    const list = Array.from(activeUsers.values()).map(u => ({
        id: u.id,
        name: u.name,
        elo: u.elo,
        isProtected: u.shieldUntil > Date.now(),
        remainingShield: Math.max(0, Math.ceil((u.shieldUntil - Date.now()) / 1000))
    }));
    io.emit('lobby_users', list);
}, 5000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});
