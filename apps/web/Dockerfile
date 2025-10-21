FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --force

# Install all possible rollup native dependencies for ARM64
RUN npm install @rollup/rollup-linux-arm64-gnu @rollup/rollup-linux-arm64-musl --save-optional

# Copy source code
COPY . .

# Set environment variable to use native rollup
ENV ROLLUP_NATIVE=true

# Run dev server in container for local dev
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]