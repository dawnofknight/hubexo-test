#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=3000
FRONTEND_PORT=8080
MIN_NODE_VERSION=18
LOG_FILE="run.log"

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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Cleanup function
cleanup() {
    if [ ! -z "$BACKEND_PID" ] || [ ! -z "$FRONTEND_PID" ]; then
        print_warning "Shutting down services..."
        kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
        wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
        print_success "Services stopped"
    fi
    exit 0
}

# Error handler
error_exit() {
    print_error "$1"
    cleanup
    exit 1
}

# Check if port is in use
check_port() {
    local port=$1
    local service=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1
    fi
    return 0
}

# Get Node version
get_node_major_version() {
    node -v | cut -d'v' -f2 | cut -d'.' -f1
}

# Set trap for cleanup on exit
trap cleanup SIGINT SIGTERM EXIT

print_header "Prerequisites Check"

# Check Node.js
if ! command -v node &> /dev/null; then
    error_exit "Node.js is not installed. Please install Node.js ${MIN_NODE_VERSION}+ from https://nodejs.org/"
fi

NODE_VERSION=$(node -v)
NODE_MAJOR=$(get_node_major_version)
print_success "Node.js found: $NODE_VERSION"

if [ "$NODE_MAJOR" -lt "$MIN_NODE_VERSION" ]; then
    error_exit "Node.js $NODE_VERSION is too old. Please upgrade to Node.js ${MIN_NODE_VERSION}+ (Current: $NODE_MAJOR, Required: ${MIN_NODE_VERSION}+)"
fi

# Check npm
if ! command -v npm &> /dev/null; then
    error_exit "npm is not installed. Please reinstall Node.js"
fi

NPM_VERSION=$(npm -v)
print_success "npm found: $NPM_VERSION"

# Check ports availability
print_header "Checking Port Availability"

if ! check_port $BACKEND_PORT "Backend"; then
    print_warning "Port $BACKEND_PORT is already in use!"
    print_info "Attempting to free port $BACKEND_PORT..."
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null && print_success "Freed port $BACKEND_PORT" || print_error "Could not free port $BACKEND_PORT"
fi

if ! check_port $FRONTEND_PORT "Frontend"; then
    print_warning "Port $FRONTEND_PORT is already in use!"
    print_info "Attempting to free port $FRONTEND_PORT..."
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null && print_success "Freed port $FRONTEND_PORT" || print_error "Could not free port $FRONTEND_PORT"
fi

check_port $BACKEND_PORT "Backend" || error_exit "Could not free backend port $BACKEND_PORT. Close other applications using this port and try again."
check_port $FRONTEND_PORT "Frontend" || error_exit "Could not free frontend port $FRONTEND_PORT. Close other applications using this port and try again."

print_success "Ports $BACKEND_PORT and $FRONTEND_PORT are available"

# Install backend dependencies
print_header "Installing Backend Dependencies"

if [ ! -d "backend/node_modules" ]; then
    print_info "Installing packages (this may take a minute)..."
    cd backend
    npm ci 2>&1 | tee -a "$LOG_FILE" || npm install 2>&1 | tee -a "$LOG_FILE"
    if [ $? -ne 0 ]; then
        error_exit "Failed to install backend dependencies. Check $LOG_FILE for details."
    fi
    print_success "Backend dependencies installed"
    cd ..
else
    print_warning "Backend node_modules already exists, skipping installation"
fi

# Install frontend dependencies
print_header "Installing Frontend Dependencies"

if [ ! -d "frontend/node_modules" ]; then
    print_info "Installing packages (this may take a minute)..."
    cd frontend
    npm ci 2>&1 | tee -a "$LOG_FILE" || npm install 2>&1 | tee -a "$LOG_FILE"
    if [ $? -ne 0 ]; then
        error_exit "Failed to install frontend dependencies. Check $LOG_FILE for details."
    fi
    print_success "Frontend dependencies installed"
    cd ..
else
    print_warning "Frontend node_modules already exists, skipping installation"
fi

# Build backend
print_header "Building Backend"

cd backend
npm run build 2>&1 | tee -a "$LOG_FILE"
if [ $? -ne 0 ]; then
    error_exit "Failed to build backend. Check $LOG_FILE for details."
fi
print_success "Backend built successfully"
cd ..

# Build frontend
print_header "Building Frontend"

cd frontend
npm run build 2>&1 | tee -a "$LOG_FILE"
if [ $? -ne 0 ]; then
    error_exit "Failed to build frontend. Check $LOG_FILE for details."
fi
print_success "Frontend built successfully"
cd ..

# Ensure database file exists
print_header "Setting up Database"

if [ ! -f "glenigan_takehome FS.db" ] && [ ! -f "backend/glenigan_takehome FS.db" ]; then
    error_exit "Database file 'glenigan_takehome FS.db' not found. Please ensure the database file exists in the backend directory."
fi

if [ ! -f "glenigan_takehome FS.db" ] && [ -f "backend/glenigan_takehome FS.db" ]; then
    print_info "Copying database file to project root..."
    cp "backend/glenigan_takehome FS.db" "glenigan_takehome FS.db" || error_exit "Failed to copy database file"
    print_success "Database ready"
else
    print_success "Database file ready"
fi

# Start services
print_header "Starting Services"

print_success "Starting Backend on http://localhost:$BACKEND_PORT"
print_success "Starting Frontend on http://localhost:$FRONTEND_PORT"
print_warning "Press Ctrl+C to stop all services"
echo ""

# Clear log file
> "$LOG_FILE"

# Start backend
cd backend
npm start > "$LOG_FILE" 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend failed to start. Check logs:"
    tail -20 "$LOG_FILE"
    error_exit "Backend startup failed"
fi

print_success "Backend started (PID: $BACKEND_PID)"

# Start frontend
cd frontend
npm run serve >> "$LOG_FILE" 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
sleep 2

# Check if frontend is still running
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend failed to start. Check logs:"
    tail -20 "$LOG_FILE"
    error_exit "Frontend startup failed"
fi

print_success "Frontend started (PID: $FRONTEND_PID)"

# Verify services are responding
print_header "Verifying Services"

sleep 2

# Check backend health
if curl -s http://localhost:$BACKEND_PORT/health > /dev/null 2>&1; then
    print_success "Backend is responding"
else
    print_warning "Backend health check failed. It may still be starting..."
fi

# Check frontend
if curl -s http://localhost:$FRONTEND_PORT > /dev/null 2>&1; then
    print_success "Frontend is responding"
else
    print_warning "Frontend health check failed. It may still be starting..."
fi

print_header "Services Running"
print_success "Backend:  http://localhost:$BACKEND_PORT/api"
print_success "Frontend: http://localhost:$FRONTEND_PORT"
print_success "API Docs: http://localhost:$BACKEND_PORT/api-docs"
print_warning "Press Ctrl+C to stop all services"
echo ""
print_info "Logs available in: $LOG_FILE"

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID
