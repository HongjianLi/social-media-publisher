#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
const cookies = await fs.readFile('cookies.json').then(JSON.parse);
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
	defaultViewport: { width: 1440, height: 1400 },
	args: ['--window-size=1440,1400'],
});
await browser.setCookie(...cookies);
const siteArr = [{
	url: 'https://creator.douyin.com/creator-micro/content/publish-media/image-text',
	selector: 'span.selected-w_E01s',
	domain: '.douyin.com',
}, {
	url: 'https://mp.toutiao.com/profile_v4/weitoutiao/publish',
	domain: '.toutiao.com',
}, {
	url: 'https://cp.kuaishou.com/article/publish/video?tabType=2',
	selector: 'a.login',
	login: 'https://passport.kuaishou.com/pc/account/login/',
	domain: '.kuaishou.com',
}, {
	url: 'https://creator.xiaohongshu.com/publish/publish?target=image',
	domain: '.xiaohongshu.com',
}, {
	url: 'https://weibo.com/',
	domain: '.weibo.com',
}, {
	url: 'https://baijiahao.baidu.com/builder/rc/edit?type=news',
	domain: '.baidu.com',
}, {
	url: 'https://member.bilibili.com/platform/upload/text/new-edit',
	domain: '.bilibili.com',
}, {
	url: 'https://user.qzone.qq.com/439629497/311',
	domain: '.qq.com',
}];
for (const site of siteArr) {
	const page = await browser.newPage();
	const response = await page.goto(site.url, { waitUntil: 'networkidle2' });
	if (response.ok()) {
		if (page.url() !== site.url || (site.selector && await page.$(site.selector))) { // Page redirected because of invalid cookies for user login. douyin and kuaishou will not redirect, but login selectors will be found.
			if (site.login) await page.goto(site.login); // Browse the login page. Only applicable to kuaishou.
			await page.waitForNavigation({ timeout: 60000 }); // Scan QR code to login. Default timeout is 30 seconds.
			const browserCookies = await browser.cookies(); // Get the updated cookies from browser.
			cookies.forEach(cookie => {
				if (!cookie.domain.endsWith(site.domain)) return;
				cookie.value = browserCookies.find(c => c.name === cookie.name && c.domain === cookie.domain).value; // Save the updated cookie value.
			});
		}
	} else {
		console.error(`HTTP response status code ${response.status()}`);
	}
	await page.close();
}
await browser.close();
await fs.writeFile('cookies.json', JSON.stringify(cookies, null, '	'));
