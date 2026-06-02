<#
.SYNOPSIS
    Simulates Git activity: creates commits on a testing branch, plus feature
    branches each with a pull request.

.DESCRIPTION
    Appends simple log lines to activity.log and commits each change (up to a
    hard cap of 100 commits), pushes the testing branch to the remote, then
    optionally creates several feature branches, opens a pull request for each
    via the GitHub CLI (gh), merges each PR (deleting its branch), and -- with
    -MergeToMain -- promotes the result into main so it shows on the front page.

    Safety:
      * Touches only the testing and feature/* branches by default. main is
        modified ONLY when you pass -MergeToMain.
      * Stages only activity.log, so unrelated working-tree changes are left
        untouched and never swept into a commit.
      * Prompts for confirmation before any push / PR / merge (outward-facing,
        hard to reverse) unless -Yes is given.
      * -DryRun prints every git/gh command without executing anything.

.PARAMETER RepoPath
    Path to the target git repository. Defaults to the current directory.

.PARAMETER CommitCount
    Number of commits to create on the testing branch. Clamped to 1..100.

.PARAMETER TargetBranch
    Branch that receives the activity-log commits. Default: testing.

.PARAMETER BranchCount
    Number of extra feature branches (each gets one commit + a PR). Default: 3.

.PARAMETER PrBaseBranch
    Branch the pull requests target. Default: same as TargetBranch.

.PARAMETER Remote
    Git remote to push to. Default: origin.

.PARAMETER NoPr
    Create/push feature branches but skip pull-request creation.

.PARAMETER NoMerge
    Open the pull requests but do NOT merge them. By default each PR is merged
    immediately after creation. (Auto-merge assumes PrBaseBranch = TargetBranch.)

.PARAMETER MergeMethod
    How to merge each PR: merge | squash | rebase. Default: merge.

.PARAMETER MergeToMain
    After all commits/PRs, also merge TargetBranch into MainBranch and push, so
    the activity lands on main (visible on the repo front page). Off by default.

.PARAMETER MainBranch
    Branch that -MergeToMain promotes into. Default: main.

.PARAMETER DryRun
    Print what would happen without running any git/gh commands.

.PARAMETER Yes
    Skip the confirmation prompt before pushing and opening PRs.

.EXAMPLE
    .\git-activity-sim.ps1 -CommitCount 25 -BranchCount 3

.EXAMPLE
    .\git-activity-sim.ps1 -RepoPath C:\sandbox\demo -CommitCount 100 -DryRun
#>
[CmdletBinding()]
param(
    [string]$RepoPath = (Get-Location).Path,
    [ValidateRange(1, 100)][int]$CommitCount = 20,
    [string]$TargetBranch = 'testing',
    [ValidateRange(0, 50)][int]$BranchCount = 3,
    [string]$PrBaseBranch,
    [string]$Remote = 'origin',
    [switch]$NoPr,
    [switch]$NoMerge,
    [ValidateSet('merge', 'squash', 'rebase')][string]$MergeMethod = 'merge',
    [switch]$MergeToMain,
    [string]$MainBranch = 'main',
    [switch]$DryRun,
    [switch]$Yes
)

$ErrorActionPreference = 'Stop'
if (-not $PrBaseBranch) { $PrBaseBranch = $TargetBranch }

# --- helpers ----------------------------------------------------------------

# Run a mutating command; echo it, throw on non-zero exit.
function Invoke-Cmd {
    param([string]$Exe, [string[]]$CmdArgs)
    $display = "$Exe $($CmdArgs -join ' ')"
    if ($DryRun) {
        Write-Host "[dry-run] $display" -ForegroundColor DarkGray
        return ''
    }
    Write-Host "> $display" -ForegroundColor DarkCyan
    $output = & $Exe @CmdArgs
    if ($LASTEXITCODE -ne 0) { throw "Command failed (exit $LASTEXITCODE): $display" }
    return $output
}

# Run a read-only query; return trimmed output, never throw.
# Resets $LASTEXITCODE so a benign probe (e.g. checking a missing ref) does
# not leak a non-zero exit code into the script's final status.
function Read-Cmd {
    param([string]$Exe, [string[]]$CmdArgs)
    $output = & $Exe @CmdArgs 2>$null
    $ok = ($LASTEXITCODE -eq 0)
    $global:LASTEXITCODE = 0
    if (-not $ok) { return $null }
    return ($output | Out-String).Trim()
}

function Write-Step { param([string]$Msg) Write-Host "==> $Msg" -ForegroundColor Cyan }

# --- preflight --------------------------------------------------------------

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "git not found on PATH."
}
if (-not (Test-Path -LiteralPath $RepoPath)) {
    throw "RepoPath does not exist: $RepoPath"
}

Push-Location -LiteralPath $RepoPath
try {
    $insideRepo = Read-Cmd git @('rev-parse', '--is-inside-work-tree')
    if ($insideRepo -ne 'true') { throw "Not a git repository: $RepoPath" }

    $repoRoot   = Read-Cmd git @('rev-parse', '--show-toplevel')
    $baseBranch = Read-Cmd git @('rev-parse', '--abbrev-ref', 'HEAD')
    if (-not $baseBranch -or $baseBranch -eq 'HEAD') {
        throw "Repo is in a detached HEAD state; checkout a branch first."
    }

    $hasRemote = [bool](Read-Cmd git @('remote', 'get-url', $Remote))

    # Decide whether PRs are possible.
    $doPr = -not $NoPr -and $BranchCount -gt 0
    if ($doPr) {
        if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
            Write-Warning "gh CLI not found - skipping pull requests (branches still pushed)."
            $doPr = $false
        }
        elseif (-not $DryRun) {
            & gh auth status *> $null
            if ($LASTEXITCODE -ne 0) {
                Write-Warning "gh is not authenticated (run 'gh auth login') - skipping pull requests."
                $doPr = $false
            }
        }
    }
    if (-not $hasRemote) {
        Write-Warning "Remote '$Remote' not configured - cannot push or open PRs (commits stay local)."
        $doPr = $false
    }

    # Merge each PR right after creating it (default on). Requires PRs.
    $doMerge = $doPr -and -not $NoMerge

    $logFile = Join-Path $repoRoot 'activity.log'
    $runId   = Get-Date -Format 'yyyyMMdd-HHmmss'

    # --- plan + confirmation ------------------------------------------------

    Write-Host ""
    Write-Step "Plan"
    Write-Host "  Repo            : $repoRoot"
    Write-Host "  Base branch     : $baseBranch (never modified)"
    Write-Host "  Activity branch : $TargetBranch  ($CommitCount commit(s))"
    Write-Host "  Feature branches: $BranchCount"
    Write-Host "  Pull requests   : $(if ($doPr) { "yes -> base '$PrBaseBranch'" } else { 'no' })"
    Write-Host "  Auto-merge PRs  : $(if ($doMerge) { "yes (--$MergeMethod, delete branch)" } else { 'no' })"
    Write-Host "  Merge to main   : $(if ($MergeToMain) { "yes -> '$MainBranch'" } else { 'no' })"
    Write-Host "  Remote          : $(if ($hasRemote) { $Remote } else { '(none)' })"
    Write-Host "  Log file        : $logFile"
    Write-Host ""

    $willPush = $hasRemote -and -not $DryRun
    if ($willPush -and -not $Yes) {
        $ans = Read-Host "This will PUSH branches$(if ($doPr) { ' and OPEN PRs' })$(if ($doMerge) { ' and MERGE them' }) to '$Remote'. Continue? (y/N)"
        if ($ans -notmatch '^(y|yes)$') { Write-Host "Aborted."; return }
    }

    # --- 1. activity-log commits on the testing branch ----------------------

    Write-Step "Preparing branch '$TargetBranch'"
    $branchExists = [bool](Read-Cmd git @('rev-parse', '--verify', '--quiet', "refs/heads/$TargetBranch"))
    if ($branchExists) {
        Invoke-Cmd git @('checkout', $TargetBranch) | Out-Null
    } else {
        Invoke-Cmd git @('checkout', '-b', $TargetBranch) | Out-Null
    }

    Write-Step "Creating $CommitCount commit(s) on '$TargetBranch'"
    for ($i = 1; $i -le $CommitCount; $i++) {
        $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
        $token = '{0:x6}' -f (Get-Random -Maximum 16777215)
        $line  = "$stamp | $TargetBranch | entry $i/$CommitCount | $token"
        if ($DryRun) {
            Write-Host "[dry-run] append + commit: $line" -ForegroundColor DarkGray
        } else {
            Add-Content -LiteralPath $logFile -Value $line -Encoding utf8
        }
        Invoke-Cmd git @('add', '--', 'activity.log') | Out-Null
        # Pathspec on commit limits it to activity.log even if other files are staged.
        Invoke-Cmd git @('commit', '-m', "chore: activity log entry $i", '--', 'activity.log') | Out-Null
    }

    if ($willPush) {
        Write-Step "Pushing '$TargetBranch' to '$Remote'"
        Invoke-Cmd git @('push', '-u', $Remote, $TargetBranch) | Out-Null
    } elseif ($DryRun) {
        Invoke-Cmd git @('push', '-u', $Remote, $TargetBranch) | Out-Null
    }

    # --- 2. feature branches + pull requests --------------------------------

    $prUrls = @()
    $mergedCount = 0
    if ($BranchCount -gt 0) {
        Write-Step "Creating $BranchCount feature branch(es)$(if ($doMerge) { ' (+ auto-merge)' })"
        for ($b = 1; $b -le $BranchCount; $b++) {
            $feature = "feature/activity-$runId-$b"
            # Branch from the current testing tip so each PR shows a clean 1-commit diff.
            Invoke-Cmd git @('checkout', '-b', $feature, $TargetBranch) | Out-Null

            $stamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
            $line  = "$stamp | $feature | feature change"
            if ($DryRun) {
                Write-Host "[dry-run] append + commit: $line" -ForegroundColor DarkGray
            } else {
                Add-Content -LiteralPath $logFile -Value $line -Encoding utf8
            }
            Invoke-Cmd git @('add', '--', 'activity.log') | Out-Null
            Invoke-Cmd git @('commit', '-m', "feat: feature branch $b activity", '--', 'activity.log') | Out-Null

            if ($willPush -or $DryRun) {
                Invoke-Cmd git @('push', '-u', $Remote, $feature) | Out-Null
            }

            if ($doPr) {
                $title = "Activity feature branch $b ($runId)"
                $body  = "Automated activity simulation PR for branch ``$feature``."
                $url = Invoke-Cmd gh @(
                    'pr', 'create',
                    '--base',  $PrBaseBranch,
                    '--head',  $feature,
                    '--title', $title,
                    '--body',  $body
                )
                if ($url) { $prUrls += ($url | Out-String).Trim() }
            }

            # Switch off the feature branch first so it can be deleted on merge.
            Invoke-Cmd git @('checkout', $TargetBranch) | Out-Null

            if ($doMerge) {
                # Merge the PR, then fast-forward local testing to include the
                # merge commit so the next feature branch builds on the merged
                # result -> each PR is a clean 1-commit diff, never conflicts.
                Invoke-Cmd gh @('pr', 'merge', $feature, "--$MergeMethod", '--delete-branch') | Out-Null
                if ($willPush -or $DryRun) {
                    Invoke-Cmd git @('pull', '--ff-only', $Remote, $TargetBranch) | Out-Null
                }
                $mergedCount++
            }
        }
    }

    # --- 3. promote to main (optional) -------------------------------------

    if ($MergeToMain) {
        Write-Step "Merging '$TargetBranch' into '$MainBranch'"
        Invoke-Cmd git @('checkout', $MainBranch) | Out-Null
        # Fast-forwards when TargetBranch is ahead of main; union attr resolves
        # activity.log if the histories have diverged.
        Invoke-Cmd git @('merge', '--no-edit', $TargetBranch) | Out-Null
        if ($willPush -or $DryRun) {
            Invoke-Cmd git @('push', $Remote, $MainBranch) | Out-Null
        }
    }

    # --- done ---------------------------------------------------------------

    Invoke-Cmd git @('checkout', $baseBranch) | Out-Null

    Write-Host ""
    Write-Step "Done"
    Write-Host "  Commits on '$TargetBranch' : $CommitCount"
    Write-Host "  Feature branches created   : $BranchCount"
    if ($doMerge) { Write-Host "  Pull requests merged       : $mergedCount / $BranchCount" }
    if ($MergeToMain) { Write-Host "  Promoted to                : $MainBranch" }
    if ($prUrls.Count -gt 0) {
        Write-Host "  Pull requests:"
        $prUrls | ForEach-Object { Write-Host "    $_" }
    }
    if ($DryRun) { Write-Host "  (dry-run: nothing was actually changed)" -ForegroundColor DarkGray }
}
finally {
    Pop-Location
}
