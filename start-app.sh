#!/bin/bash

# Script to start both backend and frontend servers for Jonkech app
# Place this script in the project root directory

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to display colored text
print_color() {
  local color=$1
  local text=$2
  echo -e "\033[${color}m${text}\033[0m"
}

print_color "1;32" "=== Jonkech App Startup Script ==="
print_color "1;36" "Starting backend and frontend servers..."

# Check Python and pip
if ! command_exists python3; then
  print_color "1;31" "Error: Python 3 is not installed. Please install Python 3 to continue."
  exit 1
fi

# Check Node.js and npm for frontend
if ! command_exists node; then
  print_color "1;31" "Error: Node.js is not installed. Please install Node.js to run the frontend."
  exit 1
fi

# Start backend server
print_color "1;34" "\n=== Starting Django Backend ==="

# Navigate to backend directory
cd "$(dirname "$0")/backend" || { print_color "1;31" "Error: Could not navigate to backend directory"; exit 1; }

# Activate virtual environment if it exists
if [ -d "venv" ]; then
  print_color "1;36" "Activating virtual environment..."
  if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
  elif [ -f "venv/Scripts/activate" ]; then
    source venv/Scripts/activate
  else
    print_color "1;33" "Warning: Could not activate virtual environment. Continuing without it..."
  fi
fi

# Install backend dependencies if needed
if [ -f "requirements.txt" ]; then
  print_color "1;36" "Installing backend dependencies..."
  pip3 install -r requirements.txt
fi

# Run Django server in the background
print_color "1;36" "Starting Django server at http://localhost:8000/"
python3 manage.py runserver 0.0.0.0:8000 &
DJANGO_PID=$!
print_color "1;32" "Django server is running with PID: $DJANGO_PID"

# Navigate back to root directory
cd ..

# Start frontend server
print_color "1;34" "\n=== Starting React Native Frontend ==="

# Navigate to frontend directory
cd "$(dirname "$0")/frontend" || { print_color "1;31" "Error: Could not navigate to frontend directory"; exit 1; }

# Install frontend dependencies if needed
if [ -f "package.json" ]; then
  print_color "1;36" "Installing frontend dependencies..."
  npm install
fi

# Start the Expo development server
print_color "1;36" "Starting Expo development server..."
npx expo start

# Function to clean up when the script is interrupted
cleanup() {
  print_color "1;33" "\nStopping servers..."
  if [ -n "$DJANGO_PID" ]; then
    kill $DJANGO_PID
    print_color "1;32" "Django server stopped."
  fi
  print_color "1;32" "Frontend server stopped."
  exit 0
}

# Set up trap for clean shutdown
trap cleanup INT TERM

# Wait for processes to finish
wait
