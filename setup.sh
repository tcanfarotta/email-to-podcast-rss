#!/bin/bash

echo "Setting up Email to Podcast RSS Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Please edit .env file with your configuration"
fi

# Create necessary directories
mkdir -p storage/podcasts temp

echo "Setup complete! Next steps:"
echo "1. Edit .env file with your configuration"
echo "2. Add your OpenAI and ElevenLabs API keys to .env"
echo "3. Run 'npm start' to start the server"