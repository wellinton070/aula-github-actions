// server.js — servidor HTTP simples, sem dependencias externas.
// Serve o index.html e o pessoaFisica.js dentro do container Docker.
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

const server = http.createServer((req, res) => {
  // rota de health check — o ECS usa isso para saber se o container esta de pe
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('ok');
    return;
  }

  const arquivo = req.url === '/' ? 'index.html' : req.url.replace(/^\//, '');
  const caminhoCompleto = path.join(__dirname, arquivo);

  fs.readFile(caminhoCompleto, (erro, conteudo) => {
    if (erro) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Nao encontrado');
      return;
    }
    const extensao = path.extname(caminhoCompleto);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[extensao] || 'application/octet-stream' });
    res.end(conteudo);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
