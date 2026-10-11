$lines = Get-Content -Path 'CHANGELOG.md' -Encoding UTF8
$header = @(
    '# [2026-07-27] 调整圣光大地技能CD',
    '',
    '## 修改',
    '',
    '### 1. 圣光大地CD调整',
    '- CD 由 0.5 秒调整为 2 秒',
    '- 涉及文件：`src/data/skills.js`',
    ''
)
$rest = $lines[7..($lines.Count - 1)]
$all = $header + $rest
[System.IO.File]::WriteAllLines('CHANGELOG.md', $all, (New-Object System.Text.UTF8Encoding $false))
