#!/bin/bash

# DungeonChat MUD - Docker Deployment Script
# This script builds and deploys the entire application stack

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker and try again."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi

    print_info "Docker and Docker Compose are installed"
}

# Create .env file if it doesn't exist
setup_env() {
    if [ ! -f ".env" ]; then
        print_info "Creating .env file..."
        cat > .env << EOF
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-$(openssl rand -hex 32)
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production-$(openssl rand -hex 32)

# Database
POSTGRES_PASSWORD=password

# Optional: QWEN Model Cache
# HUGGINGFACE_HUB_CACHE=/path/to/cache
EOF
        print_warning "Created .env file with default values. Please update JWT_SECRET and JWT_REFRESH_SECRET for production!"
    else
        print_info ".env file already exists"
    fi
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."
    docker-compose build --no-cache
    print_info "Docker images built successfully"
}

# Start services
start_services() {
    print_info "Starting services..."
    docker-compose up -d
    print_info "Services started"
}

# Wait for services to be ready
wait_for_services() {
    print_info "Waiting for services to be healthy..."

    # Wait for PostgreSQL
    print_info "Waiting for PostgreSQL..."
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U admin -d dungeonchat > /dev/null 2>&1; then
            print_info "PostgreSQL is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "PostgreSQL failed to start"
            exit 1
        fi
        sleep 1
    done

    # Wait for Chroma
    print_info "Waiting for Chroma..."
    for i in {1..30}; do
        if docker-compose exec -T chroma curl -f http://localhost:8000 > /dev/null 2>&1; then
            print_info "Chroma is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_warning "Chroma failed to start (non-critical)"
        fi
        sleep 1
    done

    # Wait for Qwen (this may take longer)
    print_info "Waiting for Qwen AI (this may take a few minutes)..."
    for i in {1..120}; do
        if docker-compose exec -T qwen curl -f http://localhost:8001/health > /dev/null 2>&1; then
            print_info "Qwen AI is ready"
            break
        fi
        if [ $i -eq 120 ]; then
            print_warning "Qwen AI is still starting (this is normal for first time)"
        fi
        if [ $((i % 10)) -eq 0 ]; then
            echo -e "  ${YELLOW}Still waiting... ($i/120)${NC}"
        fi
        sleep 1
    done
}

# Run database migrations
run_migrations() {
    print_info "Running database migrations..."
    docker-compose exec -T backend npx prisma migrate deploy --skip-generate || {
        print_warning "Migration might have already been applied"
    }
    print_info "Database migrations completed"
}

# Display service status
show_status() {
    print_info "Services status:"
    docker-compose ps
}

# Display access information
show_access_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}DungeonChat MUD is ready!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "Frontend:  http://localhost:3000"
    echo "Backend:   http://localhost:4000"
    echo "Qwen AI:   http://localhost:8001"
    echo "Chroma:    http://localhost:8000"
    echo "Database:  localhost:5432"
    echo ""
    echo "To view logs:        docker-compose logs -f"
    echo "To stop services:    docker-compose down"
    echo "To stop and cleanup: docker-compose down -v"
    echo ""
}

# Main deployment flow
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}DungeonChat MUD - Deployment Script${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""

    check_docker
    setup_env
    build_images
    start_services
    wait_for_services
    run_migrations

    echo ""
    show_status
    show_access_info
}

# Run main function
main "$@"
