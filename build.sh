#!/bin/bash

echo "Building SimSync Frontend and Backend..."

# Install frontend dependencies and build
echo "Installing frontend dependencies..."
cd simsync/frontend
npm install

echo "Building frontend..."
npm run build

echo "Moving to backend directory..."
cd ../backend

echo "Build complete! Frontend built and ready to be served by FastAPI."