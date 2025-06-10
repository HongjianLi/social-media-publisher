#!/usr/bin/env bash
echo "$(date +"%F %T.%N") Script started"
export PUPPETEER_EXECUTABLE_PATH=/opt/google/chrome/chrome
echo "$(date +"%F %T.%N") node media.js"
node media.js
echo "$(date +"%F %T.%N") node login.js"
node login.js
echo "$(date +"%F %T.%N") node douyin.js"
node douyin.js
echo "$(date +"%F %T.%N") node kuaishou.js"
node kuaishou.js
echo "$(date +"%F %T.%N") node xiaohongshu.js"
node xiaohongshu.js
echo "$(date +"%F %T.%N") node weibo.js"
node weibo.js
echo "$(date +"%F %T.%N") node qzone.js"
node qzone.js
echo "$(date +"%F %T.%N") Script completed"
