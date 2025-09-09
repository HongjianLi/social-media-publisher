#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
const cookies = await fs.readFile('cookies.json').then(JSON.parse);
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
	defaultViewport: { width: 1024, height: 768 },
});
await browser.setCookie(...cookies);
const siteArr = [{
	url: 'https://creator.douyin.com/creator-micro/content/publish-media/image-text',
	selector: 'span.selected-w_E01s',
	cookie: {
		name: 'sessionid',
		domain: '.douyin.com',
	},
}, {
	url: 'https://mp.toutiao.com/profile_v4/weitoutiao/publish',
	cookie: {
		name: 'sessionid',
		domain: '.toutiao.com',
	},
}, {
	url: 'https://cp.kuaishou.com/article/publish/video?tabType=2',
	selector: 'a.login',
	cookie: {
		name: 'kuaishou.web.cp.api_st',
		domain: '.kuaishou.com',
	},
}, {
	url: 'https://creator.xiaohongshu.com/publish/publish',
	cookie: {
		name: 'access-token-creator.xiaohongshu.com',
		domain: '.xiaohongshu.com',
	},
}, {
	url: 'https://weibo.com/',
	cookie: {
		name: 'SUB',
		domain: '.weibo.com',
	},
}, {
	url: 'https://user.qzone.qq.com/439629497/311',
	cookie: {
		name: 'p_skey',
		domain: '.qzone.qq.com',
	},
}];
for (const site of siteArr) {
	const { url, cookie: { name, domain } } = site;
	const page = await browser.newPage();
	const response = await page.goto(url, { waitUntil: 'networkidle2' });
	if (response.ok()) {
		if (page.url() !== url || (site.selector && await page.$(site.selector))) { // Page redirected because of invalid cookies for user login. douyin and kuaishou will not redirect, but login selectors will be found.
			await page.waitForNavigation(); // Scan QR code to login. Default timeout is 30 seconds.
			const cookie = await browser.cookies().then(cookies => cookies.find(cookie => cookie.name === name && cookie.domain === domain)); // After login, find the credential cookie.
			if (cookie) cookies.find(cookie => cookie.name === name && cookie.domain === domain).value = cookie.value; // Save the credential cookie value.
		}
	} else {
		console.error(`HTTP response status code ${response.status()}`);
	}
	await page.close();
}
await browser.close();
await fs.writeFile('cookies.json', JSON.stringify(cookies, null, '	'));
