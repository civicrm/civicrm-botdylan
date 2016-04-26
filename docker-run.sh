#!/bin/bash

if [ -n "$1" ]; then
  CMD="$@"
else
  ## Use pm2 so that botdylan will relaunch automatically
  CMD="bash /srv/bot/.docker-run.sh"
fi

## FIXME: Gaa! Need --privileged so that we can set `sysctl -w fs.inotify.max_user_watches=524288`

docker run \
  --privileged \
  -v $PWD:/srv/bot \
  -v $PWD/cache/npm:/root/.npm \
  -p 5000:5000 \
  -t -i local/botdylan \
  $CMD
