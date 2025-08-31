/*
  Ini adalah server signaling sederhana untuk Vercel.
  File ini harus ditempatkan di dalam direktori `api` di proyek Vercel Anda.
  Ini akan menangani permintaan WebSocket untuk menghubungkan klien WebRTC.

  CATATAN: Anda perlu menginstal library 'ws' agar kode ini dapat berjalan.
  Pastikan ada file `package.json` yang berisi {"dependencies": {"ws": "^8.16.0"}} di root proyek Anda.
*/

const { WebSocketServer } = require('ws');
const url = require('url');

// Menggunakan Map untuk menyimpan klien yang terhubung berdasarkan ID
const clients = new Map();
let wss;

module.exports = (req, res) => {
  // Hanya buat WebSocketServer sekali
  if (!wss) {
    wss = new WebSocketServer({ noServer: true });

    // Tangani koneksi WebSocket baru
    wss.on('connection', (ws, request) => {
      const { query } = url.parse(request.url, true);
      const clientId = query.id;
      clients.set(clientId, ws);
      console.log(`Klien baru terhubung: ${clientId}`);

      // Tangani pesan dari klien
      ws.on('message', message => {
        const data = JSON.parse(message);
        const targetClient = clients.get(data.to);

        // Teruskan pesan ke klien yang dituju jika koneksi terbuka
        if (targetClient && targetClient.readyState === 1) { // 1 = OPEN
          console.log(`Meneruskan pesan dari ${data.from} ke ${data.to}`);
          targetClient.send(JSON.stringify(data));
        }
      });

      // Tangani ketika koneksi ditutup
      ws.on('close', () => {
        console.log(`Klien terputus: ${clientId}`);
        clients.delete(clientId);
      });
    });
  }

  // Tangani permintaan HTTP 'upgrade' ke WebSocket
  if (req.headers.upgrade === 'websocket') {
    wss.handleUpgrade(req, req.socket, Buffer.alloc(0), ws => {
      wss.emit('connection', ws, req);
    });
  } else {
    // Jika bukan permintaan WebSocket, kirim respons HTTP biasa
    res.status(200).send('WebSocket server berjalan. Gunakan protokol WebSocket untuk terhubung.');
  }
};