# Activity Log API

## 소개
간단한 API 서버입니다.
다양한 애플리케이션에서 전송되는 활동 로그를 관리하며, `app_id`로 식별되는 활동을 기록합니다.
최대 10분간의 로그를 유지하며, 동일한 `app_id`가 여러 번 기록될 경우 가장 최신의 로그만 유지합니다.

---

## 기능
- POST 요청을 통해 애플리케이션의 활동을 기록합니다.
- 10분이 지난 로그는 자동으로 삭제됩니다.
- 동일한 `app_id`의 중복 로그는 가장 최근의 로그로 업데이트됩니다.

---

## 설치 방법
### 요구 사항
- Node.js (v12 이상)
- npm (Node.js 설치 시 기본 포함)

### 설치
```bash
# 프로젝트를 클론합니다.
git clone github.com/gurumnyang/sharegpt

# 프로젝트 디렉토리로 이동합니다.
cd <프로젝트 폴더>

# 필요한 패키지를 설치합니다.
npm install
```

---

## 사용 방법
### 서버 실행
```bash
node index.js
```

### 엔드포인트
#### POST /api/activity
애플리케이션 활동을 기록합니다.

요청 예시:
```json
{
  "app_id": "your_app_id"
}
```

응답 예시 (성공 시):
```json
{
  "status": "success",
  "devices": [
    {
      "app_id": "your_app_id",
      "timestamp": "2025-03-22T14:28:35.678Z"
    }
  ]
}
```

오류 응답 예시 (app_id 미제공 시):
```json
{
  "status": "error",
  "message": "Invalid request format"
}
```

오류 응답 예시 (잘못된 URL 접근 시):
```json
{
  "status": "error",
  "message": "Endpoint not found"
}
```

오류 응답 예시 (서버 내부 오류 발생 시):
```json
{
  "status": "error",
  "message": "Internal server error"
}
```


---

## 라이센스
이 프로젝트는 MIT 라이센스를 따릅니다. 자유롭게 수정 및 배포할 수 있습니다.
