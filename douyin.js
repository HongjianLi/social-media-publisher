#!/usr/bin/env node
import browse from './browser.js';
browse('https://creator.douyin.com/creator-micro/content/publish-media/image-text', 35, async (page, media) => { // Max 35 pictures.
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		page.click('div.container-IRuUu2'),
	]);
	console.assert(fileChooser.isMultiple());
	await fileChooser.accept(media.fileArr);
	await page.type('input[placeholder="添加作品标题"]', media.title); // Max 20 characters
	await page.type('div[data-placeholder="添加作品描述..."]', media.description); // Max 1000 characters.
	await page.click('div.container-JweCrL>div>label:last-of-type>input'); // 保存权限 不允许
	if (media.date.substring(0, 4) >= '2020') {
		await page.click('p.addUserDeclaration-dq21tU'); // 添加声明
		await new Promise(resolve => setTimeout(resolve, 2000));
		await page.click('div.radioEl-QlABcQ'); // 内容自行拍摄
		await new Promise(resolve => setTimeout(resolve, 1000));
		await page.click('section.radioExtra-BUxspN>div.semi-cascader>div>span'); // 选择拍摄地点. Neither page.type() nor page.$eval() worked.
		await new Promise(resolve => setTimeout(resolve, 1000));
		await page.click('div.semi-cascader-option-lists>ul>li'); // 第一个ul是国家列表。点击第一个li，中国
		await new Promise(resolve => setTimeout(resolve, 1000));
		const provinceArr = await page.$eval('div.semi-cascader-option-lists>ul:nth-child(2)', el => el.innerText); // 第二个ul是省份或直辖市列表
		const provincenth = provinceArr.split('\n').indexOf(media.province.length ? media.province : media.city);
		await page.click(`div.semi-cascader-option-lists>ul:nth-child(2)>li:nth-child(${1 + provincenth})`); // nth-child is 1-based.
		if (media.province.length) { // 若省份不为空，表示仍需继续选择城市
			await new Promise(resolve => setTimeout(resolve, 1000));
			const cityArr = await page.$eval('div.semi-cascader-option-lists>ul:nth-child(3)', el => el.innerText);// 第三个ul是城市
			const citynth = cityArr.split('\n').indexOf(media.city.length ? media.city : media.district);
			await page.click(`div.semi-cascader-option-lists>ul:nth-child(3)>li:nth-child(${1 + citynth})`); // nth-child is 1-based.
		}
		await new Promise(resolve => setTimeout(resolve, 1000));
		await page.type('section.radioExtra-BUxspN>div.semi-datepicker>div>div>input', `${media.date.substring(0, 4)}-${media.date.substring(4, 6)}-${media.date.substring(6, 8)}`); // 设置拍摄日期 This date has to be newer than 2020-01-01, otherwise it will not be saved.
		await new Promise(resolve => setTimeout(resolve, 1000));
		await page.click('button.semi-button-primary.btn-I78nOi'); // 确定
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
	await page.click('div.select-Ht3mEC'); // 输入相关位置
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.type('div.select-Ht3mEC', media.address); // 输入相关位置
	await new Promise(resolve => setTimeout(resolve, 5000)); // 等待加载城市
	const cityIndex = (await page.$eval('div#scrollContainer', el => el.innerText)).split('\n').indexOf(media.city);
	await page.click(`div#scrollContainer>div:nth-child(${cityIndex >= 0 ? 1 + cityIndex : 1})`); // 选择城市。 nth-child is 1-based. Default to the first city if not found.
	await new Promise(resolve => setTimeout(resolve, 3000)); // 等待加载位置
	await page.click('div.option-v2-eZrjiM'); // 选择该城市下的第一个位置
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('span.action-Q1y01k'); // 选择音乐
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.click('div[data-scrollkey="fav-1-bar"]'); // 收藏
//	await page.type('input[placeholder="搜索音乐"]', '先敬罗衣后敬人 许冠杰'); // 搜索音乐
	await new Promise(resolve => setTimeout(resolve, 2000));
	await page.waitForSelector('div.card-wrapper-JTleG1'); // 等待加载音乐
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('div.card-wrapper-JTleG1'); // 选择第一首音乐
	await new Promise(resolve => setTimeout(resolve, 1000));
	await page.click('button.apply-btn-LUPP0D'); // 使用
	await page.waitForSelector('div.info-jvSF_5', { timeout: 8000 * (2 + media.fileArr.length)}); // When upload completes, <div class="info-jvSF_5"> will be shown.
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle2' }),
		page.click('button.primary-cECiOJ'),
	]);
});
