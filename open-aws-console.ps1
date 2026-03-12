$ErrorActionPreference = "Stop"

# Detect if running on EC2 by checking IMDS availability
try {
    $null = Invoke-RestMethod -Method PUT -Uri "http://169.254.169.254/latest/api/token" `
        -Headers @{"X-aws-ec2-metadata-token-ttl-seconds" = "21600"} -TimeoutSec 2
    $isEC2 = $true
    Write-Host "Detected EC2 environment - using instance metadata for credentials"
} catch {
    $isEC2 = $false
    Write-Host "Detected local environment - using AWS CLI SSO cache for credentials"
}

if ($isEC2) {
    # Get credentials from EC2 instance metadata
    $token = Invoke-RestMethod -Method PUT -Uri "http://169.254.169.254/latest/api/token" `
        -Headers @{"X-aws-ec2-metadata-token-ttl-seconds" = "21600"}
    
    $roleName = Invoke-RestMethod -Uri "http://169.254.169.254/latest/meta-data/iam/security-credentials/" `
        -Headers @{"X-aws-ec2-metadata-token" = $token}
    
    $creds = Invoke-RestMethod -Uri "http://169.254.169.254/latest/meta-data/iam/security-credentials/$roleName" `
        -Headers @{"X-aws-ec2-metadata-token" = $token}
    
    $AWS_ACCESS_KEY_ID = $creds.AccessKeyId
    $AWS_SECRET_ACCESS_KEY = $creds.SecretAccessKey
    $AWS_SESSION_TOKEN = $creds.Token
} else {
    # Get credentials from AWS CLI SSO cache
    $session = aws configure export-credentials | ConvertFrom-Json
    
    $AWS_ACCESS_KEY_ID = $session.AccessKeyId
    $AWS_SECRET_ACCESS_KEY = $session.SecretAccessKey
    $AWS_SESSION_TOKEN = $session.SessionToken
}

# Get a sign-in token from AWS federation endpoint
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

# Construct the federated AWS Console URL
$consoleUrl = "https://console.aws.amazon.com/"
$destination = [System.Web.HttpUtility]::UrlEncode($consoleUrl)
$federatedUrl = "https://signin.aws.amazon.com/federation?Action=login&Issuer=Example&Destination=$destination&SigninToken=$signinToken"

Write-Host "Federated AWS Console URL:"
Write-Host $federatedUrl

# Open the URL in the default browser
Start-Process $federatedUrl
