#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Utility functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if Node.js is installed
print_header "Checking Prerequisites"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js found: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm found: $NPM_VERSION"

# Install backend dependencies
print_header "Installing Backend Dependencies"

if [ ! -d "backend/node_modules" ]; then
    cd backend
    npm ci || npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install backend dependencies"
        exit 1
    fi
    print_success "Backend dependencies installed"
    cd ..
else
    print_warning "Backend node_modules already exists, skipping installation"
fi

# Install frontend dependencies
print_header "Installing Frontend Dependencies"

if [ ! -d "frontend/node_modules" ]; then
    cd frontend
    npm ci || npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
    print_success "Frontend dependencies installed"
    cd ..
else
    print_warning "Frontend node_modules already exists, skipping installation"
fi

# Build backend
print_header "Building Backend"

cd backend
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build backend"
    exit 1
fi
print_success "Backend built successfully"
cd ..

# Build frontend
print_header "Building Frontend"

cd frontend
npm run build
if [ $? -ne 0 ]; then
    print_error "Failed to build frontend"
    exit 1
fi
print_success "Frontend built successfully"
cd ..

# Start services
print_header "Starting Services"

print_success "Backend will start on http://localhost:3000"
print_success "Frontend will start on http://localhost:8080"
print_warning "Press Ctrl+C to stop all services"
echo ""

# Start backend and frontend in parallel
cd backend && npm start &
BACKEND_PID=$!

sleep 2

cd ../frontend && npm run serve &
FRONTEND_PID=$!

# Handle cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
