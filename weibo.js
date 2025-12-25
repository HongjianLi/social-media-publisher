#!/usr/bin/env node
import browse from './browser.js';
browse('https://weibo.com/', 18, async (page, media) => { // Max 18 pictures.
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('span._text_1jg7d_43'),
	]);
	console.assert(fileChooser.isMultiple());
	await fileChooser.accept(media.fileArr);
	await page.type('textarea._input_2ho67_8', `${media.title}\n🌲\n${media.description}`); // Max 5000 characters.
	await page.click('div.woo-box-item-inlineBlock._iconitem_2z30i_33:last-of-type'); // 更多
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.woo-box-item-inlineBlock._iconitem_2z30i_33:last-of-type>div.woo-pop-wrap>div.woo-pop-main>div.woo-pop-wrap-main>div:nth-child(3)'); // 地点
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('div._ipt_9ia4p_15>div.woo-input-wrap>input', media.address);
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.vue-recycle-scroller__item-wrapper>div'); // 第一个地点
	await new Promise(resolve => {
		const interval = setInterval(async () => {
			const imgCount = await page.$$eval('div._box2_1bfy5_10 div.u-col-3 img[loading="false"]', nodeList => nodeList.length); // When upload completes, imgCount will be equal to media.fileArr.length
			if (imgCount === media.fileArr.length) {
				clearInterval(interval);
				resolve();
			}
		}, 1000);
	});
	await page.click('button._btn_2z30i_68');
});
