#!/bin/bash
set -e

echo "🚀 Deploying Learn-it Frontend to Vercel..."

# Get the script directory and navigate to the frontend root
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_DIR="$DIR/../../apps/web"

cd "$FRONTEND_DIR"

echo "📂 Changed directory to $FRONTEND_DIR"

# Define the backend API URL
API_URL="https://ca-learnit-backend.agreeableocean-d133ab66.eastasia.azurecontainerapps.io/api/v1"

echo "🔗 Backend API URL is set to: $API_URL"

echo ""
echo "⚠️  NOTE: If this is your first time deploying to Vercel from this CLI, you will be prompted to log in."
echo "👉 Follow the prompts:"
echo "   - 'Set up and deploy?' -> Yes (Y)"
echo "   - 'Which scope do you want to deploy to?' -> (Your account)"
echo "   - 'Link to existing project?' -> No (N)"
echo "   - 'What's your project's name?' -> learnit-frontend (or press Enter for default)"
echo "   - 'In which directory is your code located?' -> (Press Enter)"
echo "   - 'Want to modify these settings?' -> No (N)"
echo ""

# Deploy to Vercel with the environment variable
echo "⚡ Starting Vercel deployment..."
npx vercel --prod --env NEXT_PUBLIC_API_URL="$API_URL"

echo "✅ Deployment command finished."
