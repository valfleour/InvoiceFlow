param(
    [Parameter(Position = 0)]
    [ValidateSet("list", "use", "clear", "login")]
    [string]$Action = "list",

    [Parameter(Position = 1)]
    [string]$Username
)

$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
    throw "Run this script from inside a Git repository."
}

Set-Location $repoRoot

$credentialKey = "credential.https://github.com.username"

function Get-PreferredUsername {
    $value = git config --local --get $credentialKey 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    return $value.Trim()
}

function Get-OriginUrl {
    $value = git remote get-url origin 2>$null
    if ($LASTEXITCODE -ne 0) {
        return $null
    }

    return $value.Trim()
}

function Get-GitHubAccounts {
    $value = git credential-manager github list 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $value) {
        return @()
    }

    return @($value -split "`r?`n" | Where-Object { $_.Trim() })
}

switch ($Action) {
    "list" {
        $originUrl = Get-OriginUrl
        $preferredUsername = Get-PreferredUsername
        $accounts = Get-GitHubAccounts
        $originLabel = if ([string]::IsNullOrWhiteSpace($originUrl)) { "(not set)" } else { $originUrl }
        $preferredLabel = if ([string]::IsNullOrWhiteSpace($preferredUsername)) { "(not set)" } else { $preferredUsername }

        Write-Host "Repository: $repoRoot"
        Write-Host "Origin: $originLabel"
        Write-Host "Preferred GitHub username: $preferredLabel"
        Write-Host "Stored GitHub accounts:"

        if ($accounts.Count -eq 0) {
            Write-Host "  (none)"
        } else {
            $accounts | ForEach-Object { Write-Host "  $_" }
        }
    }

    "use" {
        if ([string]::IsNullOrWhiteSpace($Username)) {
            throw "Provide a username. Example: .\scripts\github-profile.ps1 use valfleour"
        }

        git config --local $credentialKey $Username
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to store the preferred GitHub username."
        }

        Write-Host "This repository now prefers GitHub account: $Username"
        Write-Host "If that account is not signed in yet, run: .\scripts\github-profile.ps1 login $Username"
    }

    "clear" {
        git config --local --unset-all $credentialKey 2>$null
        Write-Host "Cleared the preferred GitHub username for this repository."
    }

    "login" {
        if ([string]::IsNullOrWhiteSpace($Username)) {
            git credential-manager github login --browser
        } else {
            git credential-manager github login --browser --username $Username
        }

        if ($LASTEXITCODE -ne 0) {
            throw "GitHub login did not complete successfully."
        }

        Write-Host "GitHub login finished."
        if (-not [string]::IsNullOrWhiteSpace($Username)) {
            Write-Host "To make this repository prefer that account, run: .\scripts\github-profile.ps1 use $Username"
        }
    }
}
