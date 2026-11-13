const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ các file tĩnh trong cùng thư mục
app.use(express.static(__dirname));

let waitingPlayer = null; // Lưu người chơi đang chờ tìm trận
const blockedUntil = new Map(); // Lưu thời hạn Bảy chọ (socket.id -> timestamp)

io.on('connection', (socket) => {
    console.log('Có người chơi kết nối:', socket.id);

    // Kích hoạt Bảy chọ (chặn thách đấu 3 phút)
    socket.on('activate_bay_cho', () => {
        const until = Date.now() + 3 * 60 * 1000;
        blockedUntil.set(socket.id, until);
        io.emit('bay_cho_status', { id: socket.id, until });
    });

    // Kiểm tra chặn thách đấu khi có người thách đấu
    socket.on('challenge_player', (data) => {
        if (!data || !data.targetId) return;
        const until = blockedUntil.get(data.targetId) || 0;
        if (until > Date.now()) {
            const left = Math.ceil((until - Date.now()) / 1000);
            socket.emit('challenge_blocked', { message: `Người chơi đang bật Bảy chọ! Chặn thách đấu còn ${left}s.` });
            return;
        }
        io.to(data.targetId).emit('incoming_challenge', { fromId: socket.id, room: data.room });
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
        blockedUntil.delete(socket.id);
        console.log('Người chơi ngắt kết nối:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});
