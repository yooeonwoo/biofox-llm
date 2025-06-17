#!/bin/bash

# DigitalOcean 서버 접속 및 상태 점검 스크립트
# 사용법: ./debug_connection.sh

echo "🔍 DigitalOcean 서버 상태 점검 시작..."

# Step 1: Docker 서비스 상태 확인
echo "📊 Docker 서비스 상태 확인..."
sudo systemctl status docker

echo ""
echo "🐳 Docker 컨테이너 상태 확인..."
docker ps -a

echo ""
echo "🔗 Docker Compose 서비스 상태..."
docker-compose -f docker/docker-compose.yml ps

echo ""
echo "📊 포트 사용 현황 확인..."
netstat -tulpn | grep :3001
lsof -i :3001

echo ""
echo "🔥 방화벽 상태 확인..."
sudo ufw status

echo ""
echo "💾 디스크 사용량 확인..."
df -h

echo ""
echo "🧠 메모리 사용량 확인..."
free -h

echo ""
echo "⚡ CPU 사용률 확인..."
top -bn1 | head -5

echo ""
echo "📝 Docker Compose 로그 (마지막 50줄)..."
docker-compose -f docker/docker-compose.yml logs --tail=50

echo ""
echo "🔍 AnythingLLM 컨테이너 특정 로그..."
docker logs anythingllm --tail=30 2>&1 || echo "anythingllm 컨테이너를 찾을 수 없음"

echo ""
echo "🌐 네트워크 연결 테스트..."
curl -I http://localhost:3001 || echo "로컬 연결 실패"

echo ""
echo "📂 프론트엔드 파일 확인..."
docker exec anythingllm ls -la /app/server/public/ 2>/dev/null || echo "컨테이너에 접근할 수 없음"

echo ""
echo "🔧 Docker 이미지 확인..."
docker images | grep anythingllm

echo ""
echo "==============================="
echo "🎯 빠른 해결 방법들:"
echo "==============================="
echo "1. 컨테이너 재시작: docker-compose -f docker/docker-compose.yml restart"
echo "2. 전체 재빌드: docker-compose -f docker/docker-compose.yml up --build -d"
echo "3. 로그 실시간 확인: docker-compose -f docker/docker-compose.yml logs -f"
echo "4. 컨테이너 접속: docker exec -it anythingllm bash"
echo "5. 포트 확인: ss -tulpn | grep 3001"