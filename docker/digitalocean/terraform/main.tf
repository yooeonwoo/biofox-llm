# Droplet + AnythingLLM 직접 배포

resource "digitalocean_ssh_key" "local" {
  name       = "local-key"
  public_key = trimspace(file(pathexpand(var.ssh_pub_path)))
}

resource "digitalocean_droplet" "anythingllm" {
  name              = "anythingllm-server"
  region            = var.region
  size              = "s-2vcpu-4gb" # AnythingLLM requires more resources
  image             = "ubuntu-22-04-x64"
  ssh_keys          = [digitalocean_ssh_key.local.id]
  monitoring        = true

  # 최초 부팅 시 Docker와 AnythingLLM 설치
  user_data = templatefile("${path.module}/cloud-init.sh", {
    llm_provider = var.llm_provider
    openai_key   = var.openai_key
    openai_model = var.openai_model
  })
}

# Firewall rules
resource "digitalocean_firewall" "anythingllm" {
  name = "anythingllm-firewall"

  droplet_ids = [digitalocean_droplet.anythingllm.id]

  inbound_rule {
    protocol         = "tcp"
    port_range       = "22"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "3001"
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  inbound_rule {
    protocol         = "tcp"
    port_range       = "8080"  # Webhook listener
    source_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "tcp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "udp"
    port_range            = "1-65535"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }

  outbound_rule {
    protocol              = "icmp"
    destination_addresses = ["0.0.0.0/0", "::/0"]
  }
}
