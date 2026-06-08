# Initialize git repository
git init

# Stage all files
git add .

# Create initial commit
git commit -m "Initial commit: AI Smart Solar Monitoring System

- Real-time IoT sensor monitoring from Arduino/ESP8266
- AI-powered solar prediction with ML algorithms
- Fault detection and smart load management
- Google Sheets integration for data backup
- Bolt Database backend with PostgreSQL
- React + TypeScript + Tailwind CSS frontend"

# Add your GitHub remote (replace YOUR_USERNAME and REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
