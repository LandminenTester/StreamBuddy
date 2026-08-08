import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { createReadStream, statSync } from 'node:fs'
import { extname } from 'node:path'
import type { AddressInfo } from 'node:net'
import { getEffectById } from '../db/repositories/effects.repo'
import { logger } from '../logger'

let serverPort = 0
let activeServer: ReturnType<typeof createServer> | null = null
const sseClients = new Map<number, Set<ServerResponse>>()

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.mkv': 'video/x-matroska',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.flac': 'audio/flac'
}

const OVERLAY_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: transparent; overflow: hidden; width: 100vw; height: 100vh; }
    #overlay-video {
      position: absolute; inset: 0; width: 100%; height: 100%;
      object-fit: contain; opacity: 0; transition: opacity 0.05s;
    }
  </style>
</head>
<body>
  <video id="overlay-video" playsinline></video>
  <audio id="overlay-audio"></audio>
  <script>
    const effectId = new URLSearchParams(location.search).get('effectId')
    const video = document.getElementById('overlay-video')
    const audio = document.getElementById('overlay-audio')
    const es = new EventSource('/overlay/events?effectId=' + effectId)

    es.onmessage = function(e) {
      const data = JSON.parse(e.data)
      if (data.type !== 'trigger') return
      video.src = '/overlay/media/video/' + effectId
      audio.src = '/overlay/media/audio/' + effectId
      video.style.opacity = '1'
      Promise.all([video.play().catch(function(){}), audio.play().catch(function(){})]).catch(function(){})
    }

    video.addEventListener('ended', function() {
      video.style.opacity = '0'
      video.src = ''
      audio.src = ''
    })
  </script>
</body>
</html>`

function serveMedia(res: ServerResponse, filePath: string | null, req: IncomingMessage): void {
  if (!filePath) {
    res.writeHead(204)
    res.end()
    return
  }

  let stat: ReturnType<typeof statSync>
  try {
    stat = statSync(filePath)
  } catch {
    res.writeHead(404)
    res.end('Not Found')
    return
  }

  const mime = MIME_TYPES[extname(filePath).toLowerCase()] ?? 'application/octet-stream'
  const total = stat.size
  const rangeHeader = req.headers.range

  if (rangeHeader) {
    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader)
    const start = match?.[1] ? parseInt(match[1]) : 0
    const end = match?.[2] ? parseInt(match[2]) : total - 1
    const chunkSize = end - start + 1

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${total}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mime
    })
    createReadStream(filePath, { start, end }).pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Length': total,
      'Accept-Ranges': 'bytes',
      'Content-Type': mime
    })
    createReadStream(filePath).pipe(res)
  }
}

function handleRequest(req: IncomingMessage, res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const url = new URL(req.url ?? '/', `http://localhost:${serverPort}`)
  const path = url.pathname

  if (path === '/overlay' && req.method === 'GET') {
    const effectId = url.searchParams.get('effectId')
    if (!effectId) {
      res.writeHead(400)
      res.end('Missing effectId')
      return
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(OVERLAY_HTML)
    return
  }

  if (path === '/overlay/events' && req.method === 'GET') {
    const effectId = parseInt(url.searchParams.get('effectId') ?? '')
    if (!effectId) {
      res.writeHead(400)
      res.end('Missing effectId')
      return
    }
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })
    res.write(': connected\n\n')
    if (!sseClients.has(effectId)) sseClients.set(effectId, new Set())
    sseClients.get(effectId)!.add(res)
    req.on('close', () => {
      sseClients.get(effectId)?.delete(res)
    })
    return
  }

  const videoMatch = /^\/overlay\/media\/video\/(\d+)$/.exec(path)
  if (videoMatch && req.method === 'GET') {
    const id = parseInt(videoMatch[1])
    try {
      const effect = getEffectById(id)
      serveMedia(res, effect.videoPath, req)
    } catch {
      res.writeHead(404)
      res.end('Not Found')
    }
    return
  }

  const audioMatch = /^\/overlay\/media\/audio\/(\d+)$/.exec(path)
  if (audioMatch && req.method === 'GET') {
    const id = parseInt(audioMatch[1])
    try {
      const effect = getEffectById(id)
      serveMedia(res, effect.audioPath, req)
    } catch {
      res.writeHead(404)
      res.end('Not Found')
    }
    return
  }

  res.writeHead(404)
  res.end('Not Found')
}

export function broadcastTrigger(effectId: number): void {
  const clients = sseClients.get(effectId)
  if (!clients?.size) return
  const payload = JSON.stringify({ type: 'trigger', effectId })
  clients.forEach((res) => res.write(`data: ${payload}\n\n`))
}

export function getServerPort(): number {
  return serverPort
}

export async function startEffectsServer(): Promise<void> {
  const httpServer = createServer(handleRequest)
  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      serverPort = (httpServer.address() as AddressInfo).port
      logger.info(`Overlay-Server läuft auf Port ${serverPort}`)
      resolve()
    })
  })
  activeServer = httpServer
}

export function stopEffectsServer(): void {
  sseClients.forEach((set) => set.forEach((res) => res.end()))
  sseClients.clear()
  activeServer?.close()
  activeServer = null
}
