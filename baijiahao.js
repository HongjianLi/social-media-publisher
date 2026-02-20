#!/usr/bin/env node
import browse from './browser.js';
browse('https://baijiahao.baidu.com/builder/rc/edit?type=news', 60, async (page, media) => { // Max 60 pictures
	try {
		await page.waitForSelector('button.cheetah-tour-close', { timeout: 3000 }); // Sometimes this tour button does not appear.
		await page.click('button.cheetah-tour-close');
	} catch {}
	await page.type('div._9ddb7e475b559749-editor', media.title); // Max 64 characters.
	await page.click('span.aigc_bjh_status'); // AI创作声明
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
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.click('div.cheetah-spin-container'); // 选择封面
	await page.waitForSelector('div.e8c90bfac9d4eab4-list>div');
	await new Promise(resolve => setTimeout(resolve, 500));
	const nth = Math.ceil(media.fileArr.length / 2);
	console.assert(nth >= 1);
	if (nth > 1) await page.click(`div.e8c90bfac9d4eab4-list>div:nth-child(${nth})`); // 选择中间图片作为封面. nth-child() is 1-based, so use ceil() instead of floor(). 网站默认选中第1张图，此时若点击将会取消选中。
	await new Promise(resolve => setTimeout(resolve, 3000)); // 封面裁剪处理中，请稍候再点击“确认”
	await new Promise(resolve => {
		const interval = setInterval(async () => {
			await page.click('button.css-zneqgo'); // 确认
			await new Promise(resolve => setTimeout(resolve, 1000));
			const zneqgo = await page.$('button.css-zneqgo');
			if (zneqgo) {
				await zneqgo.dispose();
			} else {
				clearInterval(interval);
				resolve();
			}
		}, 3000);
	});
	await new Promise(resolve => setTimeout(resolve, 1000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2' }),
		page.click('button.css-w10alf'), // 发布
	]);
});
