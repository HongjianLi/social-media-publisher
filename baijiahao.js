#!/usr/bin/env node
import browse from './browser.js';
browse('https://baijiahao.baidu.com/builder/rc/edit?type=news', 60, async (page, media) => { // Max 60 pictures
	await page.waitForSelector('button.cheetah-tour-close');
	await page.click('button.cheetah-tour-close');
	await page.type('div._9ddb7e475b559749-editor', media.title); // Max 64 characters.
	const frameHandle = await page.waitForSelector('iframe#ueditor_0');
	await new Promise(resolve => setTimeout(resolve, 500));
	const frame = await frameHandle.contentFrame();
	await frame.type('body', media.description);
	await page.click('div.edui-for-insertimage');
	await new Promise(resolve => setTimeout(resolve, 500));
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('span.cheetah-upload'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('button.css-1ho6t72:not([disabled])', { timeout: 10000 * (2 + media.fileArr.length)}), // When upload starts, the button will be shown, with the disabled attribute. When upload completes, the disabled attribute will be removed.
		fileChooser.accept(media.fileArr),
	]);
	await page.click('button.css-1ho6t72:not([disabled])');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.cheetah-spin-container'); // 选择封面
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click(`div.e8c90bfac9d4eab4-list>div:nth-child(${Math.ceil(media.fileArr.length / 2)})`); // 选择中间图片作为封面. nth-child() is 1-based, so use ceil() instead of floor().
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('button.css-zneqgo'); // 确认
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('button.css-w10alf'); // 发布
	await new Promise(resolve => setTimeout(resolve, 500)); // Sometimes captcha is required.
});
