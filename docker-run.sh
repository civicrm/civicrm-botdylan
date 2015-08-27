#!/bin/bash

if [ -n "$1" ]; then
  CMD="$@"
else
  ## Use pm2 so that botdylan will relaunch automatically
  CMD="sudo -u www-data -H pm2 start --no-daemon /srv/bot/civicrm-botdylan.pm2-docker.json"
fi

docker run \
  -v $PWD:/srv/bot \
  -v $PWD/cache/npm:/root/.npm \
  -p 5000:5000 \
  -t -i local/botdylan \
  $CMD
