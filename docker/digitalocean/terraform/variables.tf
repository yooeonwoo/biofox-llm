variable "do_token" {
  description = "DigitalOcean API token"
  type        = string
  sensitive   = true
}

variable "region" {
  description = "DigitalOcean region code (e.g. sgp1, nyc3)"
  type        = string
  default     = "sgp1"
}

variable "ssh_pub_path" {
  description = "Path to local SSH public key"
  type        = string
  default     = "~/.ssh/id_ed25519.pub"
}

# AnythingLLM specific variables
variable "llm_provider" {
  description = "LLM Provider (e.g., openai, ollama)"
  type        = string
  default     = "openai"
}

variable "openai_key" {
  description = "OpenAI API Key"
  type        = string
  sensitive   = true
}

variable "openai_model" {
  description = "OpenAI Model to use"
  type        = string
  default     = "o4-mini"
}
