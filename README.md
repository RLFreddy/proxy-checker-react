## Entorno de desarrollo

### docker --version
    Docker version 20.10.17

### docker-compose --version
    Docker Compose version v2.20.3

## Comandos para ejecutar el contenedor:
    sudo docker-compose build --no-cache
    sudo docker-compose up -d --build proxy-checker-react

## Para ver las imagenes creadas:
    sudo docker-compose ps

## Para ver los logs de la aplicación:
    sudo docker-compose logs -t -f proxy-checker-react

## Ejecutar sin contenedor:
    #Versión de node usado v18.18.0, recomiendo usar nvm y ejecutar el comando "nvm use" y despues ejecutar los siguientes comandos:
    npm i -g pnpm
    pnpm i
    pnpm start
