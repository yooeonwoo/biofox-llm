#!/bin/bash

# 원격으로 서버 상태 확인하는 스크립트
# 로컬에서 실행하여 DigitalOcean 서버 상태 체크

SERVER_IP="178.128.125.237"
SERVER_USER="root"  # 또는 실제 사용자명

echo "🌐 DigitalOcean 서버 ($SERVER_IP) 상태 원격 확인..."

# 1. 핑 테스트
echo "1️⃣ 핑 테스트..."
ping -c 4 $SERVER_IP

# 2. SSH 연결 테스트
echo ""
echo "2️⃣ SSH 연결 테스트..."
ssh -o ConnectTimeout=10 $SERVER_USER@$SERVER_IP "echo 'SSH 연결 성공'"

# 3. 포트 3001 접근 테스트
echo ""
echo "3️⃣ 포트 3001 접근 테스트..."
nc -zv $SERVER_IP 3001

# 4. HTTP 요청 테스트
echo ""
echo "4️⃣ HTTP 요청 테스트..."
curl -I --connect-timeout 10 http://$SERVER_IP:3001

# 5. 다른 일반적인 포트들 확인
echo ""
echo "5️⃣ 다른 포트들 상태 확인..."
echo "SSH (22):"
nc -zv $SERVER_IP 22
echo "HTTP (80):"
nc -zv $SERVER_IP 80
echo "HTTPS (443):"
nc -zv $SERVER_IP 443

echo ""
echo "==============================================="
echo "🔍 결과 분석:"
echo "==============================================="
echo "- 핑이 성공하면: 서버는 살아있음"
echo "- SSH가 성공하면: 서버에 접근 가능"
echo "- 포트 3001이 실패하면: 방화벽 또는 서비스 문제"
echo ""
echo "다음 명령으로 서버에 접속하여 직접 해결:"
echo "ssh $SERVER_USER@$SERVER_IP"
echo "cd /path/to/biofox-llm"
echo "./fix_connection_refused.sh"