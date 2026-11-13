<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sprouts Arena — Đấu Trí & Chiến Thuật ELO</title>
<script src="/socket.io/socket.io.js"></script>
<style>
:root {
  --desk: #e6ecf2;
  --paper: #ffffff;
  --grid: #e4edf3;
  --ink: #16232e;
  --mut: #5c7080;
  --p1: #e6396d;
  --p2: #1d7ed8;
  --gold: #f59f00;
  --purple: #7950f2;
  --teal: #0ca678;
  --card: #ffffff;
  --line: #cfdbe4;
  --sh: 0 4px 12px rgba(22,35,46,.06), 0 12px 32px rgba(22,35,46,.08);
  --f: 'Inter', ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
:root[data-theme=dark] {
  color-scheme: dark;
  --desk: #0b131a;
  --paper: #12202b;
  --grid: #1b2f3d;
  --ink: #eaf2f8;
  --mut: #8ba0b0;
  --p1: #ff6b9d;
  --p2: #5cb2ff;
  --gold: #fcc419;
  --purple: #9775fa;
  --teal: #20c997;
  --card: #162633;
  --line: #263f50;
  --sh: 0 4px 16px rgba(0,0,0,.35), 0 12px 32px rgba(0,0,0,.45);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: clamp(12px, 2.5vw, 28px);
  background: var(--desk);
  color: var(--ink);
  font: 15px/1.5 var(--f);
  -webkit-font-smoothing: antialiased;
  transition: background .25s, color .25s;
}
main { max-width: 1020px; margin: 0 auto; display: flex; flex-direction: column; gap: 14px; }

/* TOP NAVBAR & ELO HUD */
.topbar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  background: var(--card); border: 1px solid var(--line); border-radius: 16px;
  padding: 12px 18px; box-shadow: var(--sh);
}
.brand { display: flex; align-items: center; gap: 10px; }
.brand-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, var(--p1), var(--p2));
  display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 1.1rem;
}
h1 { font: 800 1.45rem/1 var(--f); margin: 0; letter-spacing: -.03em; }
.brand small { display: block; color: var(--mut); font-size: .78rem; margin-top: 2px; }
.sp { flex: 1; }

.elo-badge {
  display: flex; align-items: center; gap: 8px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--gold) 18%, var(--card)), color-mix(in srgb, var(--gold) 6%, var(--card)));
  border: 1.5px solid color-mix(in srgb, var(--gold) 55%, var(--line));
  padding: 6px 14px; border-radius: 99px; font-weight: 700; color: var(--ink);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--gold) 15%, transparent);
}
.elo-badge span.val { color: var(--gold); font-size: 1.05rem; font-variant-numeric: tabular-nums; }
.elo-add {
  padding: 2px 7px !important; font-size: .75rem !important; border-radius: 99px !important;
  background: color-mix(in srgb, var(--gold) 20%, transparent) !important; border: 0 !important;
}

/* POWER-UPS / PERKS BAR (XÀI LÚC NÀO CŨNG ĐƯỢC) */
.perks-panel {
  background: var(--card); border: 1px solid var(--line); border-radius: 16px;
  padding: 12px 16px; box-shadow: var(--sh);
  display: flex; flex-direction: column; gap: 10px;
}
.perks-head {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
}
.perks-title { font-weight: 700; font-size: .9rem; display: flex; align-items: center; gap: 6px; }
.active-buffs { display: flex; gap: 6px; flex-wrap: wrap; }
.buff-pill {
  font-size: .75rem; font-weight: 700; padding: 3px 10px; border-radius: 99px;
  display: inline-flex; align-items: center; gap: 5px; animation: pop .3s ease;
}
.buff-star { background: color-mix(in srgb, var(--gold) 20%, transparent); color: var(--gold); border: 1px solid var(--gold); }
.buff-block { background: color-mix(in srgb, var(--purple) 20%, transparent); color: var(--purple); border: 1px solid var(--purple); }
.buff-shield { background: color-mix(in srgb, var(--teal) 20%, transparent); color: var(--teal); border: 1px solid var(--teal); }

.perks-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 10px;
}
.perk-btn {
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line);
  background: var(--paper); text-align: left; position: relative; overflow: hidden;
  transition: transform .15s, border-color .2s, box-shadow .2s;
}
.perk-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  border-color: var(--accent, var(--ink));
  box-shadow: 0 6px 16px color-mix(in srgb, var(--accent, var(--ink)) 16%, transparent);
}
.perk-btn.active-perk {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--paper));
}
.perk-top { display: flex; width: 100%; justify-content: space-between; align-items: center; font-weight: 700; font-size: .88rem; }
.perk-cost {
  font-size: .75rem; font-weight: 800; padding: 2px 8px; border-radius: 99px;
  background: color-mix(in srgb, var(--accent) 16%, transparent); color: var(--accent);
}
.perk-desc { font-size: .76rem; color: var(--mut); line-height: 1.35; font-weight: 400; }

/* PLAYERS CARDS */
.players { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.pl {
  display: flex; align-items: center; gap: 10px; padding: 12px 16px;
  background: var(--card); border: 1.5px solid var(--line); border-radius: 14px;
  transition: border-color .25s, box-shadow .25s, transform .2s;
}
.pl i { width: 14px; height: 14px; border-radius: 50%; background: var(--c); flex: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--c) 25%, transparent); }
.pl input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--ink); font: inherit; font-weight: 700; font-size: 1rem; }
.pl em { font-style: normal; font-size: .74rem; font-weight: 700; padding: 2px 10px; border-radius: 99px; background: var(--c); color: #fff; white-space: nowrap; }
.pl.on { border-color: var(--c); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent); }
.pl input:disabled { opacity: .8; }

#st {
  min-height: 1.6em; padding: 8px 14px; border-radius: 10px;
  background: color-mix(in srgb, var(--card) 70%, transparent);
  border: 1px dashed var(--line); font-size: .92rem;
}

/* CANVAS BOARD */
.sheet {
  position: relative; background: var(--paper); border: 1.5px solid var(--line);
  border-radius: 16px; box-shadow: var(--sh); padding: 10px;
}
canvas { display: block; width: 100%; aspect-ratio: 3/2; touch-action: none; border-radius: 12px; background: var(--paper); cursor: grab; }
.bar { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }

select, input[type=number], button {
  font: inherit; font-weight: 600; color: var(--ink); background: var(--card);
  border: 1px solid var(--line); border-radius: 10px; padding: 7px 14px; cursor: pointer;
  transition: all .15s;
}
input[type=number] { width: 5.2em; padding: 7px 8px; cursor: text; text-align: center; }
button:hover:not(:disabled), select:hover { border-color: var(--ink); }
button.pri { background: var(--ink); color: var(--paper); border-color: var(--ink); }
button:disabled { opacity: .42; cursor: not-allowed; }

details { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 16px; color: var(--mut); }
summary { cursor: pointer; color: var(--ink); font-weight: 700; }
textarea { display: block; width: 100%; height: 4.5em; margin: 4px 0 10px; padding: 8px; font: 12px/1.3 ui-monospace, monospace; color: var(--ink); background: var(--paper); border: 1px solid var(--line); border-radius: 8px; }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-bottom: 8px; }

/* ONLINE CHALLENGER LIST */
.arena-list {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 8px; margin-top: 10px;
}
.arena-user {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 8px 12px; border-radius: 10px; background: var(--paper); border: 1px solid var(--line);
}
.arena-user-info { display: flex; flex-direction: column; font-size: .85rem; }
.arena-user-info b { color: var(--ink); }
.arena-user-info span { color: var(--mut); font-size: .75rem; }
.btn-chal { padding: 4px 10px; font-size: .78rem; border-radius: 8px; }
.btn-chal.protected { background: color-mix(in srgb, var(--purple) 15%, transparent); color: var(--purple); border-color: var(--purple); }

/* LOBBY & OVERLAYS */
body[data-ph=lobby] .sheet, body[data-ph=lobby] .bar,
body[data-ph=count] .sheet, body[data-ph=count] .bar,
body[data-ph=play] #lobby, body[data-ph=play] #net { display: none; }

.lob {
  position: relative; background: var(--card); border: 1px solid var(--line);
  border-radius: 16px; box-shadow: var(--sh); padding: 18px 22px;
  display: flex; flex-direction: column; gap: 12px; overflow: hidden;
}
.lob h2 { font: 700 1.15rem/1 var(--f); margin: 0; }
.lrow { display: flex; flex-wrap: wrap; gap: 18px; }
.lrow label { display: flex; align-items: center; gap: 8px; color: var(--mut); font-size: .9rem; font-weight: 600; }
.rd { padding: 4px 14px; font-size: .85rem; border-radius: 99px; }
.rd[hidden] { display: none; }
.rd.on { background: var(--c); color: #fff; border-color: var(--c); }

#lot {
  position: absolute; inset: 10px; z-index: 2; border-radius: 12px;
  background: color-mix(in srgb, var(--paper) 88%, transparent); backdrop-filter: blur(4px);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
}
#lot[hidden] { display: none; }
.lr { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
.lr span { min-width: 8ch; padding: 12px 22px; border-radius: 12px; border: 1.5px solid var(--line); background: var(--card); font: 700 1.1rem var(--f); color: var(--mut); }
.lr span.hl { border-color: var(--c); color: var(--c); transform: scale(1.06); box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 18%, transparent); }

.clk { font-variant-numeric: tabular-nums; font-weight: 700; color: var(--mut); min-width: 3.4ch; text-align: right; }
.pl.on .clk { color: var(--ink); }
.clk.low { color: #e03131 !important; animation: bl 1s infinite; }
@keyframes bl { 50% { opacity: .4; } }

#cd, #bn { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 3; }
#cd { background: color-mix(in srgb, var(--card) 92%, transparent); font: 700 clamp(1.6rem, 5vw, 2.4rem) var(--f); }
#bn { z-index: 4; font: 700 clamp(1.2rem, 3.8vw, 1.9rem) var(--f); color: var(--c, var(--ink)); text-shadow: 0 2px 18px var(--paper); text-align: center; padding: 0 16px; }
#cd[hidden], #bn[hidden] { display: none; }
#cd b, #bn b { animation: pop var(--d, 1.1s) cubic-bezier(.2,.7,.2,1) both; }
@keyframes pop { 0% { transform: translateY(8px) scale(.96); opacity: 0; } 14% { transform: none; opacity: 1; } 82% { opacity: 1; } 100% { opacity: 0; } }
.sheet.warn { animation: wn 1s infinite; }
@keyframes wn { 50% { box-shadow: 0 0 0 5px rgba(224,49,49,.5), var(--sh); } }

#rin, #rcode { font: 700 1rem ui-monospace, monospace; letter-spacing: .12em; text-transform: uppercase; background: var(--paper); border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; width: 11ch; text-align: center; }
#rcode { font-size: 1.3rem; width: 9ch; border-color: var(--ink); }

/* TOAST NOTIFICATION */
#toast-box {
  position: fixed; bottom: 20px; right: 20px; z-index: 99;
  display: flex; flex-direction: column; gap: 8px; pointer-events: none;
}
.toast {
  background: var(--card); color: var(--ink); border: 1.5px solid var(--line);
  border-left: 4px solid var(--gold); padding: 10px 16px; border-radius: 12px;
  box-shadow: var(--sh); font-weight: 600; font-size: .88rem; max-width: 340px;
  animation: pop 3.2s ease both;
}

/* QUIZ MODAL */
#quiz-modal {
  position: absolute; inset: 0; z-index: 10;
  background: color-mix(in srgb, var(--paper) 92%, rgba(0,0,0,0.25));
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
#quiz-modal[hidden] { display: none; }
.quiz-card {
  background: var(--card); border: 1px solid var(--line); border-radius: 16px;
  box-shadow: var(--sh); width: 100%; max-width: 540px; padding: 24px;
  display: flex; flex-direction: column; gap: 14px;
}
.quiz-header { display: flex; justify-content: space-between; align-items: center; }
.quiz-title { font: 700 1.15rem var(--f); margin: 0; }
.quiz-progress { font-weight: 700; font-size: .85rem; padding: 3px 10px; border-radius: 99px; background: color-mix(in srgb, var(--p2) 15%, transparent); color: var(--p2); }
.quiz-question { font-size: 1rem; font-weight: 600; margin: 0; line-height: 1.45; }
.quiz-options { display: flex; flex-direction: column; gap: 8px; }
.quiz-option { text-align: left; padding: 11px 15px; border-radius: 10px; border: 1px solid var(--line); background: var(--paper); font-weight: 500; }
.quiz-option:hover:not(:disabled) { border-color: var(--p2); background: color-mix(in srgb, var(--p2) 8%, var(--paper)); }
.quiz-option.correct { background: color-mix(in srgb, #2b8a3e 16%, var(--paper)); border-color: #2b8a3e; color: #2b8a3e; font-weight: 700; }
.quiz-option.incorrect { background: color-mix(in srgb, #e03131 16%, var(--paper)); border-color: #e03131; color: #e03131; font-weight: 700; }
.quiz-feedback { font-weight: 700; min-height: 1.5em; text-align: center; }

@media(max-width: 600px) { .players { grid-template-columns: 1fr; } }
</style>
</head>
<body data-ph="lobby">
<main>
  <!-- TOP NAVIGATION & ELO WALLET -->
  <header class="topbar">
    <div class="brand">
      <div class="brand-icon">S</div>
      <div>
        <h1>Sprouts Arena</h1>
        <small>Vẽ đường cong, tạo điểm mới & đấu trí ELO</small>
      </div>
    </div>
    <span class="sp"></span>
    <div class="elo-badge" title="Điểm ELO dùng để đổi đặc quyền bất cứ lúc nào">
      🏆 ELO: <span class="val" id="elo-val">100</span>
      <button class="elo-add" id="elo-test" title="Nhận thử +50 ELO để test tính năng">+50</button>
    </div>
    <button id="mu"></button>
    <button id="th"></button>
  </header>

  <!-- KHO ĐẶC QUYỀN ELO (DÙNG BẤT CỨ LÚC NÀO) -->
  <section class="perks-panel">
    <div class="perks-head">
      <div class="perks-title">⚡ Đặc quyền ELO <small style="color:var(--mut);font-weight:500">(Kích hoạt bất cứ lúc nào khi đủ điểm)</small></div>
      <div class="active-buffs" id="active-buffs"></div>
    </div>
    <div class="perks-grid">
      <button class="perk-btn" id="perk-star" style="--accent:var(--gold)">
        <div class="perk-top"><span>⭐ Ngôi sao hi vọng</span><span class="perk-cost">20 ELO</span></div>
        <span class="perk-desc">Đặt cược vào ván đấu hiện tại/kế tiếp. Thắng nhận <b>x2 ELO</b>!</span>
      </button>

      <button class="perk-btn" id="perk-baycho" style="--accent:var(--purple)">
        <div class="perk-top"><span>🚫 Bảy chọ</span><span class="perk-cost">25 ELO</span></div>
        <span class="perk-desc">Bật khiên "Bảy chọ" chặn mọi lời thách đấu trong <b>3 phút</b>.</span>
      </button>

      <button class="perk-btn" id="perk-time" style="--accent:var(--p2)">
        <div class="perk-top"><span>⏳ Đồng hồ cát</span><span class="perk-cost">15 ELO</span></div>
        <span class="perk-desc">Cộng ngay <b>+45 giây</b> thời gian suy nghĩ trong ván đấu.</span>
      </button>

      <button class="perk-btn" id="perk-oracle" style="--accent:var(--p1)">
        <div class="perk-top"><span>🔮 Thấu thị nước đi</span><span class="perk-cost">25 ELO</span></div>
        <span class="perk-desc">Gợi ý trực quan <b>1 nước đi hợp lệ</b> trên bàn cờ trong 4 giây.</span>
      </button>

      <button class="perk-btn" id="perk-shield" style="--accent:var(--teal)">
        <div class="perk-top"><span>🛡️ Khiên bảo hộ</span><span class="perk-cost">30 ELO</span></div>
        <span class="perk-desc">Miễn nhiễm trừ ELO nếu không may thất bại ở ván đấu này.</span>
      </button>
    </div>
  </section>

  <!-- THẺ NGƯỜI CHƠI -->
  <section class="players">
    <div class="pl" id="c0" style="--c:var(--p1)"><i></i><input id="p0" maxlength="20" value="Player 1" aria-label="Player 1 name"><em id="t0" hidden></em><button class="rd" id="r0"></button><span class="clk" id="k0"></span></div>
    <div class="pl" id="c1" style="--c:var(--p2)"><i></i><input id="p1" maxlength="20" value="Player 2" aria-label="Player 2 name"><em id="t1" hidden></em><button class="rd" id="r1"></button><span class="clk" id="k1"></span></div>
  </section>

  <div id="st" role="status"></div>

  <!-- SẢNH CHỜ (LOBBY) -->
  <section class="lob" id="lobby">
    <h2>Phòng Chờ & Luật Chơi</h2>
    <p id="lm" style="margin:0;color:var(--mut);font-size:.9rem"></p>
    <div class="lrow">
      <label>Số điểm khởi tạo <select id="n"><option value="4">4 Nodes</option><option value="5" selected>5 Nodes</option><option value="6">6 Nodes</option></select></label>
      <label>Phút mỗi người <input id="tm" type="number" min="0" max="999" step="any" value="5"></label>
      <small style="align-self:center;color:var(--mut)">0 = không giới hạn</small>
    </div>
    <div id="cd" hidden></div>
  </section>

  <!-- BÀN CỜ CHÍNH -->
  <div class="sheet" id="sheet">
    <canvas id="c"></canvas>
    <div id="bn" hidden></div>
    <div id="lot" hidden><div class="lr"><span id="l0" style="--c:var(--p1)"></span><span id="l1" style="--c:var(--p2)"></span></div></div>
    <div id="quiz-modal" hidden>
      <div class="quiz-card">
        <div class="quiz-header">
          <h3 id="q-mode-title" class="quiz-title">Thử thách Quiz</h3>
          <span id="q-prog" class="quiz-progress">0/3</span>
        </div>
        <p id="q-text" class="quiz-question">Đang tải câu hỏi...</p>
        <div id="q-options" class="quiz-options"></div>
        <div id="q-fb" class="quiz-feedback"></div>
      </div>
    </div>
  </div>

  <!-- THANH CÔNG CỤ TRONG TRẬN -->
  <div class="bar">
    <span class="sp"></span>
    <button id="zo" title="Thu nhỏ">−</button>
    <button id="zi" title="Phóng to">+</button>
    <button id="ft" title="Căn giữa bàn cờ">Fit</button>
    <button id="un">Undo</button>
    <button id="nw" class="pri">New game</button>
  </div>

  <!-- KẾT NỐI 2 THIẾT BỊ & THÁCH ĐẤU -->
  <details id="net" open>
    <summary>Chơi Online & Thách Đấu Trực Tiếp</summary>
    <div class="row" style="margin-top:8px">
      <button id="rmk" class="pri">Tạo phòng</button>
      <span>hoặc</span>
      <input id="rin" maxlength="40" placeholder="MÃ PHÒNG" autocomplete="off" autocapitalize="characters">
      <button id="rjn">Vào phòng</button>
    </div>
    <div class="row"><label><input type="checkbox" id="stun"> Khác mạng Wi-Fi (STUN Server)</label></div>
    <div class="row" id="rbox" hidden>
      <span>Mã phòng:</span>
      <input id="rcode" readonly size="7">
      <button id="rcpy">Copy mã</button>
      <button id="rlnk" hidden>Copy link</button>
      <button id="rshr" hidden>Chia sẻ</button>
    </div>
    <p id="ns" role="status" style="margin:4px 0;font-size:.88rem"></p>

    <!-- Danh sách người chơi online để thách đấu (chịu tác động của Bảy chọ) -->
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--line)">
      <div style="font-weight:700;font-size:.88rem;color:var(--ink)">🌐 Người chơi đang online (Nhấn để thách đấu):</div>
      <div class="arena-list" id="arena-list">
        <span style="font-size:.82rem;color:var(--mut)">Đang đồng bộ danh sách đấu trường...</span>
      </div>
    </div>

    <details id="man" style="margin-top:10px"><summary>Kết nối thủ công (WebRTC P2P)</summary>
      <div class="row" style="margin-top:8px"><button id="host">Host</button><button id="join">Join</button></div>
      <label for="o">Mã gửi đi</label><textarea id="o" readonly></textarea>
      <div class="row"><button id="cp">Copy</button><button id="sh" hidden>Share</button></div>
      <label for="i">Mã nhận được</label><textarea id="i" placeholder="Dán mã mời hoặc phản hồi tại đây"></textarea>
      <div class="row"><button id="pa">Dán</button><button id="go" disabled>Kết nối</button></div>
    </details>
  </details>

  <details><summary>Luật chơi Sprouts</summary>
    <p>Hai người chơi lần lượt nối hai điểm (hoặc nối một điểm về chính nó thành vòng lặp) bằng đường cong không cắt bất kỳ đường nào và không đi qua điểm khác. Một điểm mới sẽ mọc ở giữa đường vừa vẽ. Mỗi điểm tối đa 3 nhánh nối. Ai hết nước đi hợp lệ trước sẽ thua.</p>
  </details>
</main>

<div id="toast-box"></div>

<script>
const $=id=>document.getElementById(id),cv=$('c'),g=cv.getContext('2d');
const W=900,H=600,R=11,D=2;cv.width=W*D;cv.height=H*D;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim(),pc=p=>css(p?'--p2':'--p1');
let spots,lines,turn,over,hist,cur,dc,pc2,go=false,tout=false,lim=0,clk=[0,0],last=0,lt=0,hov=-1,me=-1,seat=-1,run=false,fc=0,pan=null,pv=null,cam={x:0,y:0,z:1};
const names=['Player 1','Player 2'],ptr=new Map();
let ph='lobby',rdy=[false,false],cdt=0,rz=false,rzA=false,ended=false,warned=false,lsec=-1,bt=0,fxr=false,mute=false,ac;const fx=[];
try{mute=localStorage.getItem('sp-mute')=='1'}catch(e){}

function toast(msg, color='var(--gold)') {
  const box = $('toast-box');
  const el = document.createElement('div');
  el.className = 'toast';
  el.style.borderLeftColor = color;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

// =========================================================================
// HỆ THỐNG ELO & ĐẶC QUYỀN (NGÔI SAO HI VỌNG, BẢY CHỌ, +3 TÍNH NĂNG MỚI)
// =========================================================================
let playerElo = 100;
try {
  const savedElo = localStorage.getItem('sp-elo');
  if (savedElo !== null && !isNaN(Number(savedElo))) playerElo = Math.max(0, Number(savedElo));
} catch(e) {}

const perksState = {
  hopeStar: false,       // Ngôi sao hi vọng (x2 ELO khi thắng)
  bayChoUntil: 0,        // Bảy chọ (Chặn thách đấu 3 phút)
  lossShield: false,     // Khiên bảo hộ (Không bị trừ ELO khi thua)
  hintLine: null         // Thấu thị nước đi (Tọa độ đường gợi ý)
};

const socket = typeof io !== 'undefined' ? io() : null;

function saveAndSyncElo() {
  try { localStorage.setItem('sp-elo', String(playerElo)); } catch(e) {}
  $('elo-val').textContent = playerElo;
  updatePerksUI();
  if (socket) {
    const myIdx = seat >= 0 ? seat : 0;
    socket.emit('update_profile', { name: names[myIdx], elo: playerElo });
  }
}

function updatePerksUI() {
  $('elo-val').textContent = playerElo;
  const now = Date.now();
  const bayChoLeft = Math.max(0, Math.ceil((perksState.bayChoUntil - now) / 1000));

  // Cập nhật trạng thái nút
  $('perk-star').disabled = perksState.hopeStar || playerElo < 20;
  $('perk-star').classList.toggle('active-perk', perksState.hopeStar);

  $('perk-baycho').disabled = bayChoLeft > 0 || playerElo < 25;
  $('perk-baycho').classList.toggle('active-perk', bayChoLeft > 0);

  $('perk-time').disabled = ph !== 'play' || !go || over || !lim || playerElo < 15;

  $('perk-oracle').disabled = ph !== 'play' || !go || over || playerElo < 25;

  $('perk-shield').disabled = perksState.lossShield || playerElo < 30;
  $('perk-shield').classList.toggle('active-perk', perksState.lossShield);

  // Hiển thị các hiệu ứng đang kích hoạt
  const buffs = $('active-buffs');
  buffs.innerHTML = '';
  if (perksState.hopeStar) {
    buffs.innerHTML += `<span class="buff-pill buff-star">⭐ Ngôi sao hi vọng (x2 ELO)</span>`;
  }
  if (bayChoLeft > 0) {
    const m = Math.floor(bayChoLeft / 60);
    const s = String(bayChoLeft % 60).padStart(2, '0');
    buffs.innerHTML += `<span class="buff-pill buff-block">🚫 Bảy chọ (${m}:${s})</span>`;
  }
  if (perksState.lossShield) {
    buffs.innerHTML += `<span class="buff-pill buff-shield">🛡️ Khiên bảo hộ</span>`;
  }
}

// 1. Kích hoạt Ngôi sao hi vọng (20 ELO)
$('perk-star').onclick = () => {
  if (perksState.hopeStar || playerElo < 20) return;
  playerElo -= 20;
  perksState.hopeStar = true;
  snd('chime');
  toast('⭐ Đã kích hoạt Ngôi sao hi vọng! Thắng ván này sẽ nhận x2 ELO!', 'var(--gold)');
  saveAndSyncElo();
};

// 2. Kích hoạt Bảy chọ (25 ELO - Chặn thách đấu 3 phút)
$('perk-baycho').onclick = () => {
  if (perksState.bayChoUntil > Date.now() || playerElo < 25) return;
  playerElo -= 25;
  perksState.bayChoUntil = Date.now() + 3 * 60 * 1000;
  snd('ready');
  toast('🚫 Đã bật "Bảy chọ"! Chặn mọi lời thách đấu trong 3 phút.', 'var(--purple)');
  if (socket) socket.emit('activate_bay_cho');
  saveAndSyncElo();
};

// 3a. Kích hoạt Đồng hồ cát (15 ELO - +45 giây)
$('perk-time').onclick = () => {
  if (ph !== 'play' || !go || over || !lim || playerElo < 15) return;
  playerElo -= 15;
  const targetIdx = seat >= 0 ? seat : turn;
  clk[targetIdx] += 45000;
  snd('go');
  clocks();
  send({ t: 'state', s: pack() });
  toast('⏳ Đồng hồ cát: +45 giây thời gian suy nghĩ!', 'var(--p2)');
  saveAndSyncElo();
};

// 3b. Kích hoạt Thấu thị nước đi (25 ELO - Gợi ý 1 nước đi hợp lệ)
$('perk-oracle').onclick = () => {
  if (ph !== 'play' || !go || over || playerElo < 25) return;
  const hint = findValidMoveHint();
  if (!hint) {
    toast('Không tìm thấy nước đi khả thi nào trên bàn cờ!', '#e03131');
    return;
  }
  playerElo -= 25;
  perksState.hintLine = hint;
  snd('sat');
  draw();
  toast('🔮 Thấu thị: Đường nét đứt màu vàng là nước đi hợp lệ!', 'var(--p1)');
  saveAndSyncElo();
  setTimeout(() => { perksState.hintLine = null; draw(); }, 4500);
};

// 3c. Kích hoạt Khiên bảo hộ (30 ELO - Miễn trừ điểm khi thua)
$('perk-shield').onclick = () => {
  if (perksState.lossShield || playerElo < 30) return;
  playerElo -= 30;
  perksState.lossShield = true;
  snd('ready');
  toast('🛡️ Đã trang bị Khiên bảo hộ! Không bị trừ ELO nếu thua.', 'var(--teal)');
  saveAndSyncElo();
};

$('elo-test').onclick = () => {
  playerElo += 50;
  snd('chime');
  toast('🎁 Đã cộng +50 ELO trải nghiệm!', 'var(--gold)');
  saveAndSyncElo();
};

// Tìm nước đi hợp lệ cho tính năng Thấu thị
function findValidMoveHint() {
  for (let i = 0; i < spots.length; i++) {
    if (lives(spots[i]) <= 0) continue;
    for (let j = i; j < spots.length; j++) {
      if (i === j && lives(spots[i]) < 2) continue;
      if (i !== j && lives(spots[j]) <= 0) continue;
      const a = [spots[i].x, spots[i].y];
      const b = [spots[j].x, spots[j].y];
      if (i !== j) {
        // Kiểm tra đoạn thẳng trực tiếp
        let ok = true;
        for (const l of lines) {
          for (let k = 0; k < l.p.length - 1; k++) {
            if (cross(a, b, l.p[k], l.p[k+1])) { ok = false; break; }
          }
          if (!ok) break;
        }
        for (let s = 0; s < spots.length; s++) {
          if (s !== i && s !== j && pd([spots[s].x, spots[s].y], a, b) < R + 4) { ok = false; break; }
        }
        if (ok) return [a, b];
      } else {
        // Thử tạo vòng lặp nhỏ quanh điểm i
        for (let ang = 0; ang < 8; ang++) {
          const rad = ang * Math.PI / 4;
          const p1 = [a[0] + Math.cos(rad - 0.5) * 38, a[1] + Math.sin(rad - 0.5) * 38];
          const p2 = [a[0] + Math.cos(rad) * 52, a[1] + Math.sin(rad) * 52];
          const p3 = [a[0] + Math.cos(rad + 0.5) * 38, a[1] + Math.sin(rad + 0.5) * 38];
          const loopPts = [a, p1, p2, p3, a];
          let ok = true;
          for (let seg = 0; seg < loopPts.length - 1; seg++) {
            for (const l of lines) {
              for (let k = 0; k < l.p.length - 1; k++) {
                if (cross(loopPts[seg], loopPts[seg+1], l.p[k], l.p[k+1])) { ok = false; break; }
              }
              if (!ok) break;
            }
            for (let s = 0; s < spots.length; s++) {
              if (s !== i && pd([spots[s].x, spots[s].y], loopPts[seg], loopPts[seg+1]) < R + 4) { ok = false; break; }
            }
            if (!ok) break;
          }
          if (ok) return loopPts;
        }
      }
    }
  }
  return null;
}

// Socket.IO sự kiện Đấu trường & Thách đấu
if (socket) {
  socket.on('lobby_users', (users) => {
    const box = $('arena-list');
    const others = users.filter(u => u.id !== socket.id);
    if (!others.length) {
      box.innerHTML = `<span style="font-size:.82rem;color:var(--mut)">Chưa có người chơi khác online. Hãy mở tab mới để thử thách đấu!</span>`;
      return;
    }
    box.innerHTML = '';
    others.forEach(u => {
      const card = document.createElement('div');
      card.className = 'arena-user';
      card.innerHTML = `
        <div class="arena-user-info">
          <b>${u.name}</b>
          <span>🏆 ${u.elo} ELO ${u.isProtected ? `· 🚫 Bảy chọ (${u.remainingShield}s)` : ''}</span>
        </div>
        <button class="btn-chal ${u.isProtected ? 'protected' : 'pri'}">${u.isProtected ? 'Đang chặn' : 'Thách đấu'}</button>
      `;
      card.querySelector('button').onclick = async () => {
        if (!room) await hostRoom();
        socket.emit('send_challenge', { targetId: u.id, roomCode: room });
        toast(`⚔️ Đã gửi lời thách đấu tới ${u.name}!`, 'var(--p2)');
      };
      box.appendChild(card);
    });
  });

  socket.on('challenge_blocked', (data) => {
    snd('bad');
    toast(data.message, 'var(--purple)');
  });

  socket.on('receive_challenge', (data) => {
    snd('chime');
    if (confirm(`⚔️ ${data.fromName} (${data.fromElo} ELO) thách đấu bạn! Chấp nhận vào phòng ${data.roomCode}?`)) {
      joinRoom(data.roomCode);
    }
  });
}

setInterval(updatePerksUI, 1000);

// ---- UNIQUE PLAYER NAME & VALIDATION SYSTEM ----
function normalizePlayerName(name) {
  if (typeof name !== 'string') return '';
  return name.trim().replace(/\s+/g, ' ');
}

function validateUniquePlayerName(name, playerId, currentNames) {
  const norm = normalizePlayerName(name);
  if (!norm || norm.length < 2 || norm.length > 20) return { valid: false, message: 'Tên phải từ 2 đến 20 ký tự và không được để trống.' };
  for (let i = 0; i < currentNames.length; i++) {
    if (i !== playerId && normalizePlayerName(currentNames[i]).toLowerCase() === norm.toLowerCase()) {
      return { valid: false, message: 'Tên này đã được người chơi khác sử dụng.' };
    }
  }
  return { valid: true, normalized: norm };
}

// ---- QUIZ SYSTEM (TẢI TỪ quizz.json) ----
let quizBank = [];
let quizSessionActive = false;
let consecutiveCorrect = 0;
let currentQuestion = null;
let quizCompleted = false;
let usedQuestionIds = new Set();
let baseMatchEloDelta = 15;

async function loadQuizData() {
  try {
    const res = await fetch('quizz.json');
    const data = await res.json();
    quizBank = data.questions || [];
  } catch(e) {
    console.error('Không thể tải ngân hàng câu hỏi quizz.json', e);
  }
}
loadQuizData();

function startQuizSession(isWinner) {
  if (quizBank.length === 0) {
    finalizeMatchScore(isWinner, false);
    return;
  }
  quizSessionActive = true;
  consecutiveCorrect = 0;
  quizCompleted = false;
  usedQuestionIds.clear();

  $('quiz-modal').hidden = false;
  $('q-mode-title').textContent = isWinner
    ? '🏆 Thưởng Người Thắng (Đúng 3 câu = +50% ELO)'
    : '🛡️ Cứu trợ Người Thua (Đúng 3 câu = giảm phạt còn 2 ELO)';
  showNextQuizQuestion();
}

function showNextQuizQuestion() {
  if (consecutiveCorrect >= 3 || quizCompleted) return;
  const available = quizBank.filter(q => !usedQuestionIds.has(q.id));
  if (available.length === 0) {
    usedQuestionIds.clear();
    available.push(...quizBank);
  }

  const q = available[Math.floor(Math.random() * available.length)];
  usedQuestionIds.add(q.id);

  const originalOptions = q.options.map((opt, idx) => ({ text: opt, isCorrect: idx === q.answer }));
  for (let i = originalOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [originalOptions[i], originalOptions[j]] = [originalOptions[j], originalOptions[i]];
  }

  currentQuestion = {
    id: q.id,
    question: q.question,
    options: originalOptions.map(o => o.text),
    answer: originalOptions.findIndex(o => o.isCorrect)
  };

  $('q-prog').textContent = `${consecutiveCorrect}/3`;
  $('q-text').textContent = currentQuestion.question;
  $('q-fb').textContent = '';

  const optContainer = $('q-options');
  optContainer.innerHTML = '';
  currentQuestion.options.forEach((optText, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option';
    btn.textContent = `${String.fromCharCode(65 + idx)}. ${optText}`;
    btn.onclick = () => handleQuizAnswer(idx, btn);
    optContainer.appendChild(btn);
  });
}

function handleQuizAnswer(selectedIndex, btnElement) {
  if (quizCompleted || !currentQuestion) return;
  const allBtns = document.querySelectorAll('.quiz-option');
  allBtns.forEach(b => b.disabled = true);

  const isCorrect = selectedIndex === currentQuestion.answer;
  if (isCorrect) {
    btnElement.classList.add('correct');
    consecutiveCorrect++;
    snd('chime');
    $('q-fb').textContent = 'Chính xác! 🎉';
  } else {
    btnElement.classList.add('incorrect');
    allBtns[currentQuestion.answer].classList.add('correct');
    consecutiveCorrect = 0;
    snd('bad');
    $('q-fb').textContent = 'Chưa chính xác. Chuỗi đúng về 0! ❌';
  }

  $('q-prog').textContent = `${consecutiveCorrect}/3`;

  const w = turn ^ 1;
  const isWinner = (seat >= 0 ? seat === w : true);

  setTimeout(() => {
    if (consecutiveCorrect >= 3) {
      quizCompleted = true;
      $('q-fb').textContent = '✨ Hoàn thành xuất sắc 3 câu liên tiếp!';
      setTimeout(() => {
        $('quiz-modal').hidden = true;
        finalizeMatchScore(isWinner, true);
      }, 1000);
    } else if (!isCorrect) {
      quizCompleted = true;
      $('q-fb').textContent = 'Kết thúc lượt cứu trợ/thưởng Quiz.';
      setTimeout(() => {
        $('quiz-modal').hidden = true;
        finalizeMatchScore(isWinner, false);
      }, 1000);
    } else {
      showNextQuizQuestion();
    }
  }, 900);
}

let scoreFinalized = false;
function finalizeMatchScore(isWinner, streakAchieved) {
  if (scoreFinalized) return;
  scoreFinalized = true;

  let delta = 0;
  let reportText = '';

  if (isWinner) {
    delta = streakAchieved ? Math.round(baseMatchEloDelta * 1.5) : baseMatchEloDelta;
    if (perksState.hopeStar) {
      delta *= 2;
      perksState.hopeStar = false;
      reportText = `⭐ NGÔI SAO HI VỌNG x2! Chiến thắng nhận +${delta} ELO!`;
    } else {
      reportText = `🏆 CHIẾN THẮNG! Nhận +${delta} ELO!`;
    }
    perksState.lossShield = false;
    playerElo += delta;
  } else {
    perksState.hopeStar = false;
    if (perksState.lossShield) {
      perksState.lossShield = false;
      delta = 0;
      reportText = `🛡️ KHIÊN BẢO HỘ KÍCH HOẠT! Bạn không bị trừ ELO.`;
    } else {
      delta = streakAchieved ? 2 : 10;
      playerElo = Math.max(0, playerElo - delta);
      reportText = streakAchieved
        ? `🛡️ CỨU TRỢ QUIZ THÀNH CÔNG! Chỉ bị trừ ${delta} ELO.`
        : `💔 THẤT BẠI! Bị trừ ${delta} ELO.`;
    }
  }

  saveAndSyncElo();
  banner(reportText, pc(turn^1), 4000);
  toast(reportText, isWinner ? 'var(--gold)' : '#e03131');
}

// ---- SOUND ----
function tone(f,d=.12,ty='sine',v=.15,at=0,f2){if(mute)return;try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state=='suspended')ac.resume();const t=ac.currentTime+at,o=ac.createOscillator(),a=ac.createGain();o.type=ty;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);a.gain.setValueAtTime(.0001,t);a.gain.exponentialRampToValueAtTime(v,t+.01);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(ac.destination);o.start(t);o.stop(t+d+.05)}catch(e){}}
const SND={
 tick:()=>tone(900,.04,'square',.03),ready:()=>{tone(520,.08,'triangle',.15);tone(780,.1,'triangle',.15,.07)},unready:()=>tone(520,.1,'triangle',.12,0,330),
 cd:()=>tone(440,.15,'sine',.2),chime:()=>{tone(784,.3,'triangle',.18);tone(1175,.4,'triangle',.14,.08)},
 go:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.25,'triangle',.18,i*.09)),
 move:()=>tone(300,.18,'sine',.2,0,600),
 sat:()=>{tone(300,.18,'sine',.2,0,600);tone(1200,.3,'triangle',.15,.1,1800);tone(1800,.25,'sine',.08,.18)},
 low:h=>tone(h?1400:1000,.09,'square',.07),warn:()=>{tone(700,.15,'sawtooth',.08);tone(700,.15,'sawtooth',.08,.2)},
 win:()=>[523,659,784,1047,1319].forEach((f,i)=>tone(f,.3,'triangle',.18,i*.1)),lose:()=>[392,330,262,196].forEach((f,i)=>tone(f,.35,'sawtooth',.09,i*.14)),
 buzz:()=>tone(120,.5,'sawtooth',.15),bad:()=>tone(160,.08,'square',.06)};
const snd=(k,a)=>SND[k]&&SND[k](a);
function setMute(v){mute=v;try{localStorage.setItem('sp-mute',v?'1':'0')}catch(e){}$('mu').textContent=v?'🔇 Tắt âm':'🔊 Âm thanh'}

// ---- VISUAL EFFECTS ----
function banner(t,c,ms=1100){const e=$('bn'),b=document.createElement('b');b.textContent=t;e.style.setProperty('--c',c||'');e.style.setProperty('--d',ms+'ms');e.replaceChildren(b);e.hidden=false;clearTimeout(bt);bt=setTimeout(()=>e.hidden=true,ms)}
function burst(x,y,col,n=14,v=2.5,life=700,ring=1){const t=performance.now();if(ring)fx.push({x,y,col,t,life,ring:1});for(let i=0;i<n;i++){const a=Math.random()*6.283,s=v*(.4+Math.random());fx.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,col,t,life:life*(.6+Math.random()*.6)})}if(!fxr){fxr=true;requestAnimationFrame(fxStep)}}
function fxStep(){const now=performance.now();for(let i=fx.length;i--;)if(now-fx[i].t>fx[i].life)fx.splice(i,1);draw();if(fx.length)requestAnimationFrame(fxStep);else fxr=false}
function satFx(pd,col){let n=0;spots.forEach((s,i)=>{if(i<pd.length&&s.d>=3&&pd[i]<3){n++;burst(s.x,s.y,col)}});const m=spots[spots.length-1];burst(m.x,m.y,col,6,1.2,500,0);snd(n?'sat':'move')}
function endFx(){
  const w=turn^1,col=pc(w),mine=seat<0||seat==w;lt++;if(tout)snd('buzz');setTimeout(()=>snd(mine?'win':'lose'),tout?500:0);
  banner((rz?'Đầu hàng! ':tout?'Hết giờ! ':'')+names[w]+' chiến thắng!',col,3200);
  for(let k=0;k<6;k++)setTimeout(()=>{const q=wld([Math.random()*W,Math.random()*H]);burst(q[0],q[1],col,18,3,1000)},k*180);
  
  setTimeout(() => {
    scoreFinalized = false;
    const isWinner = (seat >= 0 ? seat === w : true);
    startQuizSession(isWinner);
  }, 1500);
}

// ---- LOBBY / READY / COUNTDOWN ----
function setPh(p){ph=p;document.body.dataset.ph=p;lobbyUI();updatePerksUI()}
function lobbyUI(){
  const L=ph=='lobby';
  [0,1].forEach(i=>{const b=$('r'+i);b.hidden=ph=='play';b.classList.toggle('on',rdy[i]);b.textContent=rdy[i]?'✓ Sẵn sàng':'Sẵn sàng?';b.disabled=!L||(seat>=0&&i!=seat);
    $('p'+i).disabled=!L||rdy[i]||(seat>=0&&i!=seat)});
  $('n').disabled=$('tm').disabled=!L||seat==1;
  $('lm').textContent=seat<0?'Cả 2 người chơi bấm Sẵn sàng để bắt đầu. Chơi 2 máy? Mở mục “Chơi Online & Thách Đấu” bên dưới.':'Online: bạn là '+names[seat]+' ('+(seat?'Xanh':'Đỏ')+'). '+(seat?'Chủ phòng chọn luật.':'Bạn là chủ phòng.')
}
function setRdy(i,v){rdy[i]=v;snd(v?'ready':'unready');lobbyUI();info();if(ph=='lobby'&&rdy[0]&&rdy[1]&&seat!=1){send({t:'count'});runCount()}}
function runCount(){
  setPh('count');const e=$('cd'),b=document.createElement('b');b.textContent='Trận đấu bắt đầu!';e.replaceChildren(b);e.hidden=false;snd('chime');info();
  cdt=setTimeout(()=>{e.hidden=true;if(seat!=1)newGame()},1100);
}
function toLobby(s){if(s)send({t:'lobby'});clearTimeout(cdt);lt++;$('lot').hidden=$('cd').hidden=$('bn').hidden=$('quiz-modal').hidden=true;spots=[];lines=[];hist=[];fx.length=0;over=tout=rz=go=false;cur=null;rdy=[false,false];perksState.hintLine=null;setPh('lobby');info();draw()}
function resign(i){if(over||ph!='play')return;lt++;$('lot').hidden=true;go=true;turn=i;rz=true;over=true;tout=false;cur=null;info();draw()}
const lives=s=>3-s.d,len=P=>P.reduce((t,q,i)=>i?t+Math.hypot(q[0]-P[i-1][0],q[1]-P[i-1][1]):0,0);
const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const cross=(a,b,c,d)=>cr(a,b,c)*cr(a,b,d)<0&&cr(c,d,a)*cr(c,d,b)<0;
function pd(p,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],l=dx*dx+dy*dy;let t=l?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/l:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy)}
const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]};
const wld=q=>[(q[0]-W/2)/cam.z+cam.x,(q[1]-H/2)/cam.z+cam.y];
function zoomAt(q,z){const w=wld(q);cam.z=Math.min(4,Math.max(.15,z));cam.x=w[0]-(q[0]-W/2)/cam.z;cam.y=w[1]-(q[1]-H/2)/cam.z}
function bbox(){let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const a=(x,y)=>{x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)};spots.forEach(s=>a(s.x,s.y));lines.forEach(l=>l.p.forEach(q=>a(q[0],q[1])));return[x0,y0,x1,y1]}
function fit(){const[x0,y0,x1,y1]=bbox();cam={x:(x0+x1)/2,y:(y0+y1)/2,z:Math.max(.15,Math.min(1.5,.85*Math.min(W/(x1-x0+90),H/(y1-y0+90))))};draw()}

function newGame(){
  const n=parseInt($('n').value, 10);
  const validSpots = [4, 5, 6].includes(n) ? n : 5;
  spots=[];lines=[];hist=[];over=tout=false;cur=null;rz=ended=warned=false;lsec=-1;fx.length=0;perksState.hintLine=null;setPh('play');
  lim=Math.round(Math.max(0,+$('tm').value||0)*60000);clk=[lim,lim];turn=Math.random()<.5?0:1;
  for(let t=0;spots.length<validSpots&&t<2000;t++){
    const p={x:(Math.random()-.5)*(W-140),y:(Math.random()-.5)*(H-140),d:0};
    if(spots.every(s=>Math.hypot(s.x-p.x,s.y-p.y)>(t>1000?70:130)))spots.push(p);
  }
  cam={x:0,y:0,z:1};info();draw();send({t:'state',s:pack(),lot:1});lottery(turn);
}
function lottery(target){
  const o=$('lot'),sp=[$('l0'),$('l1')],tk=++lt;go=false;o.hidden=false;
  sp.forEach((e,i)=>{e.textContent=names[i];e.classList.remove('hl')});
  let N=9,t=0,d=45;if((N-1)%2!=target)N++;info();
  const step=()=>{
    if(tk!=lt)return;
    snd('tick');sp.forEach((e,i)=>e.classList.toggle('hl',i==t%2));
    if(++t<N)setTimeout(step,d*=1.12);
    else setTimeout(()=>{if(tk!=lt)return;o.hidden=true;go=true;last=performance.now();snd('go');banner(names[turn]+' đi trước!',pc(turn));info();updatePerksUI();draw()},260)
  };
  step();
}
const fmt=ms=>{const s=Math.ceil(ms/1000);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function clocks(){const pl=ph=='play';[0,1].forEach(i=>{const e=$('k'+i);e.textContent=!pl?'':lim?fmt(clk[i]):'∞';e.classList.toggle('low',pl&&!!lim&&go&&!over&&turn==i&&clk[i]<30000)});$('sheet').classList.toggle('warn',pl&&!!lim&&go&&!over&&clk[turn]<10000)}
function clockTick(){
  const now=performance.now();
  if(go&&!over&&lim){clk[turn]-=now-last;if(clk[turn]<=0){clk[turn]=0;over=tout=true;cur=null;info();draw()}else{const s=Math.ceil(clk[turn]/1000);if(s!=lsec){lsec=s;if(s<=10)snd('low',s<=3);else if(s==30)snd('warn')}}}
  last=now;clocks();
}
function th(t){document.documentElement.dataset.theme=t;try{localStorage.setItem('sp-theme',t)}catch(e){}$('th').textContent=t=='dark'?'☀ Sáng':'☾ Tối';if(spots)draw()}
const snap=()=>JSON.stringify({spots,lines,turn});
function undo(){if(!hist.length||tout||!go)return;({spots,lines,turn}=JSON.parse(hist.pop()));over=false;cur=null;perksState.hintLine=null;info();draw();wake()}

function legal(a,b,s,t){
  const P=cur.path;
  for(const l of lines)for(let i=0;i<l.p.length-1;i++)if(cross(a,b,l.p[i],l.p[i+1]))return false;
  for(let i=0;i<P.length-2;i++)if(cross(a,b,P[i],P[i+1]))return false;
  for(let k=0;k<spots.length;k++)if(k!=s&&k!=t&&pd([spots[k].x,spots[k].y],a,b)<R+3)return false;
  if(t<0&&!spots.some(q=>Math.hypot(q.x-b[0],q.y-b[1])<R+10)){
    for(const l of lines)for(let i=0;i<l.p.length-1;i++)if(pd(b,l.p[i],l.p[i+1])<5)return false;
    for(let i=0;i<P.length-8;i++)if(pd(b,P[i],P[i+1])<5)return false;
  }
  return true;
}
function extend(q){
  const P=cur.path,wb=cur.bad;cur.bad=false;
  for(;;){
    const a=P[P.length-1],d=Math.hypot(q[0]-a[0],q[1]-a[1]);if(d<5)break;
    const b=[a[0]+(q[0]-a[0])*5/d,a[1]+(q[1]-a[1])*5/d];
    if(!legal(a,b,cur.s,-1)){cur.bad=true;if(!wb)snd('bad');break}
    P.push(b);
  }
  for(let k=0;k<spots.length;k++){
    const S=spots[k],c=[S.x,S.y],a=P[P.length-1];
    if(Math.hypot(S.x-q[0],S.y-q[1])>R+8)continue;
    const total=len(P)+Math.hypot(a[0]-c[0],a[1]-c[1]);
    const ok=k==cur.s?lives(S)>1&&total>=80:lives(S)>0&&total>=60;
    if(ok&&legal(a,c,cur.s,k)){P.push(c);commit(k);return}
  }
}
function commit(k){
  clockTick();if(over){cur=null;return}
  perksState.hintLine=null;
  const P=cur.path,s=cur.s,ni=spots.length,pd=spots.map(q=>q.d);hist.push(snap());
  let L=len(P)/2,i=0,m=P[P.length-1];
  for(;i<P.length-1;i++){
    const d=Math.hypot(P[i+1][0]-P[i][0],P[i+1][1]-P[i][1]);
    if(L<=d){const t=L/d;m=[P[i][0]+(P[i+1][0]-P[i][0])*t,P[i][1]+(P[i+1][1]-P[i][1])*t];break}
    L-=d;
  }
  const e1={p:[...P.slice(0,i+1),m],a:s,b:ni,c:turn},e2={p:[m,...P.slice(i+1)],a:ni,b:k,c:turn};
  spots[s].d++;spots[k].d++;spots.push({x:m[0],y:m[1],d:2});lines.push(e1,e2);rs(e1,10);rs(e2,10);satFx(pd,pc(turn));
  cur=null;turn^=1;last=performance.now();over=!movesLeft();send({t:'state',s:pack()});info();draw();wake();
}

const bad=(p,self)=>lines.some(l=>l!=self&&l.p.some((q,i)=>i&&p.some((r,j)=>j&&cross(p[j-1],r,l.p[i-1],q))));
function rs(l,h=12){
  const p=l.p,c=[0];let T=0;
  for(let i=1;i<p.length;i++)c.push(T+=Math.hypot(p[i][0]-p[i-1][0],p[i][1]-p[i-1][1]));
  l.L=T;const n=Math.max(3,Math.round(T/h)+1),o=[p[0]];
  for(let k=1,j=1;k<n-1;k++){const t=T*k/(n-1);while(c[j]<t)j++;const u=(t-c[j-1])/((c[j]-c[j-1])||1);o.push([p[j-1][0]+(p[j][0]-p[j-1][0])*u,p[j-1][1]+(p[j][1]-p[j-1][1])*u])}
  o.push(p[p.length-1]);if(!bad(o,l))l.p=o;
}
function relax(){
  let mv=0;const hash=new Map(),HC=40;
  lines.forEach((l,e)=>{const A=spots[l.a],B=spots[l.b],z=l.p[l.p.length-1];l.p[0][0]=A.x;l.p[0][1]=A.y;z[0]=B.x;z[1]=B.y;
    l.p.forEach((q,i)=>{if(i&&i<l.p.length-1){const k=Math.floor(q[0]/HC)*65536+Math.floor(q[1]/HC);if(!hash.has(k))hash.set(k,[]);hash.get(k).push([e,i])}})});
  const near=(x,y,f)=>{const cx=Math.floor(x/HC),cy=Math.floor(y/HC);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++){const L=hash.get((cx+a)*65536+cy+b);if(L)L.forEach(f)}};
  const segOK=(A,B)=>{let ok=true;near((A[0]+B[0])/2,(A[1]+B[1])/2,([f,j])=>{if(!ok)return;const q=lines[f].p;if(cross(A,B,q[j-1],q[j])||cross(A,B,q[j],q[j+1]))ok=false});return ok};
  const push=(o,kx,ky,fx,fy,test)=>{const m=Math.hypot(fx,fy);if(m>9){fx*=9/m;fy*=9/m}o[kx]+=fx;o[ky]+=fy;if(test())mv=Math.max(mv,Math.hypot(fx,fy));else{o[kx]-=fx;o[ky]-=fy}};
  const rep=(x,y,ox,oy,r,k)=>{const dx=x-ox,dy=y-oy,dd=Math.hypot(dx,dy);return dd<r&&dd>.01?[dx*k*(r-dd)/dd,dy*k*(r-dd)/dd]:[0,0]};
  lines.forEach((l,e)=>{const p=l.p,n=p.length;
    for(let i=1;i<n-1;i++){const q=p[i];
      let fx=.5*((p[i-1][0]+p[i+1][0])/2-q[0]),fy=.5*((p[i-1][1]+p[i+1][1])/2-q[1]);
      near(q[0],q[1],([f,j])=>{if(f==e&&Math.abs(j-i)<5)return;const o=lines[f].p[j],r=rep(q[0],q[1],o[0],o[1],34,.5);fx+=r[0];fy+=r[1]});
      spots.forEach((s,si)=>{if(l.a==si||l.b==si)return;const r=rep(q[0],q[1],s.x,s.y,44,.4);fx+=r[0];fy+=r[1]});
      push(q,0,1,fx,fy,()=>segOK(p[i-1],q)&&segOK(q,p[i+1]));
    }});
  spots.forEach((s,si)=>{
    let fx=0,fy=0;
    lines.forEach(l=>{if(l.a==si){const o=l.p[1];fx+=.12*(o[0]-s.x);fy+=.12*(o[1]-s.y)}if(l.b==si){const o=l.p[l.p.length-2];fx+=.12*(o[0]-s.x);fy+=.12*(o[1]-s.y)}});
    near(s.x,s.y,([f,j])=>{const L=lines[f];if(L.a==si||L.b==si)return;const o=L.p[j],r=rep(s.x,s.y,o[0],o[1],44,.4);fx+=r[0];fy+=r[1]});
    spots.forEach((t,ti)=>{if(ti!=si){const r=rep(s.x,s.y,t.x,t.y,90,.25);fx+=r[0];fy+=r[1]}});
    const sy=()=>lines.forEach(l=>{if(l.a==si){l.p[0][0]=s.x;l.p[0][1]=s.y}if(l.b==si){const z=l.p[l.p.length-1];z[0]=s.x;z[1]=s.y}});
    push(s,'x','y',fx,fy,()=>{sy();return lines.every(l=>(l.a!=si||segOK(l.p[0],l.p[1]))&&(l.b!=si||segOK(l.p[l.p.length-2],l.p[l.p.length-1])))});
    sy();
  });
  if(++fc%30==0)lines.forEach(l=>{if(!l.L||Math.abs(len(l.p)-l.L)>.25*l.L)rs(l)});
  return mv;
}
function wake(){if(!run){run=true;requestAnimationFrame(tick)}}
function tick(){
  run=false;if(cur||!lines.length)return;
  let m=0;const it=lines.reduce((t,l)=>t+l.p.length,0)<900?4:2;for(let k=0;k<it;k++)m=Math.max(m,relax());
  draw();if(m>.05)wake();
}

function movesLeft(){
  let[x0,y0,x1,y1]=bbox();x0-=70;y0-=70;x1+=70;y1+=70;
  const sc=Math.min(1,1100/Math.max(x1-x0,y1-y0)),w=Math.ceil((x1-x0)*sc),hh=Math.ceil((y1-y0)*sc);
  const m=document.createElement('canvas');m.width=w;m.height=hh;
  const h=m.getContext('2d',{willReadFrequently:true});
  h.fillStyle='#fff';h.fillRect(0,0,w,hh);h.setTransform(sc,0,0,sc,-x0*sc,-y0*sc);
  h.strokeStyle=h.fillStyle='#000';h.lineWidth=Math.max(3,2/sc);h.lineJoin=h.lineCap='round';
  for(const l of lines){h.beginPath();l.p.forEach((q,i)=>i?h.lineTo(q[0],q[1]):h.moveTo(q[0],q[1]));h.stroke()}
  for(const s of spots){h.beginPath();h.arc(s.x,s.y,R+1,0,7);h.fill()}
  const px=h.getImageData(0,0,w,hh).data,N=w*hh,lab=new Int32Array(N),st=new Int32Array(N);let n=0;
  for(let i=0;i<N;i++){
    if(lab[i]||px[i*4]<200)continue;
    n++;let sp=0;st[sp++]=i;lab[i]=n;
    while(sp){
      const j=st[--sp],cx=j%w;
      for(const k of[j-1,j+1,j-w,j+w]){
        if(k<0||k>=N||(k==j-1&&cx==0)||(k==j+1&&cx==w-1)||lab[k]||px[k*4]<200)continue;
        lab[k]=n;st[sp++]=k;
      }
    }
  }
  const reg={};
  spots.forEach((s,i)=>{
    const l=lives(s);if(l<1)return;
    for(let a=0;a<24;a++){
      const X=Math.round((s.x-x0+(R+5)*Math.cos(a*Math.PI/12))*sc),Y=Math.round((s.y-y0+(R+5)*Math.sin(a*Math.PI/12))*sc);
      if(X<0||Y<0||X>=w||Y>=hh)continue;
      const r=lab[Y*w+X];if(!r)continue;
      (reg[r]=reg[r]||new Set()).add(i);if(l>1)reg[r].loop=1;
    }
  });
  return Object.values(reg).some(v=>v.size>1||v.loop);
}

function info(){
  const e=$('st'),mv=lines.length/2,t=x=>document.createTextNode(x),w=over?turn^1:-1;
  [0,1].forEach(i=>{$('c'+i).classList.toggle('on',over?w==i:go&&turn==i);const tg=[seat==i?'bạn':'',w==i?'thắng':''].filter(Boolean).join(' · '),el=$('t'+i);el.textContent=tg;el.hidden=!tg});
  const b=p=>{const x=document.createElement('b');x.style.color=pc(p);x.textContent=names[p];return x};
  e.replaceChildren(...(over?(rz?[b(turn),t(' đã đầu hàng. '),b(turn^1),t(' chiến thắng!')]:tout?[b(turn),t(' hết giờ. '),b(turn^1),t(' chiến thắng!')]:[b(turn^1),t(' thắng sau '+mv+' nước đi. '),b(turn),t(' hết đường đi.')])
    :ph!='play'?[t(ph=='count'?'Trận đấu bắt đầu':rdy[0]&&rdy[1]?'Đang khởi tạo…':rdy[0]||rdy[1]?names[rdy[0]?0:1]+' đã sẵn sàng. Đang chờ '+names[rdy[0]?1:0]+'.':'Chọn luật chơi, sau đó cả 2 cùng bấm Sẵn sàng.')]:!go?[t('Đang bốc thăm người đi trước…')]
    :seat>=0&&turn!=seat?[t('Đang chờ '),b(turn),t(' đi nước tiếp theo…')]
    :[b(turn),t((seat>=0?', lượt của bạn: ':': ')+'kéo nối 2 điểm hoặc tạo vòng lặp. Số nước đã đi: '+mv+'.')]));
  clocks();$('nw').textContent=over?'Về sảnh chờ':rzA?'Chắc chắn đầu hàng?':'Đầu hàng';$('nw').disabled=ph!='play'||(!over&&!go);
  updatePerksUI();
  if(over&&ph=='play'&&!ended){ended=true;endFx()}
}
function draw(){
  g.setTransform(D,0,0,D,0,0);g.clearRect(0,0,W,H);
  g.setTransform(D*cam.z,0,0,D*cam.z,D*(W/2-cam.x*cam.z),D*(H/2-cam.y*cam.z));
  g.lineCap=g.lineJoin='round';
  const ink=css('--ink'),paper=css('--paper'),gs=30*cam.z<9?150:30,vx=W/2/cam.z,vy=H/2/cam.z;
  g.lineWidth=1/cam.z;g.strokeStyle=css('--grid');g.beginPath();
  for(let x=Math.ceil((cam.x-vx)/gs)*gs;x<=cam.x+vx;x+=gs){g.moveTo(x,cam.y-vy);g.lineTo(x,cam.y+vy)}
  for(let y=Math.ceil((cam.y-vy)/gs)*gs;y<=cam.y+vy;y+=gs){g.moveTo(cam.x-vx,y);g.lineTo(cam.x+vx,y)}
  g.stroke();g.lineWidth=3.5;
  const path=p=>{g.beginPath();p.forEach((q,i)=>i?g.lineTo(q[0],q[1]):g.moveTo(q[0],q[1]));g.stroke()};
  for(const l of lines){g.strokeStyle=pc(l.c);path(l.p)}

  // Vẽ gợi ý từ đặc quyền "Thấu thị nước đi"
  if (perksState.hintLine) {
    g.save();
    g.strokeStyle = css('--gold');
    g.lineWidth = 4.5;
    g.setLineDash([8, 8]);
    path(perksState.hintLine);
    g.restore();
  }

  if(cur){
    g.strokeStyle=pc(turn);path(cur.path);
    if(cur.q){g.strokeStyle=cur.bad?'#e03131':pc(turn);g.setLineDash([2,7]);path([cur.path[cur.path.length-1],cur.q]);g.setLineDash([])}
  }
  {const now=performance.now();for(const f of fx){const k=Math.min(1,(now-f.t)/f.life);g.globalAlpha=1-k;if(f.ring){g.beginPath();g.arc(f.x,f.y,R+k*46,0,7);g.strokeStyle=f.col;g.lineWidth=4*(1-k)+1;g.stroke()}else{g.fillStyle=f.col;g.beginPath();g.arc(f.x+f.vx*k*40,f.y+f.vy*k*40,3*(1-k)+1,0,7);g.fill()}}g.globalAlpha=1;g.lineWidth=3.5}
  g.font='700 12px Inter,ui-sans-serif,system-ui,sans-serif';g.textAlign='center';g.textBaseline='middle';
  spots.forEach((s,i)=>{
    const l=lives(s);
    if(i==hov||(cur&&i==cur.s)){g.beginPath();g.arc(s.x,s.y,R+7,0,7);g.fillStyle=pc(turn)+'33';g.fill()}
    g.beginPath();g.arc(s.x,s.y,R,0,7);g.fillStyle=l?paper:ink;g.fill();
    g.lineWidth=2.5;g.strokeStyle=ink;g.stroke();g.lineWidth=3.5;
    if(l){g.fillStyle=ink;g.fillText(l,s.x,s.y+1)}
  });
}

const canPlay=()=>go&&!over&&!(seat>=0&&turn!=seat);
const hit=w=>canPlay()?spots.findIndex(p=>lives(p)>0&&Math.hypot(p.x-w[0],p.y-w[1])<Math.max(R+8,16/cam.z)):-1;
cv.onpointerdown=e=>{
  cv.setPointerCapture(e.pointerId);const q=pos(e);ptr.set(e.pointerId,q);
  if(ptr.size>1){cur=null;pan=null;const[a,b]=[...ptr.values()];pv={d:Math.hypot(a[0]-b[0],a[1]-b[1])||1,m:[(a[0]+b[0])/2,(a[1]+b[1])/2]};draw();return}
  const s=hit(wld(q));
  if(s>=0)cur={s,path:[[spots[s].x,spots[s].y]]};
  else{pan={q,x:cam.x,y:cam.y};cv.style.cursor='grabbing'}
  draw();
};
cv.onpointermove=e=>{
  const q=pos(e);if(ptr.has(e.pointerId))ptr.set(e.pointerId,q);
  if(ptr.size>1&&pv){
    const[a,b]=[...ptr.values()],d=Math.hypot(a[0]-b[0],a[1]-b[1])||1,m=[(a[0]+b[0])/2,(a[1]+b[1])/2];
    zoomAt(m,cam.z*d/pv.d);cam.x-=(m[0]-pv.m[0])/cam.z;cam.y-=(m[1]-pv.m[1])/cam.z;pv={d,m};draw();return;
  }
  if(pan){cam.x=pan.x-(q[0]-pan.q[0])/cam.z;cam.y=pan.y-(q[1]-pan.q[1])/cam.z;draw();return}
  const w=wld(q);
  if(!cur){const h=hit(w);if(h!=hov){hov=h;cv.style.cursor=h<0?'grab':'pointer';draw()}return}
  cur.q=w;extend(w);draw();
};
cv.onpointerup=cv.onpointercancel=e=>{ptr.delete(e.pointerId);if(ptr.size<2)pv=null;pan=null;cur=null;cv.style.cursor='grab';draw();wake()};
cv.onpointerleave=()=>{if(hov>=0&&!cur){hov=-1;draw()}};
cv.addEventListener('wheel',e=>{e.preventDefault();zoomAt(pos(e),cam.z*Math.exp(-e.deltaY*.0015));draw()},{passive:false});
$('zi').onclick=()=>{zoomAt([W/2,H/2],cam.z*1.3);draw()};$('zo').onclick=()=>{zoomAt([W/2,H/2],cam.z/1.3);draw()};$('ft').onclick=fit;
$('un').onclick=undo;
$('nw').onclick=()=>{if(over||ph!='play'){toLobby(1);return}if(!rzA){rzA=true;setTimeout(()=>{rzA=false;info()},3000);info();return}rzA=false;const i=seat>=0?seat:turn;send({t:'resign',i});resign(i)};

$('n').onchange=$('tm').onchange=()=>{
  let val = parseInt($('n').value, 10);
  if (![4, 5, 6].includes(val)) { val = 5; $('n').value = '5'; }
  const v=parseFloat($('tm').value);$('tm').value=isFinite(v)&&v>0?Math.min(999,v):0;
  rdy=[false,false];send({t:'cfg',n:val,tm:$('tm').value});lobbyUI();info()
};
[0,1].forEach(i=>$('r'+i).onclick=()=>{if(ph=='lobby'){send({t:'rdy',i,v:!rdy[i]});setRdy(i,!rdy[i])}});
$('mu').onclick=()=>{setMute(!mute);snd('ready')};
addEventListener('resize',draw);

[0,1].forEach(i => {
  $('p'+i).oninput = e => {
    const validation = validateUniquePlayerName(e.target.value, i, names);
    if (validation.valid) {
      names[i] = validation.normalized;
      info();
      send({t:'name', i, v: names[i]});
      saveAndSyncElo();
    }
  };
  $('p'+i).onblur = e => {
    const validation = validateUniquePlayerName(e.target.value, i, names);
    if (!validation.valid) {
      e.target.value = names[i];
      banner(validation.message, '#e03131', 2000);
    } else {
      names[i] = validation.normalized;
      e.target.value = names[i];
      info();
      send({t:'name', i, v: names[i]});
      saveAndSyncElo();
    }
  };
});

// Two-device play: WebRTC
const pack=()=>JSON.stringify({spots,lines,turn,over,tout,clk,lim,n:parseInt($('n').value,10)});
const send=o=>{if(dc&&dc.readyState=='open')dc.send(JSON.stringify(o))};
const ns=t=>$('ns').textContent=t;
const lock=()=>{$('un').disabled=seat>=0;lobbyUI()};
const ice=()=>new Promise(r=>{if(pc2.iceGatheringState=='complete')return r();pc2.onicegatheringstatechange=()=>pc2.iceGatheringState=='complete'&&r();setTimeout(r,5000)});
let stunOn=false;
const b64u=b=>{let t='';new Uint8Array(b).forEach(c=>t+=String.fromCharCode(c));return btoa(t).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')};
const unb64u=t=>{t=t.replace(/-/g,'+').replace(/_/g,'/');while(t.length%4)t+='=';return Uint8Array.from(atob(t),c=>c.charCodeAt(0))};
const pipe=async(d,S)=>new Response(new Blob([d]).stream().pipeThrough(S)).arrayBuffer();
const code=async()=>{const j=JSON.stringify({type:pc2.localDescription.type,sdp:pc2.localDescription.sdp,stun:stunOn?1:0});
  if(window.CompressionStream){try{return 'S1.'+b64u(await pipe(j,new CompressionStream('deflate-raw')))}catch(e){}}return btoa(j)};
const decSafe = async c => {
  if (c.startsWith('S1.')) {
    try { return JSON.parse(new TextDecoder().decode(await pipe(unb64u(c.slice(3)), new DecompressionStream('deflate-raw')))); } catch(e) {}
  }
  return JSON.parse(atob(c));
};
const getCode=t=>{t=(t||'').trim();const m=t.match(/S1\.[\w-]+/)||t.match(/[A-Za-z0-9+\/=]{80,}/);return m?m[0]:t};
const canLink=/^https?:$/.test(location.protocol);let shareMsg='';
const copy=async(t,el)=>{try{await navigator.clipboard.writeText(t);return true}catch(e){try{(el||$('o')).select();return document.execCommand('copy')}catch(e2){return false}}};
async function present(txt,msg,what){$('o').value=txt;$('sh').hidden=!navigator.share;shareMsg=what;const ok=await copy(txt);ns(msg+(ok?' Đã copy sẵn.':' Bấm Copy.'))}
function mk(){
  if(pc2){pc2.close();dc=null;seat=-1;lock()}
  stunOn=$('stun').checked;pc2=new RTCPeerConnection({iceServers:stunOn?[{urls:'stun:stun.l.google.com:19302'}]:[]});
  pc2.onconnectionstatechange=()=>{if(pc2.connectionState=='failed'&&seat<0)ns('Kết nối thất bại. Hãy thử tick "Khác mạng Wi-Fi".');if(['failed','closed'].includes(pc2.connectionState))drop()};
  $('o').value='';$('i').value='';$('go').disabled=false;
}
function wire(c){
  dc=c;
  c.onopen=()=>{closeRel();hideRoom();seat=me;lock();ns('Đã kết nối! Bạn là '+(me?'Người chơi 2 (Xanh).':'Người chơi 1 (Đỏ).'));toLobby();$('net').open=false;send({t:'name',i:me,v:names[me]});if(me==0)send({t:'cfg',n:$('n').value,tm:$('tm').value})};
  c.onmessage=recv;c.onclose=drop;
}
function drop(){if(seat<0)return;dc=null;seat=-1;rdy=[false,false];lock();ns('Mất kết nối.');if(ph=='count')toLobby();else info()}
function recv(e){
  try{
    const m=JSON.parse(e.data);
    if(m.t=='name'&&(m.i===0||m.i===1)){
      const valCheck = validateUniquePlayerName(String(m.v).slice(0,20), m.i, names);
      if (valCheck.valid) { names[m.i] = valCheck.normalized; $('p'+m.i).value = names[m.i]; info(); }
    }
    else if(m.t=='rdy'&&(m.i===0||m.i===1)&&m.i!=seat)setRdy(m.i,!!m.v);
    else if(m.t=='cfg'){
      let valN = parseInt(m.n, 10);
      if([4,5,6].includes(valN)) $('n').value = valN;
      $('tm').value=m.tm;rdy=[false,false];lobbyUI();info()
    }
    else if(m.t=='count'){if(ph=='lobby')runCount()}
    else if(m.t=='lobby')toLobby();
    else if(m.t=='resign'&&(m.i===0||m.i===1))resign(m.i);
    else if(m.t=='state'){
      const o=JSON.parse(m.s),pd=spots.map(q=>q.d);({spots,lines,turn,over,tout,clk,lim}=o);
      let valN = parseInt(o.n, 10);
      if([4,5,6].includes(valN)) $('n').value = valN;
      $('tm').value=lim/60000;hist=[];cur=null;last=performance.now();
      if(m.lot){clearTimeout(cdt);$('cd').hidden=true;rz=ended=warned=false;lsec=-1;cam={x:0,y:0,z:1};setPh('play');lottery(turn)}else{lt++;$('lot').hidden=true;go=true;if(spots.length>pd.length)satFx(pd,pc(turn^1))}
      info();draw();wake();
    }
  }catch(err){}
}
$('host').onclick=async()=>{
  closeRel();hideRoom();room='';mk();me=0;wire(pc2.createDataChannel('g'));$('go').textContent='Kết nối';ns('Đang tạo lời mời…');
  await pc2.setLocalDescription(await pc2.createOffer());await ice();
  const c=await code();
  await present(canLink?location.href.split('#')[0]+'#join='+c:c,'Đã tạo lời mời. Gửi cho bạn bè, sau đó dán mã phản hồi của họ.','Tham gia Sprouts:');
  $('go').onclick=async()=>{const b=$('go');b.disabled=true;try{const o=await decSafe(getCode($('i').value));await pc2.setRemoteDescription({type:o.type,sdp:o.sdp});ns('Đang kết nối…')}catch(err){b.disabled=false;ns('Mã phản hồi không hợp lệ.')}};
};
function setupJoin(){
  mk();me=1;pc2.ondatachannel=e=>wire(e.channel);$('go').textContent='Tạo phản hồi';
  $('go').onclick=async()=>{
    const b=$('go');b.disabled=true;
    try{
      const o=await decSafe(getCode($('i').value));
      if(o.stun&&!stunOn){const v=$('i').value;$('stun').checked=true;setupJoin();$('i').value=v;b.disabled=true}
      await pc2.setRemoteDescription({type:o.type,sdp:o.sdp});
      await pc2.setLocalDescription(await pc2.createAnswer());ns('Đang tạo phản hồi…');await ice();
      const rc=await code();
      if(room){await relayPub('answer',rc);closeRel();ns('Đã tìm thấy chủ phòng. Đang kết nối…');watchConn()}
      else await present(rc,'Đã tạo phản hồi. Gửi lại cho chủ phòng.','Mã phản hồi Sprouts:');
    }catch(err){b.disabled=false;ns('Mã mời không hợp lệ.')}
  };
}
$('join').onclick=()=>{closeRel();hideRoom();room='';setupJoin();ns('Dán mã mời của chủ phòng vào ô bên dưới.')};
let at;const auto=()=>{clearTimeout(at);at=setTimeout(()=>{
  if(getCode($('i').value).length<60)return;
  if(!pc2){const v=$('i').value;room='';setupJoin();$('i').value=v}
  if(!$('go').disabled)$('go').click();
},150)};
$('i').addEventListener('input',auto);
$('pa').onclick=async()=>{try{$('i').value=await navigator.clipboard.readText();auto()}catch(e){ns('Trình duyệt chặn clipboard. Hãy dán thủ công.')}};
$('cp').onclick=async()=>{const ok=await copy($('o').value),b=$('cp');b.textContent=ok?'Đã copy ✓':'Chọn & copy';setTimeout(()=>b.textContent='Copy',1500)};
$('sh').onclick=async()=>{const t=$('o').value;if(!t)return;try{await navigator.share(/^https?:/.test(t)?{title:'Sprouts',text:shareMsg,url:t}:{text:shareMsg+'\n'+t})}catch(e){}};
const RELAY='https://ntfy.sh',ALPH='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
let room='',es=null,jt=0;
const newRoom=()=>[...crypto.getRandomValues(new Uint8Array(6))].map(x=>ALPH[x%ALPH.length]).join('');
const topic=()=>'sprouts-room-'+room;
const closeRel=()=>{clearTimeout(jt);if(es){es.close();es=null}};
const showRoom=()=>{$('rcode').value=room;$('rbox').hidden=false;$('rlnk').hidden=!canLink;$('rshr').hidden=!navigator.share};
const hideRoom=()=>{$('rbox').hidden=true};
const relayPub=async(k,c)=>{const r=await fetch(RELAY+'/'+topic(),{method:'POST',body:JSON.stringify({k,c})});if(!r.ok)throw new Error('relay')};
function relaySub(h){
  closeRel();let ok=false;const e=es=new EventSource(RELAY+'/'+topic()+'/sse?since=all');
  e.onopen=()=>{ok=true};
  e.onmessage=ev=>{try{const d=JSON.parse(ev.data);if(d.event==='message')h(JSON.parse(d.message))}catch(x){}};
  e.onerror=()=>{if(!ok&&es===e){closeRel();ns('Không kết nối được relay. Dùng kết nối thủ công bên dưới.')}};
}
const watchConn=()=>setTimeout(()=>{if(seat<0&&ph=='lobby')ns('Chưa kết nối được. Nếu khác mạng Wi-Fi, hãy tick "Khác mạng Wi-Fi".')},20000);
async function hostRoom(){
  closeRel();mk();me=0;room=newRoom();const p=pc2;wire(p.createDataChannel('g'));$('go').textContent='Kết nối';
  showRoom();ns('Đang mở phòng…');
  await p.setLocalDescription(await p.createOffer());await ice();
  if(p!==pc2)return;
  const c=await code();let used=false;
  relaySub(async m=>{
    if(m.k!=='answer'||used||p!==pc2)return;used=true;
    try{const o=await decSafe(m.c);await p.setRemoteDescription({type:o.type,sdp:o.sdp});closeRel();ns('Đã thấy đối thủ. Đang kết nối…');watchConn()}catch(e){used=false}
  });
  try{await relayPub('offer',c);ns('Phòng đã mở! Gửi mã cho bạn bè và chờ tại đây.')}
  catch(e){closeRel();ns('Không kết nối được relay. Dùng kết nối thủ công bên dưới.')}
}
function joinRoom(raw){
  raw=String(raw||'');const m=raw.match(/room=([A-Za-z0-9]{6})/),c=(m?m[1]:raw).toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(c.length!==6){ns('Mã phòng gồm 6 ký tự.');return}
  closeRel();hideRoom();setupJoin();room=c;let got=false;$('rin').value=c;
  ns('Đang tìm phòng '+c+'…');
  relaySub(m=>{if(m.k!=='offer'||got)return;got=true;clearTimeout(jt);$('i').value=m.c;$('go').click()});
  jt=setTimeout(()=>{if(!got){closeRel();ns('Không tìm thấy phòng '+c+'.')}},8000);
}
$('rmk').onclick=hostRoom;$('rjn').onclick=()=>joinRoom($('rin').value);
$('rin').onkeydown=e=>{if(e.key=='Enter')joinRoom($('rin').value)};
$('rin').addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData).getData('text');if(/room=[A-Za-z0-9]{6}/.test(t)){e.preventDefault();joinRoom(t)}});
const roomLink=()=>location.href.split('#')[0]+'#room='+room;
const flash=async(b,t,el)=>{const o=b.textContent,ok=await copy(t,el);b.textContent=ok?'Đã copy ✓':'Chọn & copy';setTimeout(()=>b.textContent=o,1500)};
$('rcpy').onclick=()=>flash($('rcpy'),room,$('rcode'));
$('rlnk').onclick=()=>flash($('rlnk'),roomLink());
$('rshr').onclick=async()=>{try{await navigator.share(canLink?{title:'Sprouts',text:'Tham gia Sprouts:',url:roomLink()}:{text:'Mã phòng Sprouts: '+room})}catch(e){}};
$('th').onclick=()=>th(document.documentElement.dataset.theme=='dark'?'light':'dark');
let t0;try{t0=localStorage.getItem('sp-theme')}catch(e){}
th(t0||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'));
setInterval(clockTick,200);
spots=[];lines=[];hist=[];turn=0;over=false;setMute(mute);setPh('lobby');info();draw();saveAndSyncElo();
{const r=location.hash.match(/room=([A-Za-z0-9]{6})/);if(r){history.replaceState(null,'',location.href.split('#')[0]);$('net').open=true;joinRoom(r[1])}}
{const m=location.hash.match(/join=([^&\s]+)/);if(m){history.replaceState(null,'',location.href.split('#')[0]);$('net').open=true;$('i').value=decodeURIComponent(m[1]);auto();$('net').scrollIntoView({block:'nearest'})}}
</script>
</body>
</html>
