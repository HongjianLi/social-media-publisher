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
const url = 'https://creator.douyin.com/creator-micro/content/publish-media/image-text';
const mediaArr = await fs.readFile('media.json').then(JSON.parse);
for (const media of mediaArr) { // It seems douyin will detect bot behaviors and logout after publishing two medias.
	const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 9000 });
	console.assert(response.ok());
	console.assert(page.url() === url);
	await page.type('input[placeholder="添加作品标题"]', `${media.date}${media.weekday}${media.province}${media.city}${media.district}`); // Max 20 characters
	await page.type('div[data-placeholder="添加作品描述..."]', media.description);
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div.container-IRuUu2'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('div.info-jvSF_5', { timeout: 8000 * media.fileArr.length }), // When upload completes, <div class="info-jvSF_5"> will be shown.
		fileChooser.accept(media.fileArr),
	]);
	await new Promise(resolve => setTimeout(resolve, 5000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }),
		page.click('button.primary-cECiOJ'),
	]);
	await new Promise(resolve => setTimeout(resolve, 5000));
}
await browser.close();
