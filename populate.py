# Calls Okta endpoints to verify profile attribute exists, then creates demo users
# Example call: bash populate.sh https://example.oktapreview.com API_KEY > data.txt
import requests
import json
import sys


def create_groups(org, token):
  HEADERS = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization' : 'SSWS {}'.format(token),
  }

  providers = {
    "profile": {
      "name": "Providers",
      "description": "Providers"
    }
  }

  patients = {
    "profile": {
      "name": "Patients",
      "description": "Patients"
    }
  }

  providers_read_only = {
    "profile": {
      "name": "Providers-read-only",
      "description": "Providers-read-only"
    }
  }

  r = requests.post(url="{}/{}".format(org,
      "/api/v1/groups"),
      headers=HEADERS,
      data=json.dumps(providers))
  response = r.json()
  if 'id' in response:
    print "Added Provider Group"
    group_id['providers'] = response['id']
  else :
    print "Group POST Error: ", response

  r = requests.post(url="{}/{}".format(org,
    "/api/v1/groups"),
    headers=HEADERS,
    data=json.dumps(patients))
  response = r.json()
  if 'id' in response:
    print "Added Patients Group"
    group_id['patients'] = response['id']
  else :
    print "Group POST Error: ", response

  r = requests.post(url="{}/{}".format(org,
    "/api/v1/groups"),
    headers=HEADERS,
    data=json.dumps(providers_read_only))
  response = r.json()
  if 'id' in response:
    print "Added Providers-read-only Group"
    group_id['providers_read_only'] = response['id']
  else :
    print "Group POST Error: ", response

def add_users(org, token):
  HEADERS = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization' : 'SSWS {}'.format(token),
  }
  if 'providers' in group_id:
    group = group_id['providers']
  else:
    group = None
  
  user1 = {
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "johndoe@example.com",
      "login": "johndoe@example.com",
      "mobilePhone": "555-415-1337",
      "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/OpenIDConnectSwift/Assets.xcassets/0000001.imageset/0000001.png"
    },
    "groupIds": [
      group
    ],
    "credentials": {
      "password": {"value" : "password"},
      "recovery_question": {
        "question": "Name a major player in the cowboy scene?",
        "answer": "Cowboy Dan"
      }
    }
  }

  user2 = {
    "profile": {
      "firstName": "Jane",
      "lastName": "Doe",
      "email": "janedoe@example.com",
      "login": "janedoe@example.com",
      "mobilePhone": "555-415-1337",
      "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/OpenIDConnectSwift/Assets.xcassets/0000002.imageset/0000002.png"
    },
    "groupIds": [
      group
    ],
    "credentials": {
      "password": {"value" : "password"},
      "recovery_question": {
        "question": "Name a major player in the cowboy scene?",
        "answer": "Cowboy Dan"
      }
    }
  }

  user3 = {
    "profile": {
      "firstName": "Richard",
      "lastName": "Roe",
      "email": "richardroe@example.com",
      "login": "richardroe@example.com",
      "mobilePhone": "555-415-1337",
      "profileImageUrl" : "https://raw.githubusercontent.com/jmelberg/acmehealth-swift/master/OpenIDConnectSwift/Assets.xcassets/0000003.imageset/0000003.png"
    },
    "groupIds": [
      group
    ],
    "credentials": {
      "password": {"value" : "password"},
      "recovery_question": {
        "question": "Name a major player in the cowboy scene?",
        "answer": "Cowboy Dan"
      }
    }
  }

  r = requests.post(url="{}/{}".format(org,
      "/api/v1/users?activate=true"),
      headers=HEADERS,
      data=json.dumps(user1))
  response = r.json()
  if 'id' in response:
    providers.append({
      'id' : response['id'],
      'profileImageUrl' : response['profileImageUrl'],
      'name' : 'Dr. John Doe'
      })
  else :
    print "User POST Error: ", response

  r = requests.post(url="{}/{}".format(org,
    "/api/v1/users?activate=true"),
    headers=HEADERS,
    data=json.dumps(user2))

  response = r.json()
  if 'id' in response:
    providers.append({
      'id' : response['id'],
      'profileImageUrl' : response['profileImageUrl'],
      'name' : 'Dr. Jane Doe'
      })
  else :
    print "User POST Error: ", response

  r = requests.post(url="{}/{}".format(org,
    "/api/v1/users?activate=true"),
    headers=HEADERS,
    data=json.dumps(user3))
  response = r.json()
  if 'id' in response:
    providers.append({
      'id' : response['id'],
      'profileImageUrl' : response['profileImageUrl'],
      'name' : 'Dr. Richard Roe'
      })
  else :
    print "User POST Error: ", response


def update_schema(org, token):
    HEADERS = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization' : 'SSWS {}'.format(token),
    }

    schema = {
      "definitions": {
        "custom": {
          "id": "#custom",
          "type": "object",
          "properties": {
            "profileImageUrl": {
              "title": "Profile Image URL",
              "description": "User profile image url",
              "type": "string",
              "required": False,
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
    }
    r = requests.post(url="{}/{}".format(org,
      "/api/v1/meta/schemas/user/default/"),
      headers=HEADERS,
      data=json.dumps(schema))

    response = r.json()
    if "error" in response:
      print response


if __name__ in '__main__':
    """
        Args:
            1. Base url
            2. api_token
    """
    args = sys.argv
    BASE_URL = None
    API_TOKEN = None
    providers = []
    group_id = {}
    if len(args) > 2:
        BASE_URL = args[1].strip()
        API_TOKEN = args[2].strip()
    else:
        print "Please specify arguments: BASE_URL API_TOKEN"
        print "Ex: python populate.py https://example.oktapreview.com TOKEN"
        sys.exit()

    # Update user profile schema for picture attribute "profileImageUrl"
    update_schema(BASE_URL, API_TOKEN)

    # Update groups
    create_groups(BASE_URL, API_TOKEN)

    # Update users
    add_users(BASE_URL, API_TOKEN)

    if len(providers) > 0:
      print providers
