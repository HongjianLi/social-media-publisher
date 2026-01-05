#!/usr/bin/env node
import browse from './browser.js';
browse('https://member.bilibili.com/platform/upload/text/edit', 20, async (page, media) => { // Max 20 pictures. Bilibili supports uploading images multiple times, each time 20 images.
	const frameHandle = await page.waitForSelector('iframe[src="/article-text/home?"]');
	await new Promise(resolve => setTimeout(resolve, 500));
	const frame = await frameHandle.contentFrame();
	await frame.type('div.bre-title-input>textarea', media.title); // Max 40 characters.
	await frame.type('div.ql-editor', media.description);
	const [fileChooser] = await Promise.all([
		page.waitForFileChooser(),
		frame.click('div[title="图片"]'),
	]);
	console.assert(fileChooser.isMultiple());
	await fileChooser.accept(media.fileArr);
	await new Promise(resolve => {
		const interval = setInterval(async () => {
			const imgCount = await frame.$$eval('p.normal-img>img[data-status="loaded"]', nodeList => nodeList.length); // When upload completes, imgCount will be equal to media.fileArr.length
			if (imgCount === media.fileArr.length) { // Upload completion does not imply upload success. Successful img[src^="https://"], unsuccessful img[src^="data:image/png;base64,"]. Both have [data-status="loaded"] after uploading and [data-status="pending"] during uploading.
				clearInterval(interval);
				resolve();
			}
		}, 1000);
	});
	await frame.click('button.primary'); // 提交文章
	// GeeTest captcha v3 is required. https://2captcha.com/demo/geetest  https://2captcha.com/api-docs/geetest
	await frame.waitForSelector('script[src^="https://api.geetest.com/get.php"]');
	const geetestParams = await frame.$eval('script[src^="https://api.geetest.com/get.php"]', el => el.src.split('?')[1]).then(search => new URLSearchParams(search));
	const inRes = await fetch(`https://2captcha.com/in.php?key=${process.env.TWOCAPTCHA_API_KEY}&method=geetest&gt=${geetestParams.get('gt')}&challenge=${geetestParams.get('challenge')}&api_server=api.geetest.com&pageurl=https://member.bilibili.com/platform/upload/text/edit&json=1`);
	const inRet = await inRes.json();
	if (!inRet.status) { // status === 0 indicates failure, e.g. when inRet.request === 'ERROR_ZERO_BALANCE' or "ERROR_NO_SLOT_AVAILABLE" or "ERROR_IP_NOT_ALLOWED".
		throw new Error(`${inRet.request}: ${inRet.error_text}`);
	}
	await new Promise(resolve => setTimeout(resolve, 25000)); // Wait for 25 seconds for the captcha to be solved.
	const resRet = await new Promise((resolve, reject) => {
		const polling = setInterval(async () => {
			const resRes = await fetch(`https://2captcha.com/res.php?key=${process.env.TWOCAPTCHA_API_KEY}&action=get&id=${inRet.request}&json=1`);
			const resRet = await resRes.json();
			if (resRet.request === 'CAPCHA_NOT_READY') return;
			clearInterval(polling);
			resolve(resRet);
		}, 5000); // If captcha is not solved yet server will return CAPCHA_NOT_READY result. Repeat your request in 5 seconds.
	});
	if (!resRet.status) { // status === 0 indicates failure, e.g. when resRet.request === 'ERROR_CAPTCHA_UNSOLVABLE'.
		throw new Error(`${resRet.request}: ${resRet.error_text}`); // e.g. ERROR_CAPTCHA_UNSOLVABLE: Workers could not solve the Captcha
	}
//	Inject these answers [ 'geetest_challenge', 'geetest_validate', 'geetest_seccode' ]
//	Looks like the answer is returned to the server by creating a new script tag <script src="https://api.geetest.com/ajax.php?gt=&challenge=&w=">
	await frame.$eval('#geetest_validate', (el, answer) => {
		el.value = answer; // The answer is not guaranteed to be correct.
	}, resRet.request);
	await Promise.all([
		page.waitForNavigation({ timeout: 9000 }),
		frame.click('a.geetest_commit'),
	]);
});
