#!/usr/bin/env node
import browse from './browser.js';
browse('https://creator.xiaohongshu.com/publish/publish', async (page, media) => {
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
	await page.type('div.ql-editor', media.description); // Max 1000 characters.
	await page.type('div.address-box div.d-select-input-filter>input', `${media.province}${media.city}${media.district}`);
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div[data-v-09078844].item');
	await new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length ));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 4000 }),
		page.click('div.submit>button'),
	]);
});
