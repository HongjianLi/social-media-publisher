#!/usr/bin/env node
import browse from './browser.js';
browse('https://member.bilibili.com/platform/upload/text/edit', 20, async (page, media) => { // Max 20 pictures. Bilibili supports uploading images multiple times, each time 20 images.
	const frameHandle = await page.waitForSelector('iframe[src="/article-text/home?"]');
	await new Promise(resolve => setTimeout(resolve, 500));
	const frame = await frameHandle.contentFrame();
	await frame.type('div.bre-title-input>textarea', media.title); // Max 40 characters.
	await frame.type('div.ql-editor', media.description);
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		frame.click('div[title="图片"]'),
	]);
	console.assert(fileChooser.isMultiple());
	await fileChooser.accept(media.fileArr);
	await new Promise(resolve => {
		const interval = setInterval(async () => {
			const imgCount = await frame.$$eval('p.normal-img>img[data-status="loaded"]', nodeList => nodeList.length); // When upload completes, imgCount will be equal to media.fileArr.length
			if (imgCount === media.fileArr.length) { // Upload completion does not imply upload success. Successful img[src^="https://"], unsuccessful img[src^="data:image/png;base64,"]. Both have [data-status="loaded"] after uploading and [data-status="pending"] during uploading.
				clearInterval(interval);
				resolve();
			}
		}, 1000);
	});
	await frame.click('button.primary'); // 提交文章
	await new Promise(resolve => setTimeout(resolve, 500)); // Sometimes captcha is required.
});
