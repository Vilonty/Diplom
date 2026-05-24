# export-code.ps1
$outputFile = "project-code.txt"
$projectPath = "D:\projects\Diplom\frontend\src"

if (Test-Path $outputFile) { Remove-Item $outputFile }

$extensions = @("*.ts", "*.tsx", "*.js", "*.jsx", "*.css", "*.module.css", "*.html", "*.json", "*.py")

foreach ($ext in $extensions) {
    Get-ChildItem -Path $projectPath -Filter $ext -Recurse | ForEach-Object {
        $relativePath = $_.FullName.Substring($projectPath.Length)
        "`n`n========== $relativePath ==========`n" | Out-File -FilePath $outputFile -Append -Encoding UTF8
        Get-Content $_.FullName | Out-File -FilePath $outputFile -Append -Encoding UTF8
    }
}

Write-Host "Done! Code saved to $outputFile"