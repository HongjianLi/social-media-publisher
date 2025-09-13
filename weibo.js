#!/usr/bin/env node
import browse from './browser.js';
browse('https://weibo.com/', 18, async (page, media) => { // Max 18 pictures.
	await page.type('textarea.Form_input_2gtXx', `${media.title}\n🌲\n${media.description}`); // Max 5000 characters.
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div.VPlus_file_n7Xjc'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		new Promise(resolve => {
			const interval = setInterval(async () => {
				const imgCount = await page.$$eval('div.index_box2_3rXVD div.u-col-3>div[draggable="true"] img', nodeList => nodeList.length); // When upload completes, imgCount will be equal to media.fileArr.length
				if (imgCount === media.fileArr.length) {
					clearInterval(interval);
					resolve();
				}
			}, 1000);
		}),
		fileChooser.accept(media.fileArr),
	]);
	await page.click('div.Tool_mar1_3dorR>div:last-of-type'); // 更多
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.Tool_iconitem_2d5Oo>div.woo-pop-wrap>div.woo-pop-main>div.woo-pop-wrap-main>div:nth-child(3)'); // 地点
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('div.Place_ipt_y5__F>input', media.address);
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.vue-recycle-scroller__item-wrapper>div'); // 第一个地点
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('button.Tool_btn_2Eane');
});
