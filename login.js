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
	domain: '.kuaishou.com',
}, {
	url: 'https://creator.xiaohongshu.com/publish/publish?target=image',
	domain: '.xiaohongshu.com',
}, {
	url: 'https://weibo.com/',
	domain: '.weibo.com',
}, {
	url: 'https://member.bilibili.com/platform/upload/text/edit',
	domain: '.bilibili.com',
}, {
	url: 'https://user.qzone.qq.com/439629497/311',
	domain: '.qzone.qq.com',
}];
for (const site of siteArr) {
	const page = await browser.newPage();
	const response = await page.goto(site.url, { waitUntil: 'networkidle2' });
	if (response.ok()) {
		if (page.url() !== site.url || (site.selector && await page.$(site.selector))) { // Page redirected because of invalid cookies for user login. douyin and kuaishou will not redirect, but login selectors will be found.
			await page.waitForNavigation({ timeout: 60000 }); // Scan QR code to login. Default timeout is 30 seconds.
			const browserCookies = await browser.cookies(); // Get the updated cookies from browser.
			cookies.forEach(cookie => {
				if (cookie.domain !== site.domain) return; // site.domain can be an array, e.g. domains: ['.qq.com', '.qzone.qq.com']. In this case, use !site.domains.includes(cookie.domain)
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
