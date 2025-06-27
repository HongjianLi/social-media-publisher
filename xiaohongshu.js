#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
	defaultViewport: { width: 1024, height: 768 },
});
await fs.readFile('cookies.json').then(JSON.parse).then(cookies => browser.setCookie(...cookies));
const page = (await browser.pages())[0];
await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
const url = 'https://creator.xiaohongshu.com/publish/publish';
const mediaArr = await fs.readFile('media.json').then(JSON.parse);
for (const media of mediaArr) {
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 9000 });
	console.assert(page.url() === url);
	await page.click('div.creator-tab:last-of-type');
	await new Promise(resolve => setTimeout(resolve, 1000));
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('input.upload-input'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('input.d-text', { timeout: 8000 }),
		fileChooser.accept(media.fileArr),
	]);
	await page.type('input.d-text', `${media.date}${media.weekday}${media.province}${media.city}${media.district}`); // Max 20 characters
	await page.type('div.ql-editor', media.description);
	await page.type('div.address-box div.d-select-input-filter>input', `${media.province}${media.city}${media.district}`);
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div[data-v-09078844].item');
	await new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length ));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 4000 }),
		page.click('div.submit>button'),
	]);
	await new Promise(resolve => setTimeout(resolve, 2000));
}
await browser.close();
