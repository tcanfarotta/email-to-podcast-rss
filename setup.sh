#!/bin/bash

echo "Setting up Email to Podcast RSS Service..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv

# Activate virtual environment and install Python dependencies
echo "Installing Python dependencies..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    ./venv/Scripts/activate && pip install -r requirements.txt
else
    # macOS/Linux
    source venv/bin/activate && pip install -r requirements.txt
fi

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
echo "2. Configure Podcastfy with your API keys (see Podcastfy documentation)"
echo "3. Run 'npm start' to start the server"