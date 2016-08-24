#!/bin/bash

# Calls Okta endpoints to verify profile attribute exists, then creates demo users
# Example call: bash populate.sh https://example.oktapreview.com API_KEY > data.txt

org=$1
api_token=$2

# Update user profile schema for picture attribute "profileImageUrl"
image=$(curl -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS $api_token" \
-d '{
  "definitions": {
    "custom": {
      "id": "#custom",
      "type": "object",
      "properties": {
        "profileImageUrl": {
          "title": "Profile Image URL",
          "description": "User profile image url",
          "type": "string",
          "required": false,
          "minLength": 1,
          "maxLength": 200,
          "permissions": [
            {
              "principal": "SELF",
              "action": "READ_WRITE"
            }
          ]
        }
      },
      "required": []
    }
  }
}' "$org/api/v1/meta/schemas/user/default/")

user1=$(curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS $api_token" \
-d '{
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "johndoe@example.com",
    "login": "johndoe@example.com",
    "mobilePhone": "555-415-1337",
    "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/OpenIDConnectSwift/Assets.xcassets/0000001.imageset/0000001.png"
  },
  "credentials": {
    "password": {"value" : "password"},
    "recovery_question": {
      "question": "Name a major player in the cowboy scene?",
      "answer": "Cowboy Dan"
    }
  }
}' "$org/api/v1/users?activate=true")

user2=$(curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS $api_token" \
-d '{
  "profile": {
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "janedoe@example.com",
    "login": "janedoe@example.com",
    "mobilePhone": "555-415-1337",
    "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/OpenIDConnectSwift/Assets.xcassets/0000002.imageset/0000002.png"
  },
  "credentials": {
    "password": {"value" : "password"},
    "recovery_question": {
      "question": "Name a major player in the cowboy scene?",
      "answer": "Cowboy Dan"
    }
  }
}' "$org/api/v1/users?activate=true")


user3=$(curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS $api_token" \
-d '{
  "profile": {
    "firstName": "Richard",
    "lastName": "Roe",
    "email": "richardroe@example.com",
    "login": "richardroe@example.com",
    "mobilePhone": "555-415-1337",
    "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/OpenIDConnectSwift/Assets.xcassets/0000003.imageset/0000003.png"
  },
  "credentials": {
    "password": {"value" : "password"},
    "recovery_question": {
      "question": "Name a major player in the cowboy scene?",
      "answer": "Cowboy Dan"
    }
  }
}' "$org/api/v1/users?activate=true")

id1=$($user1 | python -c "import json,sys;obj=json.load(sys.stdin);print obj['id'];")
id2=$($user2 | python -c "import json,sys;obj=json.load(sys.stdin);print obj['id'];")
id3=$($user3 | python -c "import json,sys;obj=json.load(sys.stdin);print obj['id'];")

# Output users to be piped to config file
printf '{"providers" : [{"id":"%s", "name" : "Dr. John Doe"},{"id" : "%s","name" : "Dr. Jane Doe"},{"id" : "%s","name" : "Dr. Richard Roe"}]}"\n' "$id1" "$id2" "$id3"

