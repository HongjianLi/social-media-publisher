#!/usr/bin/env node
import browse from './browser.js';
browse('https://cp.kuaishou.com/article/publish/video?tabType=2', 31, async (page, media) => { // Max 31 pictures.
	await page.waitForSelector('button._upload-btn_ysbff_57', { timeout: 8000 });
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('button._upload-btn_ysbff_57'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('div._upload_swpvr_1', { timeout: 6000 * (2 + media.fileArr.length) }), // When upload completes, this div 编辑图片 will be shown.
		fileChooser.accept(media.fileArr),
	]);
	await page.type('div._description_2klkp_59', `${media.title}\n🌲\n${media.description}`); // Max 500 characters
	await page.click('input#rc_select_1'); // 添加地点
	await new Promise(resolve => setTimeout(resolve, 6000));
	await page.click('ul.ant-cascader-menu>li:nth-child(1)'); // Select the first city.
	await new Promise(resolve => setTimeout(resolve, 1000));
//	await page.click('input#rc_select_2'); // 详细地址  No addresses will be shown.
//	await new Promise(resolve => setTimeout(resolve, 3000));
//	await page.click('div.rc-virtual-list-holder-inner>div:nth-child(1)');
	await page.click('div._icon-add_3a3lq_27'); // 添加音乐
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('input._search-input_19mmt_16', '红眼睛 陈慧琳');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.waitForSelector('span._button_19mmt_162'); // 等待添加按钮
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('span._button_19mmt_162'); // 添加
	await new Promise(resolve => setTimeout(resolve, 2000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2' }),
		page.click('div._button-primary_3a3lq_60'),
	]);
});
