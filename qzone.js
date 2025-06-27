#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
	headless: false,
	defaultViewport: { width: 1024, height: 768 },
});
await fs.readFile('cookies.json').then(JSON.parse).then(cookies => browser.setCookie(...cookies));
const url = 'https://user.qzone.qq.com/896034685/311';
const mediaArr = await fs.readFile('media.json').then(JSON.parse);
for (const media of mediaArr) {
	const page = await browser.newPage();
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
	const response = await page.goto(url, { waitUntil: 'load', timeout: 9000 });
	console.assert(response.ok());
	console.assert(page.url() === url);
	const frameHandle = await page.waitForSelector('iframe[id="app_canvas_frame"]');
	await new Promise(resolve => setTimeout(resolve, 2000));
	const frame = await frameHandle.contentFrame();
	const divHandle = await frame.waitForSelector('div[id="QM_Mood_Poster_Container"]');
	await divHandle.click();
	await new Promise(resolve => setTimeout(resolve, 1000));
	await divHandle.type(`${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`);
	for (let i = 0; i < media.fileArr.length; ++i) {
		await frame.click('a.pic');
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the button to load.
		const [fileChooser] = await Promise.all([
			page.waitForFileChooser(),
			frame.click('li.qz_poster_btn_local_pic'),
		]);
		console.assert(!fileChooser.isMultiple());
		await Promise.all([
			new Promise(resolve => setTimeout(resolve, 4000)),
			fileChooser.accept(media.fileArr.slice(i, i + 1)),
		]);
	}
	await frame.click('a.btn-post'),
	await new Promise(resolve => setTimeout(resolve, 5000));
	await frameHandle.dispose();
	await page.close();
}
await browser.close();
