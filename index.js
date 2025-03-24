const express = require('express');
const app = express();
const port = 4715;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


let activityLogs = [];
const TEN_MINUTES = 10 * 60 * 1000;

// 10분 이전 로그를 정리, 중복 UUID는 가장 최근 로그만 유지
function cleanupLogs() {
  const now = Date.now();
  activityLogs = activityLogs.filter(log => now - new Date(log.timestamp).getTime() <= TEN_MINUTES);

    const uniqueLogs = {};
    activityLogs.forEach(log => {
      uniqueLogs[log.app_id] = log;
    });
    activityLogs = Object.values(uniqueLogs);
}

// POST /api/activity 엔드포인트 구현
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

  // 활동 로그 저장
  activityLogs.push({ app_id, timestamp });

  // 오래된 로그 정리
  cleanupLogs();

  //로깅
  console.log(`[${timestamp}] ${app_id} 활동 로그 저장`);
  console.table(activityLogs);

  // 최근 10분 동안의 로그 필터링
  const responseDevices = activityLogs.filter(log => {
    return Date.now() - new Date(log.timestamp).getTime() <= TEN_MINUTES;
  });
  return res.status(200).json({
    status: 'success',
    devices: responseDevices
  });
});

app.post('/api/view', (req, res) => {
  //그냥 로그만 보내드려라
  // 오래된 로그 정리
  cleanupLogs();

  //보내드려라
    return res.status(200).json({
        status: 'success',
        devices: activityLogs
    });

});

// 존재하지 않는 엔드포인트 처리
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// 오류 처리 미들웨어
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
