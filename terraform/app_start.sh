#!/bin/bash

# Fix the PATH to include Node.js binaries
echo "Fixing PATH"
export PATH=$PATH:/root/.nvm/versions/node/v20.15.0/bin

# Source environment variables
echo "Sourcing environment variables"
source /opt/aws-final-project/envs.sh

# Start backend
echo "Starting backend"
cd /opt/aws-final-project/backend/
nohup node server.js &

# Start frontend
echo "Starting frontend"
cd /opt/aws-final-project/frontend/ 
nohup node app.js &

echo "Application started. Backend and frontend are running in the background."