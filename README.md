## Botdylan scripts for civicrm.org

Note: The official botdylan distribution is https://github.com/botdylan/botdylan , but at time of
writing we use [smoll's PR for hook security](https://github.com/botdylan/botdylan/pull/11).

```bash
## Download
git clone https://github.com/civicrm/civicrm-botdylan
cd civicrm-botdylan
npm install

## Configure
cp config.json.ex config.json
vi config.json

## Launch (direct)
node ./node_modules/botdylan/bin/botdylan.js --dir=$PWD

## Launch (process manager)
sudo npm install pm2 -g
cp civicrm-botdylan.pm2.json.ex civicrm-botdylan.pm2.json
vi civicrm-botdylan.pm2.json.ex
pm2 start civicrm-botdylan.pm2.json
# note: only run one instance at a time. git-pool is not currently cluster aware.
```
