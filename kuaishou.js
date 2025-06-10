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
const url = 'https://cp.kuaishou.com/article/publish/video?tabType=2';
const mediaArr = await fs.readFile('media.json').then(JSON.parse);
for (const media of mediaArr) {
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 9000 });
	console.assert(page.url() === url);
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('button._upload-btn_ysbff_57'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('div._description_2klkp_59', { timeout: 8000 }),
		fileChooser.accept(media.fileArr),
	]);
	await page.type('div._description_2klkp_59', `${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`.slice(0, 490)); // Max 500 characters
	await new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length ));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 4000 }),
		page.click('div._button-primary_3a3lq_60'),
	]);
	await new Promise(resolve => setTimeout(resolve, 2000));
}
await browser.close();
