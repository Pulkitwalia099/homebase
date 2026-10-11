FROM node:24-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20
RUN apt-get update && apt-get install -y --no-install-recommends util-linux ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY src ./src
COPY scripts/hosted-start.sh ./scripts/hosted-start.sh
RUN chmod 755 scripts/hosted-start.sh
ENV HOST=0.0.0.0 PORT=10000 DATA_DIR=/var/data/golocal GOLOCAL_HOSTED=true
EXPOSE 10000
CMD ["/bin/sh", "scripts/hosted-start.sh"]
