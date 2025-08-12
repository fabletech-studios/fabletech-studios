#!/bin/bash

# Deploy Firestore security rules to Firebase

echo "🔐 Deploying Firestore Security Rules..."
echo ""
echo "IMPORTANT: This will update your production Firestore rules!"
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
firebase projects:list &> /dev/null
if [ $? -ne 0 ]; then
    echo "❌ You are not logged in to Firebase."
    echo "Please run: firebase login"
    exit 1
fi

# Get the project ID from environment or prompt
PROJECT_ID="${NEXT_PUBLIC_FIREBASE_PROJECT_ID:-}"

if [ -z "$PROJECT_ID" ]; then
    echo "Enter your Firebase Project ID (from Firebase Console):"
    read PROJECT_ID
fi

if [ -z "$PROJECT_ID" ]; then
    echo "❌ Project ID is required"
    exit 1
fi

echo ""
echo "📋 Project: $PROJECT_ID"
echo "📄 Rules file: firestore.rules"
echo ""
echo "Do you want to deploy these rules? (y/n)"
read -r CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Create firebase.json if it doesn't exist
if [ ! -f "firebase.json" ]; then
    echo "Creating firebase.json configuration..."
    cat > firebase.json << 'EOF'
{
  "firestore": {
    "rules": "firestore.rules"
  }
}
EOF
fi

# Deploy the rules
echo ""
echo "🚀 Deploying rules..."
firebase deploy --only firestore:rules --project "$PROJECT_ID"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Firestore security rules deployed successfully!"
    echo ""
    echo "Your database is now protected with proper security rules."
    echo "The rules will take effect immediately."
else
    echo ""
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi