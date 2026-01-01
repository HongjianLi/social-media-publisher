set d=%date%
set date=%d:~6,4%-%d:~3,2%-%d:~0,2%
echo off
echo %date% %time% Script started
set PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
echo %date% %time% node media.js
node media.js
echo %date% %time% node login.js
node login.js
echo %date% %time% node douyin.js
node douyin.js
echo %date% %time% node toutiao.js
node toutiao.js
echo %date% %time% node kuaishou.js
node kuaishou.js
echo %date% %time% node xiaohongshu.js
node xiaohongshu.js
echo %date% %time% node weibo.js
node weibo.js
echo %date% %time% node baijiahao.js
node baijiahao.js
echo %date% %time% node bilibili.js
node bilibili.js
echo %date% %time% node qzone.js
node qzone.js
echo %date% %time% Script completed
