FROM nginx:alpine

# HTML / CSS / JS
COPY . /usr/share/nginx/html

# 🔥 ОЦЕ КРИТИЧНО
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80