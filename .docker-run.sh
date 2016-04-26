#!/bin/bash

## This the final launch command run by Docker.

## Note: sysctl requires --privileged
sysctl -w 'fs.inotify.max_user_watches=524288'

sudo -u www-data -H pm2 start --no-daemon /srv/bot/civicrm-botdylan.pm2-docker.json
