#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Get the current AWS profile name (or default)
PROFILE=${AWS_PROFILE:-default}

# Export credentials to JSON format
CREDS=$(aws configure export-credentials)

if [ $? -ne 0 ]; then
    echo "Failed to export AWS credentials. Please check your AWS configuration."
    exit 1
fi

# Extract access key and secret key from JSON
ACCESS_KEY=$(echo $CREDS | jq -r '.AccessKeyId')
SECRET_KEY=$(echo $CREDS | jq -r '.SecretAccessKey')
SESSION_TOKEN=$(echo $CREDS | jq -r '.SessionToken')

# Get AWS region
REGION=$(aws configure get region)
REGION=${REGION:-us-east-1} # Default to us-east-1 if no region is set

# Generate sign-in URL
SIGNIN_URL="https://signin.aws.amazon.com/federation"
CONSOLE_URL="https://console.aws.amazon.com/"

# Create session JSON
SESSION_DATA="{\"sessionId\":\"${ACCESS_KEY}\",\"sessionKey\":\"${SECRET_KEY}\",\"sessionToken\":\"${SESSION_TOKEN}\"}"

# URL encode the session data
URL_ENCODED_SESSION_DATA=$(echo $SESSION_DATA | python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip()))')

# Get signin token
SIGNIN_TOKEN=$(curl -s "${SIGNIN_URL}?Action=getSigninToken&SessionDuration=43200&Session=${URL_ENCODED_SESSION_DATA}" | jq -r '.SigninToken')

# Generate final URL
FINAL_URL="${SIGNIN_URL}?Action=login&Destination=${CONSOLE_URL}&SigninToken=${SIGNIN_TOKEN}"

# Open URL in default browser
#open "$FINAL_URL"

# Open URL in Chrome
open -a "Google Chrome" "$FINAL_URL"
