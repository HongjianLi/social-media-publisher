#!/usr/bin/env node
import browse from './browser.js';
browse('https://creator.xiaohongshu.com/publish/publish?target=image', 18, async (page, media) => { // Max 18 pictures.
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('input.upload-input'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('input.d-text'),
		fileChooser.accept(media.fileArr),
	]);
	await page.type('input.d-text', media.title); // Max 20 characters
	await page.type('div.tiptap', media.description); // Max 1000 characters.
	await page.type('div.address-box div.d-select-input-filter>input', media.address); // 添加地点
	const addressAttr = await page.$eval('div.media-extension>div.formbox>div.plugin:nth-child(2)>div>form', el => el.attributes[0].name); // e.g. data-v-1452d0b4
	await page.waitForSelector(`div[${addressAttr}].item`);
	await page.click(`div[${addressAttr}].item`); // 选择第一个地点
	await page.click('span.btn-text.red::-p-text(去声明)'); // 去声明
	await page.click('div.d-checkbox.bg-red'); // 我已阅读并同意 《原创声明须知》 ，如滥用声明，平台将驳回并予以相关处置
	await page.click('button::-p-text(声明原创)'); // 声明原创
	await page.click('div.d-select-wrapper::-p-text(添加内容类型声明)'); // 添加内容类型声明
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.d-grid-item::-p-text(内容来源声明)');
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.d-grid-item::-p-text(自主拍摄)');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('input[placeholder="下拉选择地点"]', media.address); // 拍摄地点
	await new Promise(resolve => setTimeout(resolve, 4000 ));
	try {
		await page.click('div[id^="el-popper-container-"] ul>li'); // 选择第一个地点
		await new Promise(resolve => setTimeout(resolve, 1000));
	} catch {}
	await page.type('input[placeholder="下拉选择日期"]', `${media.date.substring(0, 4)}-${media.date.substring(4, 6)}-${media.date.substring(6, 8)}`); // 拍摄日期
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('button::-p-text(确认)'); // 确认
	await new Promise(resolve => {
		const interval = setInterval(async () => {
			const uploadingCount = await page.$$eval('div.img-upload-area div.mask.uploading', nodeList => nodeList.length); // When upload completes, uploadingCount will be equal to 0
			if (uploadingCount === 0) {
				clearInterval(interval);
				resolve();
			}
		}, 1000);
	});
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2' }),
		page.click('div.submit>button'),
	]);
});
