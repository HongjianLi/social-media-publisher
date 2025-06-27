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
const url = 'https://weibo.com/';
const mediaArr = await fs.readFile('media.json').then(JSON.parse);
for (const media of mediaArr) {
	await page.goto(url, { waitUntil: 'networkidle2', timeout: 9000 });
	console.assert(page.url() === url);
	await page.type('textarea.Form_input_2gtXx', `${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`);
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div.VPlus_file_n7Xjc'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length)),
		fileChooser.accept(media.fileArr),
	]);
	await page.click('div.Tool_mar1_3dorR>div:last-of-type'); // 更多
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.Tool_iconitem_2d5Oo>div.woo-pop-wrap>div.woo-pop-main>div.woo-pop-wrap-main>div:nth-child(3)'); // 地点
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('div.Place_ipt_y5__F>input', `${media.province}${media.city}${media.district}`);
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.vue-recycle-scroller__item-wrapper>div'); // 第一个地点
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('button.Tool_btn_2Eane');
	await new Promise(resolve => setTimeout(resolve, 2000));
}
await browser.close();
