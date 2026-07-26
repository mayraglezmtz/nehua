@echo off
REM Development setup script for Nehua (Windows)

REM Check if conda is available
where conda >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Conda is not installed. Please install Miniconda or Anaconda first.
    exit /b 1
)

REM Create conda environment if it doesn't exist
conda env list | findstr "nehua-env" >nul
if %ERRORLEVEL% NEQ 0 (
    echo 🔧 Creating conda environment...
    conda env create -f environment.yml
) else (
    echo ✅ Conda environment 'nehua-env' already exists
)

REM Activate environment
echo 🚀 Activating environment and installing dependencies...
call conda activate nehua-env

REM Install Node.js dependencies
if exist package.json (
    echo 📦 Installing Node.js dependencies...
    npm install
) else (
    echo ❌ package.json not found!
    exit /b 1
)

REM Create .env.local if it doesn't exist
if not exist .env.local (
    echo ⚙️ Creating .env.local from template...
    copy .env.example .env.local
    echo 📝 Please configure your .env.local file with your GitHub OAuth credentials
)

echo ✅ Setup complete! Run 'conda activate nehua-env' and then 'npm run dev' to start development