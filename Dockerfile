# Dockerfile — imagem enxuta para uma aplicacao Node sem dependencias externas
FROM node:20-alpine

WORKDIR /app

# copia so o que roda em producao (o .dockerignore filtra o resto)
COPY . .

EXPOSE 3000

# healthcheck local — o ECS tambem faz o proprio healthcheck via target group
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
