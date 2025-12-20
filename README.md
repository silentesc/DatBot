# How to install

### Make docker image
```sh
git clone https://github.com/silentesc/DatBot.git
```
```sh
cd DatBot
```
```sh
docker build -t datbot-bot .
```

### Docker Compose
```yaml
services:
  datbot-bot:
    image: datbot-bot
    container_name: datbot-bot
    ports:
      - "3001:3001"
    environment:
      - PUID=1000
      - PGID=1000
      - TZ=Etc/UTC
      - TOKEN=""
      - CLIENT_ID=""
      - GUILD_ID=""
      - API_KEY=""
      - BACKEND_URL=""
    restart: unless-stopped
```
