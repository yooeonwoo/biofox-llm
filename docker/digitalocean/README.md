# DigitalOcean 직접 배포 가이드

## 1. 사전 준비

### 필요한 것들:
- DigitalOcean 계정 및 API 토큰
- OpenAI API 키
- SSH 키 쌍 (`~/.ssh/id_ed25519`)
- Terraform 설치

## 2. 설정

1. **terraform.tfvars 파일 생성**:
   ```bash
   cd docker/digitalocean/terraform
   cp terraform.tfvars.example terraform.tfvars
   ```

2. **terraform.tfvars 편집**:
   ```
   do_token = "your-digitalocean-api-token"
   openai_key = "your-openai-api-key"
   ```

## 3. 배포

```bash
cd docker/digitalocean/terraform

# Terraform 초기화
terraform init

# 배포 계획 확인
terraform plan

# 배포 실행
terraform apply
```

## 4. GitHub 자동 배포 설정

1. **GitHub Secrets 설정**:
   - `SSH_PRIVATE_KEY`: SSH 개인키 내용
   - `DROPLET_IP`: Droplet IP 주소 (terraform output에서 확인)

2. **Webhook 설정 (선택사항)**:
   - GitHub 리포지토리 Settings > Webhooks
   - Payload URL: `http://YOUR_DROPLET_IP:8080/webhook`
   - Content type: `application/json`
   - Events: Just the push event

## 5. 접속

배포 완료 후:
- AnythingLLM: `http://YOUR_DROPLET_IP:3001`
- Webhook endpoint: `http://YOUR_DROPLET_IP:8080/webhook`

## 6. 업데이트

GitHub에 코드를 push하면 자동으로 서버에 반영됩니다:
- GitHub Actions 워크플로우로 자동 배포
- 또는 Webhook을 통한 즉시 업데이트

## 7. 수동 업데이트

서버에 SSH 접속 후:
```bash
cd /opt/anythingllm
./update.sh
```