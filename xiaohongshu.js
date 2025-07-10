#!/usr/bin/env node
import browse from './browser.js';
browse('https://creator.xiaohongshu.com/publish/publish', 18, async (page, media) => { // Max 18 pictures.
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
	await page.type('div.address-box div.d-select-input-filter>input', `${media.province}${media.city}${media.district}`); // Custom location is supported.
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div[data-v-09078844].item');
	await page.click('span[data-v-190a8d2a].btn-text.red'); // 去声明
	await page.click('div[data-v-190a8d2a].d-checkbox'); // 我已阅读并同意 《原创声明须知》 ，如滥用声明，平台将驳回并予以相关处置
	await page.click('button[data-v-365a1a06][data-v-190a8d2a]'); // 声明原创
	await page.click('div[data-v-190a8d2a].d-select-wrapper'); // 添加内容类型声明
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.d-popover.d-popover-default.d-dropdown.--size-min-width-large>div.d-dropdown-wrapper>div.d-dropdown-content>div.d-options-wrapper>div.d-grid.d-options>div.d-grid-item:nth-child(7)'); // 内容来源声明
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.d-popover.d-popover-default.d-dropdown.--size-min-width-large:has(+ div.el-overlay)>div.d-dropdown-wrapper>div.d-dropdown-content>div.d-options-wrapper>div.d-grid.d-options>div.d-grid-item:nth-child(6)'); // 自主拍摄
	await new Promise(resolve => setTimeout(resolve, 2000 ));
	await page.type('input[placeholder="下拉选择地点"]', `${media.province}${media.city}${media.district}`)
	await new Promise(resolve => setTimeout(resolve, 4000 ));
	await page.click('div[id^="el-popper-container-"] ul>li'); // 选择第一个地点
	await new Promise(resolve => setTimeout(resolve, 1000 ));
	await page.type('input[placeholder="下拉选择日期"]', `${media.date.substring(0, 4)}-${media.date.substring(4, 6)}-${media.date.substring(6, 8)}`)
	await new Promise(resolve => setTimeout(resolve, 1000 ));
	await page.click('button[data-v-2415ab70].el-button--primary'); // 确认
	await new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length ));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2' }),
		page.click('div.submit>button'),
	]);
});
