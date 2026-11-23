#!/usr/bin/env bash
# Sets up Lezzet Radar on a fresh Ubuntu server (Oracle Cloud ARM, Hetzner, etc.) in one go.
# Usage:  curl -fsSL https://raw.githubusercontent.com/metesin58-arch/lezzet-radar/master/scripts/install-server.sh | bash
set -euo pipefail

REPO="https://github.com/metesin58-arch/lezzet-radar.git"
DIR="$HOME/lezzet-radar"

echo "==> 1/5 Docker kuruluyor"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
fi

echo "==> 1b  Yedek bellek (swap) kontrolü"
# On 4 GB machines a 2 GB swap guards against out-of-memory crashes while the scraper's browser runs
if [ "$(swapon --show | wc -l)" -eq 0 ]; then
  sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile >/dev/null && sudo swapon /swapfile
  grep -q "/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" | sudo tee -a /etc/fstab >/dev/null
fi

echo "==> 2/5 Güvenlik duvarında 80 ve 443 açılıyor"
# Oracle's Ubuntu images ship iptables rules that block everything except 22
if sudo iptables -L INPUT -n | grep -q "REJECT"; then
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
  sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
  sudo apt-get install -y iptables-persistent >/dev/null 2>&1 || true
  sudo netfilter-persistent save || true
fi

echo "==> 3/5 Kod indiriliyor"
if [ -d "$DIR/.git" ]; then git -C "$DIR" pull --ff-only; else git clone "$REPO" "$DIR"; fi
cd "$DIR"

echo "==> 4/5 Ayarlar"
IP=$(curl -fsS https://api.ipify.org || curl -fsS https://ifconfig.me)
SITE="${SITE_ADDRESS:-$(echo "$IP" | tr . -).sslip.io}"
cat > .env <<ENV
SITE_ADDRESS=$SITE
TRUST_PROXY=1
WEB_BIND=127.0.0.1:3000
ENV
echo "    Site adresi: https://$SITE"

echo "==> 5/5 Uygulama başlatılıyor (ilk seferde 5-10 dk sürebilir)"
sudo docker pull gosom/google-maps-scraper@sha256:1dd971ebc2f090f6d879f701ea72358c89e363a952d5e10e9bdfe300fc43851f >/dev/null
sudo docker compose --profile https up -d --build

echo
echo "Hazır: https://$SITE"
echo "İstanbul'u önceden doldurmak için:  cd $DIR && sudo docker compose exec worker npm run seed:istanbul"
