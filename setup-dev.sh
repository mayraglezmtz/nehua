#!/bin/bash
# Development setup script for Nehua

# Check if conda is available
if ! command -v conda &> /dev/null; then
    echo "❌ Conda is not installed. Please install Miniconda or Anaconda first."
    exit 1
fi

# Create conda environment if it doesn't exist
if ! conda env list | grep -q "nehua-env"; then
    echo "🔧 Creating conda environment..."
    conda env create -f environment.yml
else
    echo "✅ Conda environment 'nehua-env' already exists"
fi

# Activate environment and install Node.js dependencies
echo "🚀 Activating environment and installing dependencies..."
eval "$(conda shell.bash hook)"
conda activate nehua-env

# Check if package.json exists and install npm dependencies
if [ -f "package.json" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
else
    echo "❌ package.json not found!"
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚙️ Creating .env.local from template..."
    cp .env.example .env.local
    echo "📝 Please configure your .env.local file with your GitHub OAuth credentials"
fi

echo "✅ Setup complete! Run 'conda activate nehua-env && npm run dev' to start development"