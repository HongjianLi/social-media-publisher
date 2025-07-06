#!/usr/bin/env node
import browse from './browser.js';
browse('https://weibo.com/', async (page, media) => {
	await page.type('textarea.Form_input_2gtXx', `${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`); // Max 5000 characters.
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
});
