#!/usr/bin/env node
import browse from './browser.js';
browse('https://cp.kuaishou.com/article/publish/video?tabType=2', async (page, media) => {
	await page.waitForSelector('button._upload-btn_ysbff_57', { timeout: 8000 });
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('button._upload-btn_ysbff_57'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('div._description_2klkp_59', { timeout: 8000 }),
		fileChooser.accept(media.fileArr),
	]);
	await page.type('div._description_2klkp_59', `${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`.slice(0, 490)); // Max 500 characters
	await page.click('input#rc_select_1'); // 添加地点。快手不支持自定义地址，只支持当前位置。Custom location is not supported.
	await new Promise(resolve => setTimeout(resolve, 4000 * media.fileArr.length ));
	await page.click('input#rc_select_1');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.click('ul.ant-cascader-menu>li:nth-child(1)');
	await new Promise(resolve => setTimeout(resolve, 1000));
//	await page.click('input#rc_select_2'); // 详细地址
//	await new Promise(resolve => setTimeout(resolve, 3000));
//	await page.click('div.rc-virtual-list-holder-inner>div:nth-child(1)');
	await page.click('div._icon-add_3a3lq_27'); // 添加音乐
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('input._search-input_19mmt_16', '先敬罗衣后敬人 许冠杰');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.waitForSelector('span._button_19mmt_162'); // 添加
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('span._button_19mmt_162');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 4000 }),
		page.click('div._button-primary_3a3lq_60'),
	]);
});
