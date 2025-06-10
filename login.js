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
const page = (await browser.pages())[0];
const siteArr = [{
	url: 'https://creator.douyin.com/creator-micro/content/publish-media/image-text',
	cookie: {
		name: 'sessionid',
		domain: '.douyin.com',
	},
}, {
	url: 'https://creator.xiaohongshu.com/publish/publish',
	cookie: {
		name: 'access-token-creator.xiaohongshu.com',
		domain: '.xiaohongshu.com',
	},
}, {
	url: 'https://user.qzone.qq.com/896034685/311',
	cookie: {
		name: 'p_skey',
		domain: '.qzone.qq.com',
	},
}];
for (const site of siteArr) {
	const { url, cookie: { name, domain } } = site;
	const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 22000 });
	if (response.ok()) {
		if (page.url() !== url) { // Page redirected because of invalid cookies for user login.
			await page.waitForNavigation(); // Scan QR code to login. Default timeout is 30 seconds.
			const cookie = await browser.cookies().then(cookies => cookies.find(cookie => cookie.name === name && cookie.domain === domain)); // After login, find the credential cookie.
			cookies.find(cookie => cookie.name === name && cookie.domain === domain).value = cookie.value; // Save the credential cookie value.
		}
	} else {
		console.error(`HTTP response status code ${response.status()}`);
	}
}
await browser.close();
await fs.writeFile('cookies.json', JSON.stringify(cookies, null, '	'));
