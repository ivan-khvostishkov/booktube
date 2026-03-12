$ErrorActionPreference = "Stop"

# Get credentials from the AWS CLI SSO cache
$session = aws configure export-credentials | ConvertFrom-Json

$AWS_ACCESS_KEY_ID = $session.AccessKeyId
$AWS_SECRET_ACCESS_KEY = $session.SecretAccessKey
$AWS_SESSION_TOKEN = $session.SessionToken

# Step 2: Get a sign-in token from AWS federation endpoint
$sessionJson = @{
    sessionId    = $AWS_ACCESS_KEY_ID
    sessionKey   = $AWS_SECRET_ACCESS_KEY
    sessionToken = $AWS_SESSION_TOKEN
} | ConvertTo-Json -Compress

# URL-encode the session JSON
Add-Type -AssemblyName System.Web
$sessionEncoded = [System.Web.HttpUtility]::UrlEncode($sessionJson)

# Get the signin token
$signinTokenResponse = Invoke-RestMethod -Uri "https://signin.aws.amazon.com/federation?Action=getSigninToken&Session=$sessionEncoded"
$signinToken = $signinTokenResponse.SigninToken

# Step 3: Construct the federated AWS Console URL
$consoleUrl = "https://console.aws.amazon.com/"
$destination = [System.Web.HttpUtility]::UrlEncode($consoleUrl)
$federatedUrl = "https://signin.aws.amazon.com/federation?Action=login&Issuer=Example&Destination=$destination&SigninToken=$signinToken"

Write-Host "Federated AWS Console URL:"
Write-Host $federatedUrl

# Open the URL in the default browser
Start-Process $federatedUrl
