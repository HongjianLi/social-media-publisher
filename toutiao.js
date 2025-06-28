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
const url = 'https://mp.toutiao.com/profile_v4/weitoutiao/publish';
const mediaArr = await fs.readFile('media.json').then(JSON.parse);
for (const media of mediaArr) {
	await page.goto(url, { waitUntil: 'networkidle2' });
	console.assert(page.url() === url);
	await page.click('body'); // Just click anywhere to close the side panel.
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.weitoutiao-image-plugin>span>button.syl-toolbar-button');
	await new Promise(resolve => setTimeout(resolve, 1000));
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div.btns-wrapper>button:nth-child(1)'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('button[data-e2e="imageUploadConfirm-btn"]'),
		fileChooser.accept(media.fileArr),
	]);
	await new Promise(resolve => setTimeout(resolve, 8000 * media.fileArr.length));
	await page.click('button[data-e2e="imageUploadConfirm-btn"]');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.type('div.ProseMirror', `${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`);
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.byte-select-view');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.type('span.byte-select-view-search>input', `${media.province}${media.city}${media.district}`);
	await new Promise(resolve => setTimeout(resolve, 5000));
	await page.click('ul.byte-select-popup-inner>li:nth-child(1)');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
		page.click('button.publish-content'),
	]);
}
await browser.close();
