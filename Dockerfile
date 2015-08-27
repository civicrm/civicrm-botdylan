FROM ubuntu:14.04
MAINTAINER CiviCRM <info@civicrm.org>
RUN apt-get update && apt-get install -y npm nodejs nodejs-legacy git 
RUN npm install -g pm2
RUN mkdir -p /var/www ; chown www-data /var/www
