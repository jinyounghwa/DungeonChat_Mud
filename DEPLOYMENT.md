# DungeonChat MUD - Deployment Guide

## Table of Contents
1. [Overview](#overview)
2. [System Requirements](#system-requirements)
3. [Local Development Setup](#local-development-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)
7. [Troubleshooting](#troubleshooting)
8. [Scaling Considerations](#scaling-considerations)

---

## Overview

DungeonChat MUD is a containerized multi-service application consisting of:
- **Frontend**: Next.js 14 with Tailwind CSS (Port 3000)
- **Backend**: NestJS API server (Port 4000)
- **Database**: PostgreSQL 16 (Port 5432)
- **Vector DB**: Chroma for RAG system (Port 8000)
- **AI Model**: Qwen 2.5 7B via vLLM (Port 8001)

All services are orchestrated using Docker Compose for seamless deployment.

---

## System Requirements

### Minimum Requirements

| 항목 | 최소 | 권장 | 상세 |
|------|------|------|------|
| **CPU** | 2-core | 4-core | AI 모델 추론용 |
| **RAM** | 16GB | 24GB+ | Qwen 7B 필수 8GB |
| **Storage** | 25GB | 50GB+ | 초기 ~25GB, 운영 ~17-25GB |
| **GPU** | 선택 | NVIDIA 8GB+ | CUDA 지원시 10배 빠름 |
| **OS** | Linux/macOS/Windows(WSL2) | Linux | 프로덕션: Linux 필수 |

#### Storage 상세 분석

```
초기 설정 (최초 1회):
  ├─ Qwen 7B 모델 캐시:        ~15GB
  ├─ Docker 이미지 (Alpine):   ~8GB
  ├─ 데이터베이스:             ~500MB
  └─ 기타 (Chroma, 로그):      ~1-2GB
  ─────────────────────────────
  총 필요:                      ~24-25GB

운영 중:
  ├─ Qwen 캐시:                ~15GB (변동 없음, 재사용)
  ├─ 데이터베이스:             ~1-5GB (사용량에 따라)
  ├─ 자동 회전 로그:           ~200MB (제한됨)
  └─ 기타:                     ~1GB
  ─────────────────────────────
  총 필요:                      ~17-25GB

✅ 최적화된 기능:
  - Alpine 기반 이미지 (여유 260MB 절감)
  - 자동 로그 회전 (크기 제한)
  - 모델 캐시 공유 (재다운로드 방지)
```

### Software Requirements
- Docker 20.10+
- Docker Compose 1.29+
- Git
- Node.js 20+ (for local development)

### Network Requirements
- Internet connection for initial setup (downloading models)
- Open ports: 3000 (frontend), 4000 (backend), 8000 (Chroma), 8001 (Qwen), 5432 (DB)
- For production: Reverse proxy (nginx) recommended

---

## Local Development Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/your-repo/dungeonchat.git
cd dungeonchat
```

### Step 2: Verify Docker Installation
```bash
docker --version
docker-compose --version
docker run hello-world  # Test Docker daemon
```

### Step 3: Create Environment Files

#### Backend Environment (.env)
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and update:
# - JWT_SECRET (use: openssl rand -hex 32)
# - JWT_REFRESH_SECRET (use: openssl rand -hex 32)
# - BCRYPT_SALT_ROUNDS=10
```

#### Frontend Environment (.env.local)
```bash
cp frontend/.env.example frontend/.env.local
# Verify VITE_API_URL points to backend
```

#### Root Environment (.env)
```bash
# Create if not exists
cat > .env << 'EOF'
JWT_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)
POSTGRES_PASSWORD=your_secure_password_here
EOF
```

### Step 4: Build Images (First Time)
```bash
docker-compose build --no-cache
```

Expected build time: 10-15 minutes (includes model download for Qwen)

### Step 5: Start Services
```bash
docker-compose up -d
```

### Step 6: Verify Services Are Running
```bash
docker-compose ps

# Expected output:
# NAME                    STATUS
# dungeonchat-postgres    Up (healthy)
# dungeonchat-chroma      Up
# dungeonchat-qwen        Up
# dungeonchat-backend     Up (healthy)
# dungeonchat-frontend    Up (healthy)
```

### Step 7: Check Service Health
```bash
# Backend health
curl http://localhost:4000/health

# Frontend
curl http://localhost:3000/

# Chroma
curl http://localhost:8000/

# Qwen
curl http://localhost:8001/health
```

### Step 8: Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Documentation**: http://localhost:4000/api

---

## Docker Deployment

### Using Automated Deployment Script

The fastest way to deploy is using the included deployment script:

```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**What the script does:**
1. ✅ Checks Docker and Docker Compose installation
2. ✅ Creates .env file with random JWT secrets (if not exists)
3. ✅ Builds Docker images
4. ✅ Starts all services in detached mode
5. ✅ Waits for PostgreSQL to be healthy (up to 30 seconds)
6. ✅ Waits for Chroma to be ready (up to 30 seconds)
7. ✅ Waits for Qwen AI (up to 120 seconds - first time will be slower)
8. ✅ Runs database migrations
9. ✅ Displays service status and access URLs

### Manual Docker Deployment

If you prefer manual control:

```bash
# Build images
docker-compose build

# Start services in background
docker-compose up -d

# Wait for services (check logs)
docker-compose logs -f

# Run migrations once backend is healthy
docker-compose exec backend npx prisma migrate deploy

# View service status
docker-compose ps

# View logs for debugging
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Docker Compose Commands

```bash
# Start services
docker-compose up -d

# Stop services (data persists)
docker-compose stop

# Restart services
docker-compose restart

# Stop and remove containers (data persists)
docker-compose down

# Stop and remove everything including volumes (⚠️ DELETES DATA)
docker-compose down -v

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute command in running container
docker-compose exec backend npm run build
docker-compose exec backend npx prisma studio

# Rebuild image and restart service
docker-compose up -d --build backend
```

---

## Production Deployment

### Pre-Deployment Checklist

#### Security
- [ ] Generate strong JWT secrets (use `openssl rand -hex 32`)
- [ ] Generate strong database password (use `openssl rand -base64 32`)
- [ ] Update all default credentials in .env
- [ ] Enable HTTPS/SSL certificates (use Let's Encrypt or similar)
- [ ] Configure firewall to restrict port access
- [ ] Set NODE_ENV=production in backend
- [ ] Enable CORS restrictions (whitelist specific domains)
- [ ] Configure rate limiting on API endpoints

#### Database
- [ ] Backup existing database (if migrating from development)
- [ ] Test database connection strings
- [ ] Verify PostgreSQL password strength
- [ ] Set up automated backups (daily or more frequent)
- [ ] Configure database persistence volumes

#### Infrastructure
- [ ] Reserve adequate memory (16GB+ recommended)
- [ ] Ensure GPU drivers installed (for vLLM performance)
- [ ] Configure log aggregation (ELK, CloudWatch, etc.)
- [ ] Set up monitoring and alerting
- [ ] Test all services health checks
- [ ] Configure backup storage (external or cloud)

### Production .env Configuration

```bash
# Security
NODE_ENV=production
JWT_SECRET=<use openssl rand -hex 32>
JWT_REFRESH_SECRET=<use openssl rand -hex 32>
BCRYPT_SALT_ROUNDS=12

# Database
DATABASE_URL=postgresql://admin:<strong-password>@postgres:5432/dungeonchat
POSTGRES_PASSWORD=<strong-password>

# API Configuration
PORT=4000
VITE_API_URL=https://your-domain.com  # Use HTTPS in production

# AI Model
QWEN_API_URL=http://qwen:8001
QWEN_MODEL_NAME=Qwen/Qwen2.5-7B-Instruct

# Vector DB
CHROMA_URL=http://chroma:8000

# Logging
LOG_LEVEL=warn  # Use 'warn' or 'error' in production
```

### SSL/HTTPS Setup (Required for Production)

#### Option 1: Nginx Reverse Proxy with Let's Encrypt

1. **Install Certbot**
```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

2. **Generate SSL Certificate**
```bash
sudo certbot certonly --standalone -d your-domain.com
# Certificates located in: /etc/letsencrypt/live/your-domain.com/
```

3. **Create nginx-prod.conf**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend
    location /api {
        proxy_pass http://backend:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. **Update docker-compose.yml for nginx service**
```yaml
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx-prod.conf:/etc/nginx/conf.d/default.conf
    - /etc/letsencrypt:/etc/letsencrypt:ro
  depends_on:
    - frontend
    - backend
```

#### Option 2: Cloud Provider SSL (AWS, Azure, GCP)

- Use managed certificates from your cloud provider
- Update DNS records to point to cloud load balancer
- Configure SSL termination at load balancer level

### Deployment on Server

1. **SSH into production server**
```bash
ssh user@your-server-ip
```

2. **Install Docker and Docker Compose**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

3. **Clone repository**
```bash
git clone https://github.com/your-repo/dungeonchat.git
cd dungeonchat
```

4. **Create production .env**
```bash
# Edit .env with production values
nano .env
```

5. **Run deployment**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

6. **Enable auto-start on reboot**
```bash
# Create systemd service
sudo cat > /etc/systemd/system/dungeonchat.service << 'EOF'
[Unit]
Description=DungeonChat MUD Service
Requires=docker.service
After=docker.service

[Service]
Type=simple
WorkingDirectory=/path/to/dungeonchat
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable dungeonchat
sudo systemctl start dungeonchat
```

---

## Monitoring and Maintenance

### Log Management

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service (last 100 lines, follow)
docker-compose logs -f --tail 100 backend

# Timestamp included
docker-compose logs -f -t backend

# Export logs to file
docker-compose logs > dungeonchat-logs.txt
```

#### Log Rotation
Add to docker-compose.yml:
```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "10"
```

### Database Backup

#### Manual Backup
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump \
  -U admin dungeonchat > backup-$(date +%Y%m%d-%H%M%S).sql

# Backup size
ls -lh backup-*.sql

# Verify backup (list tables)
docker exec -i dungeonchat-postgres psql \
  -U admin -d dungeonchat < backup.sql
```

#### Automated Daily Backup
```bash
# Create backup script
cat > backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/backups/dungeonchat"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump \
  -U admin dungeonchat > $BACKUP_DIR/backup_$TIMESTAMP.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup completed: backup_$TIMESTAMP.sql"
EOF

chmod +x backup.sh

# Add to crontab
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Health Checks

```bash
# Check all services
docker-compose ps

# Service health details
docker inspect dungeonchat-backend --format='{{json .State.Health}}' | jq

# Test API endpoints
curl -s http://localhost:4000/health | jq
curl -s http://localhost:3000/ | head -1

# Test database connection
docker-compose exec -T postgres psql \
  -U admin -d dungeonchat -c "SELECT 1"

# Test Chroma
curl -s http://localhost:8000/api/v1/collections | jq

# Test Qwen AI
curl -s http://localhost:8001/health | jq
```

### Performance Monitoring

#### Container Resource Usage
```bash
# Real-time resource usage
docker stats

# Detailed memory usage
docker inspect dungeonchat-backend --format='{{json .State}}' | jq '.Pid' | \
  xargs -I {} ps aux | grep {}
```

#### Database Performance
```bash
# Slow query log (if enabled)
docker-compose exec postgres \
  psql -U admin -d dungeonchat -c "\d+ pg_stat_statements"

# Active connections
docker-compose exec postgres \
  psql -U admin -d dungeonchat -c "SELECT count(*) FROM pg_stat_activity"

# Table sizes
docker-compose exec postgres \
  psql -U admin -d dungeonchat -c \
  "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) \
   FROM pg_tables ORDER BY pg_total_relation_size DESC"
```

### Model Cache Management

#### Check Cache Size
```bash
# Qwen model cache location
docker-compose exec qwen du -sh /root/.cache/huggingface
du -sh models/

# List cached models
docker-compose exec qwen ls -lh /root/.cache/huggingface
```

#### Optimize Storage
```bash
# ✅ 권장: 모델 캐시 유지 (반복 다운로드 방지)
# 모델은 첫 다운로드 후 재사용되므로 보관할 것 권장

# ⚠️ 주의: 캐시 삭제는 재다운로드 필요 (~15GB)
# rm -rf models/*  # 절대 추천하지 않음!

# 💡 팁: 별도 볼륨으로 모델 이동 (용량 문제시)
# docker volume create qwen_models_backup
# docker-compose exec qwen cp -r /root/.cache/huggingface/* /backup/
```

---

### Storage Optimization Guide

#### 1. Monitor Storage Usage

```bash
# 전체 Docker 스토리지 확인
docker system df

# 용량별 상세 분석
docker system df --verbose

# 특정 볼륨 크기
du -sh models/              # Qwen 모델
du -sh postgres_data/       # 데이터베이스
du -sh chroma_data/         # Chroma 벡터DB
```

#### 2. Log Rotation (Already Configured)

로그 자동 회전이 이미 설정되어 있습니다:
```yaml
# docker-compose.yml에서 설정됨
logging:
  driver: "json-file"
  options:
    max-size: "100m"        # 파일당 최대 100MB
    max-file: "3"           # 최대 3개 파일 유지
```

#### 3. Database Optimization

```bash
# PostgreSQL 크기 확인
docker-compose exec postgres psql -U admin -d dungeonchat -c \
  "SELECT pg_size_pretty(pg_database_size('dungeonchat'));"

# 테이블별 크기 분석
docker-compose exec postgres psql -U admin -d dungeonchat -c \
  "SELECT schemaname, tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
   FROM pg_tables
   ORDER BY pg_total_relation_size DESC;"

# 데이터베이스 최적화 (주 1회 권장)
docker-compose exec postgres psql -U admin -d dungeonchat -c "VACUUM ANALYZE;"
```

#### 4. Clean Up Unused Images & Containers

```bash
# 중지된 컨테이너 정리 (안전함)
docker container prune -f

# 사용하지 않는 이미지 정리 (재빌드 필요할 수 있음)
docker image prune -a -f

# 빌드 캐시 정리
docker builder prune -a -f

# 사용하지 않는 네트워크 정리
docker network prune -f

# 사용하지 않는 볼륨 정리 ⚠️
# docker volume prune -f  # 주의: 데이터 손실 가능
```

#### 5. Emergency Storage Recovery

긴급 상황에서만 사용하세요:

```bash
# 모든 중지된 컨테이너 + 이미지 + 네트워크 정리
docker system prune -a -f

# 전체 정리 (데이터 손실 주의!)
# docker system prune -a --volumes -f
```

#### 6. Scheduled Maintenance

Crontab에 추가:

```bash
# 주간 데이터베이스 최적화 (매주 월요일 새벽 2시)
0 2 * * 1 cd /path/to/dungeonchat && docker-compose exec -T postgres psql -U admin -d dungeonchat -c "VACUUM ANALYZE;"

# 월간 정리 (매월 1일 새벽 3시)
0 3 1 * * cd /path/to/dungeonchat && docker container prune -f && docker image prune -a -f
```

---

## Troubleshooting

### Service Won't Start

#### PostgreSQL Connection Error
```
Error: could not connect to server: Connection refused
```

**Solution:**
```bash
# Check if postgres container is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify DATABASE_URL format
echo $DATABASE_URL

# Try rebuilding
docker-compose down -v postgres
docker-compose up postgres -d
```

#### Qwen AI Model Download Stuck
```
Issue: Qwen container keeps restarting, model not downloaded
```

**Solution:**
```bash
# Check download progress
docker-compose logs qwen | grep -i download

# Increase timeout in docker-compose.yml (start_period)
# Or pre-download model:
docker-compose exec qwen \
  python -c "from transformers import AutoTokenizer; \
  AutoTokenizer.from_pretrained('Qwen/Qwen2.5-7B-Instruct')"

# Wait longer - first start can take 30+ minutes with slow internet
```

#### Backend Container Exits Immediately
```bash
# Check logs for error
docker-compose logs backend

# Common issues:
# 1. Prisma migration fails
docker-compose exec backend npx prisma migrate deploy --skip-generate

# 2. Database not ready
docker-compose logs postgres

# 3. Missing environment variables
docker-compose exec backend env | grep DATABASE_URL
```

### High Memory Usage

#### Monitor Memory
```bash
# Real-time stats
docker stats dungeonchat-backend dungeonchat-qwen

# Set memory limits in docker-compose.yml
services:
  qwen:
    deploy:
      resources:
        limits:
          memory: 10G
        reservations:
          memory: 8G
```

#### Reduce Memory Footprint
```yaml
# Reduce Qwen max model length
qwen:
  command: >
    --model Qwen/Qwen2.5-7B-Instruct
    --max-model-len 2048  # Reduced from 4096
    --tensor-parallel-size 1
```

### Slow API Response

#### Check Backend Logs
```bash
docker-compose logs -f backend | grep -i "time\|duration"
```

#### Database Query Performance
```bash
# Enable slow query log
docker-compose exec postgres psql -U admin -d dungeonchat -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;  -- 1 second"

# Restart postgres to apply
docker-compose restart postgres
```

#### Qwen Model Inference Slow
```bash
# Check Qwen logs
docker-compose logs -f qwen | grep -i "generation\|time"

# Reduce tokens per inference (in ai.service.ts)
generation_config = {
    "max_tokens": 100,  # Reduced from 150
    "temperature": 0.7,
}
```

### Database Corruption

#### Repair PostgreSQL
```bash
# Stop services
docker-compose down

# Run repair
docker-compose run postgres pg_repair

# Or restore from backup
docker-compose up postgres -d
docker-compose exec postgres psql -U admin -d dungeonchat < backup.sql
```

### Docker Disk Space Issues

#### Check Disk Usage
```bash
# Docker disk usage
docker system df

# Clean up unused images/containers
docker system prune -a
```

#### Free Up Space
```bash
# Remove old backups
rm backup-*.sql.bak

# Clean Docker build cache
docker builder prune

# Remove unused volumes
docker volume prune
```

---

## Scaling Considerations

### Horizontal Scaling (Multiple Instances)

#### Load Balancer Setup (nginx)
```nginx
upstream backend {
    server backend1:4000;
    server backend2:4000;
    server backend3:4000;
}

server {
    listen 80;
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
    }
}
```

#### Multiple Backend Instances
```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Note: Requires removing container_name and port mappings
```

### Database Replication

For production redundancy, consider:
- PostgreSQL streaming replication
- CloudSQL/Aurora managed databases
- Multi-zone database setup

### Caching Strategy

#### Redis Cache Layer
```yaml
redis:
  image: redis:alpine
  ports:
    - "6379:6379"
  volumes:
    - redis_data:/data

backend:
  environment:
    REDIS_URL: redis://redis:6379
```

#### Cache Invalidation Strategy
```typescript
// Invalidate cache on data changes
await cache.invalidate(`character:${characterId}`);
await cache.invalidate(`battles:${characterId}`);
```

### CDN for Static Assets

```bash
# Build frontend with CDN URLs
VITE_CDN_URL=https://cdn.your-domain.com npm run build

# Upload dist files to CDN
aws s3 sync dist/ s3://your-bucket/
```

### Monitoring at Scale

#### Prometheus + Grafana
```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
  depends_on:
    - prometheus
```

#### ELK Stack (Optional)
```yaml
elasticsearch:
  image: docker.elastic.co/elasticsearch/elasticsearch:8.0.0

kibana:
  image: docker.elastic.co/kibana/kibana:8.0.0
  ports:
    - "5601:5601"
```

---

## Support and Resources

### Quick Commands Reference
```bash
# Start services
docker-compose up -d && docker-compose logs -f

# Health check
docker-compose ps && curl http://localhost:4000/health

# View backend logs
docker-compose logs -f backend

# Restart backend
docker-compose restart backend

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Database backup
docker-compose exec postgres pg_dump -U admin dungeonchat > backup.sql

# Stop services
docker-compose down

# Clean everything
docker-compose down -v
```

### Documentation Links
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [NestJS Docs](https://docs.nestjs.com/)
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Chroma Docs](https://docs.trychroma.com/)
- [vLLM Docs](https://docs.vllm.ai/)

### Contact Support
For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review service logs: `docker-compose logs`
3. Check GitHub Issues: https://github.com/your-repo/dungeonchat/issues
4. Create new issue with error logs and environment details

---

**Last Updated**: 2024-12-16
**Version**: 1.0
**Maintained By**: DungeonChat Development Team
