#!/bin/bash

# DigitalOcean 서버에서 Memory Management 기능 배포 수정 스크립트
# 사용법: ./deploy_fix.sh

echo "🚀 DigitalOcean 서버에서 Memory Management 기능 배포 수정 시작..."

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# Step 1: Git에서 최신 변경사항 가져오기
echo "📥 Git에서 최신 변경사항 가져오기..."
git pull origin main

# Step 2: 기존 컨테이너 중지
echo "🛑 기존 컨테이너 중지..."
docker-compose -f docker/docker-compose.yml down --remove-orphans

# Step 3: 기존 이미지 제거 (강제 리빌드를 위해)
echo "🗑️  기존 Docker 이미지 제거..."
docker image rm anythingllm_anything-llm 2>/dev/null || echo "이미지가 존재하지 않음"
docker image rm anythingllm-anything-llm 2>/dev/null || echo "이미지가 존재하지 않음"

# Step 4: Docker 빌드 캐시 정리
echo "🧹 Docker 빌드 캐시 정리..."
docker builder prune -f

# Step 5: 새로운 이미지 빌드 (캐시 없이)
echo "🔨 새로운 Docker 이미지 빌드 (--no-cache)..."
docker-compose -f docker/docker-compose.yml build --no-cache

# Step 6: 컨테이너 시작
echo "🚀 컨테이너 시작..."
docker-compose -f docker/docker-compose.yml up -d

# Step 7: 잠시 대기 후 상태 확인
echo "⏳ 서비스 시작 대기 (30초)..."
sleep 30

# Step 8: 컨테이너 상태 확인
echo "📊 컨테이너 상태 확인..."
docker-compose -f docker/docker-compose.yml ps

# Step 9: 프론트엔드 파일이 제대로 복사되었는지 확인
echo "🔍 프론트엔드 파일 확인..."
docker exec anythingllm ls -la /app/server/public/ || echo "프론트엔드 파일 확인 실패"

# Step 10: 컨테이너 로그 확인
echo "📝 최근 로그 (마지막 20줄):"
docker-compose -f docker/docker-compose.yml logs --tail=20 anything-llm

echo ""
echo "✅ 배포 수정 완료!"
echo "🌐 애플리케이션 URL: http://your-digitalocean-ip:3001"
echo ""
echo "🔍 추가 디버깅:"
echo "   - 전체 로그: docker-compose -f docker/docker-compose.yml logs anything-llm"
echo "   - 컨테이너 접속: docker exec -it anythingllm bash"
echo "   - 프론트엔드 파일 확인: docker exec anythingllm find /app/server/public -name '*.js' -o -name '*.css'"