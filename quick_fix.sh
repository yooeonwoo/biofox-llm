#!/bin/bash

# 빠른 문제 해결 스크립트
# 가장 흔한 Docker 접속 문제들을 자동으로 해결

echo "🚨 긴급 문제 해결 시작..."

# 1. 현재 상태 빠르게 확인
echo "1️⃣ 현재 컨테이너 상태..."
docker ps

# 2. 만약 컨테이너가 실행중이 아니라면 시작
if ! docker ps | grep -q anythingllm; then
    echo "2️⃣ 컨테이너가 중지됨. 재시작 중..."
    docker-compose -f docker/docker-compose.yml up -d
    sleep 10
fi

# 3. 포트 확인
echo "3️⃣ 포트 3001 상태 확인..."
ss -tulpn | grep 3001

# 4. 만약 여전히 문제가 있다면 강제 재시작
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "4️⃣ 서비스 응답 없음. 강제 재시작..."
    
    # 모든 컨테이너 중지
    docker-compose -f docker/docker-compose.yml down
    
    # 잠시 대기
    sleep 5
    
    # 다시 시작
    docker-compose -f docker/docker-compose.yml up -d
    
    # 시작 대기
    echo "⏳ 서비스 시작 대기 (30초)..."
    sleep 30
fi

# 5. 최종 상태 확인
echo "5️⃣ 최종 상태 확인..."
docker ps
curl -I http://localhost:3001 || echo "❌ 여전히 접속 불가"

echo ""
echo "📝 최근 로그:"
docker-compose -f docker/docker-compose.yml logs --tail=10 anything-llm

echo ""
echo "✅ 빠른 수정 완료. 브라우저에서 다시 시도해보세요."