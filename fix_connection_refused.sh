#!/bin/bash

# ERR_CONNECTION_REFUSED 에러 해결 스크립트
# DigitalOcean 서버에서 실행

echo "🔧 ERR_CONNECTION_REFUSED 에러 해결 시작..."

# 1. 현재 상태 확인
echo "1️⃣ 현재 Docker 컨테이너 상태 확인..."
docker ps -a

echo ""
echo "2️⃣ 포트 3001 사용 현황 확인..."
ss -tulpn | grep 3001
netstat -tulpn | grep 3001

echo ""
echo "3️⃣ UFW 방화벽 상태 확인..."
sudo ufw status

# 4. 방화벽에 포트 3001 허용
echo ""
echo "4️⃣ 방화벽에 포트 3001 허용..."
sudo ufw allow 3001
sudo ufw allow 3001/tcp
sudo ufw reload

echo ""
echo "5️⃣ DigitalOcean 방화벽 확인 메시지..."
echo "⚠️  DigitalOcean 대시보드에서 Droplet의 방화벽 설정도 확인하세요!"
echo "   - Networking > Firewalls 에서 포트 3001이 허용되어 있는지 확인"

# 6. Docker 컨테이너가 실행 중이 아니라면 시작
echo ""
echo "6️⃣ Docker 서비스 확인 및 시작..."
if ! docker ps | grep -q anythingllm; then
    echo "컨테이너가 실행되지 않음. 시작 중..."
    docker-compose -f docker/docker-compose.yml down
    docker-compose -f docker/docker-compose.yml up -d
    
    echo "⏳ 컨테이너 시작 대기 (30초)..."
    sleep 30
fi

# 7. 로컬 연결 테스트
echo ""
echo "7️⃣ 로컬 연결 테스트..."
curl -I http://localhost:3001 || echo "로컬 연결 실패"

# 8. 외부 IP로 연결 테스트
echo ""
echo "8️⃣ 외부 IP 연결 테스트..."
EXTERNAL_IP=$(curl -s http://checkip.amazonaws.com/)
echo "외부 IP: $EXTERNAL_IP"
curl -I http://$EXTERNAL_IP:3001 || echo "외부 연결 실패"

# 9. Docker Compose 설정 확인
echo ""
echo "9️⃣ Docker Compose 포트 설정 확인..."
grep -A 5 -B 5 "3001:3001" docker/docker-compose.yml

# 10. 컨테이너 내부에서 서비스 확인
echo ""
echo "🔟 컨테이너 내부 서비스 확인..."
docker exec anythingllm ps aux | grep node || echo "컨테이너 내부 확인 실패"

echo ""
echo "📝 최근 로그 확인..."
docker-compose -f docker/docker-compose.yml logs --tail=20 anything-llm

echo ""
echo "==============================================="
echo "🛠️  추가 해결 방법들:"
echo "==============================================="
echo "1. DigitalOcean 대시보드에서 방화벽 설정 확인:"
echo "   - Droplet > Networking > Firewalls"
echo "   - Inbound Rules에 TCP 3001 포트 추가"
echo ""
echo "2. 만약 여전히 문제가 있다면:"
echo "   sudo iptables -L"
echo "   sudo iptables -I INPUT -p tcp --dport 3001 -j ACCEPT"
echo ""
echo "3. Docker 바인딩 확인:"
echo "   docker port anythingllm"
echo ""
echo "4. 프로세스 확인:"
echo "   sudo lsof -i :3001"
echo ""
echo "5. 재부팅 후 시도:"
echo "   sudo reboot"