output "droplet_ip" {
  description = "Public IPv4 address of the AnythingLLM Droplet"
  value       = digitalocean_droplet.anythingllm.ipv4_address
}

output "anythingllm_url" {
  description = "URL to access AnythingLLM"
  value       = "http://${digitalocean_droplet.anythingllm.ipv4_address}:3001"
}

output "webhook_url" {
  description = "GitHub webhook URL for automatic deployments"
  value       = "http://${digitalocean_droplet.anythingllm.ipv4_address}:8080/webhook"
}
