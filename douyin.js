#!/usr/bin/env node
import browse from './browser.js';
browse('https://creator.douyin.com/creator-micro/content/publish-media/image-text', async (page, media) => {
	await page.type('input[placeholder="添加作品标题"]', `${media.date}${media.weekday}${media.province}${media.city}${media.district}`); // Max 20 characters
	await page.type('div[data-placeholder="添加作品描述..."]', media.description); // Max 1000 characters.
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div.container-IRuUu2'),
	]);
	console.assert(fileChooser.isMultiple());
	await Promise.all([
		page.waitForSelector('div.info-jvSF_5', { timeout: 8000 * media.fileArr.length }), // When upload completes, <div class="info-jvSF_5"> will be shown.
		fileChooser.accept(media.fileArr),
	]);
	await page.click('div.select-Ht3mEC');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.type('div.select-Ht3mEC', `${media.province}${media.city}${media.district}`);
	await new Promise(resolve => setTimeout(resolve, 7000));
	const cityIndex = (await page.$eval('div#scrollContainer', el => el.innerText)).split('\n').indexOf(media.city); // Custom location is not supported.
	await page.click(`div#scrollContainer>div:nth-child(${cityIndex >= 0 ? 1 + cityIndex : 1})`); // nth-child is 1-based. Default to the first city if not found.
	await new Promise(resolve => setTimeout(resolve, 3000));
	await page.click('div.option-v2-eZrjiM');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('span.action-Q1y01k');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.type('input[placeholder="搜索音乐"]', '先敬罗衣后敬人 许冠杰');
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.waitForSelector('div.card-wrapper-JTleG1');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.card-wrapper-JTleG1');
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('button.apply-btn-LUPP0D'); // 使用
	await new Promise(resolve => setTimeout(resolve, 2000));
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }),
		page.click('button.primary-cECiOJ'),
	]);
});
