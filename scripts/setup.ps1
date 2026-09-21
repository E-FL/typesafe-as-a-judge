$ErrorActionPreference = "Stop"

$pluginRoot = Split-Path -Parent $PSScriptRoot
$secureToken = Read-Host -Prompt "TypeSafe API token (input hidden)" -AsSecureString
$tokenPointer = [IntPtr]::Zero
$token = $null

try {
    $tokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
    $token = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($tokenPointer)
    if ([string]::IsNullOrWhiteSpace($token)) {
        throw "A TypeSafe API token is required."
    }

    $env:TYPESAFE_API_KEY = $token
    & node (Join-Path $pluginRoot "scripts\validate-token.mjs")
    if ($LASTEXITCODE -ne 0) {
        throw "TypeSafe token validation failed. The token was not saved."
    }

    [Environment]::SetEnvironmentVariable("TYPESAFE_API_KEY", $token, "User")
    Write-Host "TypeSafe token saved for your Windows user account. Restart Codex and Claude Code to use it."
}
finally {
    if ($tokenPointer -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($tokenPointer)
    }
    Remove-Item Env:TYPESAFE_API_KEY -ErrorAction SilentlyContinue
    $token = $null
}
