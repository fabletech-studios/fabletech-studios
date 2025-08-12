#!/bin/bash

echo "🚨 FIREBASE RULES DEPLOYMENT 🚨"
echo "================================"
echo ""
echo "This script will deploy your security rules to Firebase"
echo ""

# Check if logged in
firebase projects:list > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "📝 You need to log in to Firebase first"
    echo ""
    echo "Please run: firebase login"
    echo ""
    echo "After logging in, run this script again"
    exit 1
fi

echo "✅ You are logged in to Firebase"
echo ""
echo "🚀 Deploying security rules..."
echo ""

# Deploy the rules
firebase deploy --only firestore:rules,storage:rules --project fabletech-studios-secure

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ ✅ ✅ SUCCESS! ✅ ✅ ✅"
    echo ""
    echo "Your security rules have been deployed!"
    echo "Your database is now protected and will continue working."
    echo ""
    echo "You can verify in Firebase Console:"
    echo "https://console.firebase.google.com/project/fabletech-studios-secure/firestore/rules"
else
    echo ""
    echo "❌ Deployment failed"
    echo "Please check the error message above"
    echo ""
    echo "Common fixes:"
    echo "1. Make sure you're logged into the correct account"
    echo "2. Verify project ID is: fabletech-studios-secure"
    echo "3. Check you have permissions on the project"
fi