#!/bin/bash

# Emergency restore for customer NfIgjkt6sLMX6owdblmoZH92VDi1
# This customer's document was completely deleted/missing

echo "🚨 EMERGENCY CUSTOMER RESTORE"
echo "=============================="
echo "Customer UID: NfIgjkt6sLMX6owdblmoZH92VDi1"
echo "Credits to restore: 2707"
echo "Episodes to restore: 4 episodes from series-1752726210472-bo9ch9nhe"
echo ""

# Call the restore API
curl -X POST https://www.fabletech.studio/api/admin/restore-customer \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "NfIgjkt6sLMX6owdblmoZH92VDi1",
    "credits": 2707,
    "email": "oleksandrmyrnyi@gmail.com",
    "unlockedEpisodes": [
      {
        "seriesId": "series-1752726210472-bo9ch9nhe",
        "episodeNumber": 2,
        "unlockedAt": "2025-01-13T00:00:00Z"
      },
      {
        "seriesId": "series-1752726210472-bo9ch9nhe",
        "episodeNumber": 3,
        "unlockedAt": "2025-01-13T00:00:00Z"
      },
      {
        "seriesId": "series-1752726210472-bo9ch9nhe",
        "episodeNumber": 4,
        "unlockedAt": "2025-01-13T00:00:00Z"
      },
      {
        "seriesId": "series-1752726210472-bo9ch9nhe",
        "episodeNumber": 5,
        "unlockedAt": "2025-01-13T00:00:00Z"
      }
    ]
  }' | jq .

echo ""
echo "✅ Restore command sent. Check the response above."