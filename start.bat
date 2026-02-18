echo off
set YYYYMMDD=%date:~6,4%-%date:~3,2%-%date:~0,2%
echo %YYYYMMDD% %time% Script started
set PUPPETEER_EXECUTABLE_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe
echo %YYYYMMDD% %time% node media.js
node media.js
echo %YYYYMMDD% %time% node login.js
node login.js
echo %YYYYMMDD% %time% node douyin.js
node douyin.js
echo %YYYYMMDD% %time% node toutiao.js
node toutiao.js
echo %YYYYMMDD% %time% node kuaishou.js
node kuaishou.js
echo %YYYYMMDD% %time% node xiaohongshu.js
node xiaohongshu.js
echo %YYYYMMDD% %time% node weibo.js
node weibo.js
echo %YYYYMMDD% %time% node baijiahao.js
node baijiahao.js
echo %YYYYMMDD% %time% node bilibili.js
node bilibili.js
echo %YYYYMMDD% %time% node qzone.js
node qzone.js
echo %YYYYMMDD% %time% Script completed
