param(
  [int]$HubPort = 3000,
  [switch]$RequireModules
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent $PSScriptRoot
$parent = Split-Path -Parent $repoRoot
$checks = @()

function Add-Check([string]$Name, [bool]$Ok, [string]$Detail) {
  $script:checks += [pscustomobject]@{ Name = $Name; Ok = $Ok; Detail = $Detail }
}

$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
  $version = (& node --version).Trim()
  Add-Check 'Node.js' ($version -match '^v(2[0-9]|[3-9][0-9])\.') $version
} else {
  Add-Check 'Node.js' $false 'não encontrado'
}

Add-Check 'node_modules' (Test-Path (Join-Path $repoRoot 'node_modules')) 'dependências instaladas'

$orcamentosParent = Get-ChildItem $parent -Directory | Where-Object { $_.Name -like 'Construtec *' } | Select-Object -First 1
$siblings = @(
  @{ Name = 'Orçamentos'; Path = if ($orcamentosParent) { Join-Path $orcamentosParent.FullName 'construtec-orcamentos' } else { '' } },
  @{ Name = 'Centro de Custos'; Path = Join-Path $parent 'centro de custos CONSTRUTEC' },
  @{ Name = 'Chamados'; Path = Join-Path $parent 'chamadopro' }
)
foreach ($sibling in $siblings) {
  $siblingPath = [string]$sibling.Path
  $siblingExists = $siblingPath -and (Test-Path -LiteralPath $siblingPath)
  $siblingDetail = if ($siblingPath) { $siblingPath } else { 'não encontrado' }
  Add-Check $sibling.Name $siblingExists $siblingDetail
}

try {
  $status = Invoke-RestMethod "http://127.0.0.1:$HubPort/api/status" -TimeoutSec 3
  Add-Check 'Hub HTTP' $true "porta $HubPort"
  foreach ($system in $status.systems.PSObject.Properties) {
    $value = $system.Value
    Add-Check $value.title ([bool]$value.online) $value.statusLabel
  }
} catch {
  Add-Check 'Hub HTTP' $false "inicie com npm start (porta $HubPort)"
}

$checks | ForEach-Object {
  $mark = if ($_.Ok) { '[OK]' } else { '[ERRO]' }
  Write-Host "$mark $($_.Name): $($_.Detail)"
}

$requiredNames = @('Node.js', 'node_modules', 'Hub HTTP')
if ($RequireModules) { $requiredNames += @('Orçamentos', 'Centro de Custos', 'Chamados') }
$failed = @($checks | Where-Object { !$_.Ok -and $requiredNames -contains $_.Name })
if ($failed.Count -gt 0) { exit 1 }
