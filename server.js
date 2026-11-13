socket.on('submit_quiz_answer', (data) => {
    if (!data || !data.sessionId || !data.selectedAnswer) return;
    const session = quizSessions[data.sessionId];
    if (!session || session.completed || session.socketId !== socket.id) return;

    const currentQData = session.questions[session.currentIndex];
    const originalQ = questionsBank.find(q => q.id === currentQData.id);
    
    // So sánh đáp án không phân biệt chữ hoa/thường
    const userAns = String(data.selectedAnswer).trim().toUpperCase();
    const correctAns = originalQ ? String(originalQ.correctAnswer).trim().toUpperCase() : 'B';
    
    const isCorrect = userAns === correctAns;

    if (isCorrect) session.correctCount++;
    session.currentIndex++;

    // Bổ sung hiệu ứng đổi màu nút bấm đúng/sai tạm thời trước khi sang câu tiếp theo
    socket.emit('quiz_answer_feedback', { correct: isCorrect, correctKey: correctAns });

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
        let finalEloDelta = 0;
        const playerRec = recOf(session.socketId);
        if (!playerRec) return;

        if (session.resultType === 'win') {
          finalEloDelta = session.correctCount === 3
            ? session.baseGain + Math.round(session.baseGain * 1.5)
            : session.baseGain;
          playerRec.elo += finalEloDelta;
          playerRec.wins++;
          playerRec.games++;
        } else {
          finalEloDelta = session.correctCount === 3 ? -0.5 : -session.baseLoss;
          playerRec.elo = Math.max(0, Number((playerRec.elo + finalEloDelta).toFixed(1)));
          playerRec.games++;
        }

        socket.emit('quiz_completed', {
          correctCount: session.correctCount,
          finalEloDelta,
          newElo: playerRec.elo
        });
        socket.emit('profile', profileOf(playerRec));
        broadcastLeaderboard();
        delete quizSessions[data.sessionId];
      }
    }, 600); // Đợi 0.6 giây để hiển thị màu đúng/sai rồi tự động chuyển câu tiếp theo
  });
