#!/bin/bash

# School Dashboard Deployment Script

set -e

echo "🚀 Starting deployment process..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
APP_DIR="/root/School_SM_backend/deploy.sh"
PM2_APP_NAME="School_SM_backend"
BRANCH="main"

# Must be root
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}Please run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}1. Going to app directory...${NC}"
cd "$APP_DIR"

# Check git repo
if [ ! -d ".git" ]; then
  echo -e "${RED}❌ Not a git repository!${NC}"
  exit 1
fi

echo -e "${YELLOW}2. Cleaning old changes...${NC}"
git reset --hard
git clean -fd

echo -e "${YELLOW}3. Pulling latest code...${NC}"
git fetch origin
git checkout $BRANCH
git pull origin $BRANCH

echo -e "${YELLOW}4. Installing dependencies...${NC}"
npm install

echo -e "${YELLOW}5. Building application...${NC}"
npm run build

echo -e "${YELLOW}6. Restarting app with PM2...${NC}"
pm2 restart "$PM2_APP_NAME" || pm2 start npm --name "$PM2_APP_NAME" -- start

echo -e "${YELLOW}7. Saving PM2 config...${NC}"
pm2 save

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 App running on port 2056${NC}"
