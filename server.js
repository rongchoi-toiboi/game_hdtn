const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Phục vụ các file tĩnh trong cùng thư mục (index.html, quizz.json, ...)
app.use(express.static(__dirname));

let waitingPlayer = null; // Lưu người chơi đang chờ tìm trận
const globalLeaderboard = new Map(); // Lưu bảng xếp hạng tạm thời trên server theo playerId

io.on('connection', (socket) => {
    console.log('Có người chơi kết nối:', socket.id);

    // Gửi bảng xếp hạng hiện tại khi người chơi mới vào
    socket.emit('leaderboard_update', Array.from(globalLeaderboard.values()));

    // Cập nhật chỉ số người chơi lên BXH server
    socket.on('submit_stats', (entry) => {
        if (!entry || !entry.playerId) return;
        globalLeaderboard.set(entry.playerId, {
            playerId: String(entry.playerId).slice(0, 40),
            name: String(entry.name || 'Player').slice(0, 20),
            elo: Number(entry.elo) || 1000,
            totalScore: Number(entry.totalScore) || 0,
            bestStreak: Number(entry.bestStreak) || 0,
            totalWins: Number(entry.totalWins) || 0,
            totalMatches: Number(entry.totalMatches) || 0,
            updatedAt: Date.now()
        });
        io.emit('leaderboard_update', Array.from(globalLeaderboard.values()));
    });

    // Khi người chơi bấm tìm trận ngẫu nhiên
    socket.on('find_match', (data) => {
        if (data && data.nodes && ![4, 5, 6].includes(Number(data.nodes))) {
            socket.emit('error_message', { message: 'Số lượng nodes không hợp lệ. Chỉ chấp nhận 4, 5 hoặc 6.' });
            return;
        }

        if (waitingPlayer && waitingPlayer.id !== socket.id && waitingPlayer.connected) {
            const roomId = 'room_' + Math.random().toString(36).substr(2, 9);
            const hostSocket = waitingPlayer;
            waitingPlayer = null;

            socket.join(roomId);
            hostSocket.join(roomId);

            // Báo cho cả 2 máy tìm thấy đối thủ (p1 là Host, p2 là Guest)
            io.to(roomId).emit('match_found', { roomId, p1: hostSocket.id, p2: socket.id });
        } else {
            waitingPlayer = socket;
            socket.emit('waiting', { message: 'Đang tìm kiếm đối thủ ngẫu nhiên...' });
        }
    });

    // Hủy tìm trận
    socket.on('cancel_match', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        socket.emit('match_cancelled');
    });

    // Chuyển tiếp tín hiệu WebRTC (offer/answer) giữa 2 người chơi đã ghép trận
    socket.on('rtc_signal', ({ roomId, payload }) => {
        if (roomId && payload) {
            socket.to(roomId).emit('rtc_signal', { payload });
        }
    });

    socket.on('disconnect', () => {
        if (waitingPlayer && waitingPlayer.id === socket.id) {
            waitingPlayer = null;
        }
        console.log('Người chơi ngắt kết nối:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server đang chạy tại cổng ${PORT}`);
});
