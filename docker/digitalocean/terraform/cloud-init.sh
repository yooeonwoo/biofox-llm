#!/usr/bin/env bash
# cloud-init script to install Docker and deploy AnythingLLM
set -euxo pipefail

# Wait for cloud-init to complete
cloud-init status --wait

# Update system
apt-get update
apt-get upgrade -y

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
fi

# Install docker-compose
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /opt/anythingllm
cd /opt/anythingllm

# Clone repository
git clone https://github.com/yooeonwoo/biofox-llm.git .

# Create environment file
cat > /opt/anythingllm/docker/.env << EOF
SERVER_PORT=3001
STORAGE_DIR=/app/server/storage
HOST=0.0.0.0
UID=1000
GID=1000
LLM_PROVIDER=${llm_provider}
OPEN_AI_KEY=${openai_key}
OPEN_MODEL_PREF=${openai_model}
EOF

# Start services
cd /opt/anythingllm/docker
docker-compose pull
docker-compose up -d

# Setup automatic update script
cat > /opt/anythingllm/update.sh << 'SCRIPT'
#!/bin/bash
cd /opt/anythingllm
git pull origin master
cd docker
docker-compose pull
docker-compose down
docker-compose up -d
SCRIPT
chmod +x /opt/anythingllm/update.sh

# Setup webhook listener for GitHub (optional)
cat > /etc/systemd/system/webhook.service << 'SERVICE'
[Unit]
Description=GitHub Webhook Listener
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/anythingllm/webhook.py
Restart=on-failure
User=root

[Install]
WantedBy=multi-user.target
SERVICE

# Create simple webhook listener
cat > /opt/anythingllm/webhook.py << 'WEBHOOK'
#!/usr/bin/env python3
import http.server
import subprocess
import json

class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/webhook':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            # Run update script
            subprocess.run(['/opt/anythingllm/update.sh'])
            
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', 8080), WebhookHandler)
    server.serve_forever()
WEBHOOK
chmod +x /opt/anythingllm/webhook.py

# Enable and start webhook service
systemctl enable webhook.service
systemctl start webhook.service