#!/bin/bash

# Fix the PATH to include Node.js binaries
echo "Fixing PATH"
export PATH=$PATH:/root/.nvm/versions/node/v20.15.0/bin

# Source environment variables
echo "Sourcing environment variables"
source /opt/webapp-for-aws/envs.sh

# Start backend
echo "Starting backend"
cd /opt/webapp-for-aws/backend/
nohup node server.js &

# Start frontend
echo "Starting frontend"
cd /opt/webapp-for-aws/frontend/ 
nohup node app.js &

echo "Application started. Backend and frontend are running in the background."