param(
  [int]$Port = 8000
)

$root = (Resolve-Path $PSScriptRoot).Path
$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)
$listener.Start()
Write-Host "Serving $root at http://localhost:$Port/"

$contentTypes = @{
  '.html' = 'text/html; charset=utf-8'
  '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'
}

function Send-Response($Stream, [int]$StatusCode, [string]$StatusText, [string]$ContentType, [byte[]]$Body) {
  $header = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($header)
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  $Stream.Write($Body, 0, $Body.Length)
}

try {
  while ($true) {
    $client = $null
    try {
      $client = $listener.AcceptTcpClient()
      $client.ReceiveTimeout = 3000
      $stream = $client.GetStream()
      $stream.ReadTimeout = 3000
      $requestBytes = [Collections.Generic.List[byte]]::new()

      do {
        $nextByte = $stream.ReadByte()
        if ($nextByte -lt 0) { break }
        $requestBytes.Add([byte]$nextByte)
      } while ($requestBytes.Count -lt 8192 -and -not ([Text.Encoding]::ASCII.GetString($requestBytes.ToArray()).Contains("`r`n`r`n")))

      $requestLine = [Text.Encoding]::ASCII.GetString($requestBytes.ToArray()).Split("`r`n")[0]
      $requestParts = $requestLine.Split(' ')
      if ($requestParts.Length -lt 2) { throw 'Invalid HTTP request.' }

      $relativePath = [Uri]::UnescapeDataString($requestParts[1].Split('?')[0].TrimStart('/'))
      if ([string]::IsNullOrEmpty($relativePath)) { $relativePath = 'index.html' }

      if ($requestParts[1].Split('?')[0] -eq '/__version') {
        $latestFile = Get-ChildItem -LiteralPath $root -File -Recurse |
          Sort-Object LastWriteTimeUtc -Descending |
          Select-Object -First 1
        $version = $latestFile.LastWriteTimeUtc.Ticks.ToString()
        Send-Response $stream 200 'OK' 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes($version))
        continue
      }

      $filePath = [IO.Path]::GetFullPath((Join-Path $root $relativePath))

      if (-not $filePath.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
        Send-Response $stream 404 'Not Found' 'text/plain; charset=utf-8' ([Text.Encoding]::UTF8.GetBytes('Not found'))
        continue
      }

      $extension = [IO.Path]::GetExtension($filePath)
      $contentType = $contentTypes[$extension]
      if (-not $contentType) { $contentType = 'application/octet-stream' }
      Send-Response $stream 200 'OK' $contentType ([IO.File]::ReadAllBytes($filePath))
    } catch {
      # Ignore malformed or abandoned browser connections and keep serving others.
    } finally {
      if ($client) { $client.Close() }
    }
  }
} finally {
  $listener.Stop()
}
