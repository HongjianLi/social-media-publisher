#!/usr/bin/env node
import browse from './browser.js';
browse('https://mp.toutiao.com/profile_v4/weitoutiao/publish', 18, async (page, media) => { // Max 18 pictures.
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
	await new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length));
	await page.click('button[data-e2e="imageUploadConfirm-btn"]');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.type('div.ProseMirror', `${media.title}\n🌲\n${media.description}`); // Max 2000 characters.
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.byte-select-view');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.type('span.byte-select-view-search>input', `${media.province}${media.city}${media.district}`); // Custom location is supported.
	await new Promise(resolve => setTimeout(resolve, 4000));
	await page.click('ul.byte-select-popup-inner>li:nth-child(1)');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
		page.click('button.publish-content'),
	]);
});
