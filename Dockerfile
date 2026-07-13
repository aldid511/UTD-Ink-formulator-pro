# Build the Vite app, then serve the static bundle with nginx on $PORT=8080 (Cloud Run)
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Electron is only needed for the desktop build; skip its binary download in the cloud image
ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
