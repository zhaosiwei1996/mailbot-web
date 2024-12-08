FROM nginx:latest
WORKDIR /usr/share/nginx/html
ADD dist/ .
RUN ls -la .
ENTRYPOINT ["nginx", "-g", "daemon off;"]
EXPOSE 80
