terraform {
  required_version = ">= 1.5.0"
  required_providers {
    digitalocean = {
      source  = "digitalocean/digitalocean"
      version = "~> 2.35"
    }
  }
}

provider "digitalocean" {
  # 토큰은 terraform.tfvars 또는 CLI -var 로 전달합니다.
  token = var.do_token
}
