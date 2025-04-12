const express = require('express');
const app = express();
const port = 4715;
const cors = require('cors');

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


// ---------------------------------------------
// 1) 기존 activityLogs 로직 (10분 내 사용여부)
// ---------------------------------------------
let activityLogs = [];
const TEN_MINUTES = 10 * 60 * 1000;

/**
 * 10분 이전 로그를 정리, 중복 UUID는 가장 최근 로그만 유지
 */
function cleanupLogs() {
  const now = Date.now();
  // 10분 넘은 로그 삭제
  activityLogs = activityLogs.filter(log => now - new Date(log.timestamp).getTime() <= TEN_MINUTES);

  // 중복 app_id는 가장 최근 로그만 유지
  const uniqueLogs = {};
  activityLogs.forEach(log => {
    uniqueLogs[log.app_id] = log;
  });
  activityLogs = Object.values(uniqueLogs);
}

/**
 * POST /api/activity
 * - 특정 app_id에서 사용자 활동이 발생했음을 기록
 * - 저장 후 최근 10분 내 기록 반환
 */
app.post('/api/activity', (req, res) => {
  const { app_id } = req.body;

  // 필수 필드 검증
  if (!app_id) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request format'
    });
  }

  const timestamp = new Date().toISOString();
  // 로그 저장
  activityLogs.push({ app_id, timestamp });

  // 오래된 로그 정리
  cleanupLogs();

  //로깅
  //ip 로깅
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  console.log(`[${timestamp}] ${app_id} 활동 로그 저장 (IP: ${ip})`);
  console.log(`[${timestamp}] ${app_id} 활동 로그 저장`);
  console.table(activityLogs);

  const responseDevices = activityLogs.filter(log => {
    return Date.now() - new Date(log.timestamp).getTime() <= TEN_MINUTES;
  });
  return res.status(200).json({
    status: 'success',
    devices: responseDevices
  });
});

/**
 * POST /api/view
 * - 최근 10분 내 모든 앱 사용 로그 반환
 */
app.post('/api/view', (req, res) => {
  //그냥 로그만 보내드려라
  // 오래된 로그 정리
  cleanupLogs();
  return res.status(200).json({
    status: 'success',
    devices: activityLogs
  });
});

// ---------------------------------------------------
// 2) 실시간 채팅 기능
//   - 메모리에 chatMessages 배열 저장
//   - /api/chat/history: 최근 10분 채팅 기록 조회
//   - WebSocket(ws) 통해 실시간 메시지 송수신
// ---------------------------------------------------
let chatMessages = [];

/** 채팅 메모리에서 10분이 지난 메시지 정리 */
function cleanupChat() {
  const now = Date.now();
  chatMessages = chatMessages.filter(msg => {
    return now - new Date(msg.timestamp).getTime() <= TEN_MINUTES;
  });
}

/**
 * GET /api/chat/history
 * - 최근 10분 간의 채팅 메시지 반환
 */
app.get('/api/chat/history', (req, res) => {
  cleanupChat();
  res.status(200).json(chatMessages);
});

/**
 * 3) 존재하지 않는 엔드포인트 처리
 */
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

/**
 * 4) 오류 처리 미들웨어
 */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

/**
 * 5) 서버 실행
 */
const server = app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});

// ---------------------------------------------------
// 6) WebSocket 서버 설정
// ---------------------------------------------------
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server });

/**
 * WebSocket 연결: 클라이언트가 연결을 맺으면 실행
 */
wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');

  /**
   * 클라이언트 → 서버 메시지 수신
   * - 형식 예: { text: "...", timestamp: "..." }
   */
  ws.on('message', (message) => {
    let parsed;
    try {
      parsed = JSON.parse(message);
    } catch (err) {
      console.error('Invalid JSON from client:', err);
      return;
    }

    const { text } = parsed;
    if (!text) {
      console.warn('No text in message');
      return;
    }

    // 새 메시지 저장
    const newMessage = {
      text,
      timestamp: new Date().toISOString(),
    };
    chatMessages.push(newMessage);

    // 10분 지난 메시지 정리
    cleanupChat();

    // 모든 연결된 클라이언트에게 메시지 브로드캐스트
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // 실시간으로 텍스트만 보내거나,
        // 필요한 경우 전체 객체를 json으로 보내도 됨
        client.send(JSON.stringify({
          text: newMessage.text,
          timestamp: newMessage.timestamp
        }));
      }
    });

    console.log(`[Chat] ${text}`);
  });

  /**
   * WebSocket 종료
   */
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

