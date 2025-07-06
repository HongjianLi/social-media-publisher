#!/usr/bin/env node
import browse from './browser.js';
browse('https://user.qzone.qq.com/896034685/311', async (page, media) => {
	const frameHandle = await page.waitForSelector('iframe[id="app_canvas_frame"]');
	await new Promise(resolve => setTimeout(resolve, 2000));
	const frame = await frameHandle.contentFrame();
	const divHandle = await frame.waitForSelector('div[id="QM_Mood_Poster_Container"]');
	await divHandle.click();
	await new Promise(resolve => setTimeout(resolve, 1000));
	await divHandle.type(`${media.date}${media.weekday}${media.province}${media.city}${media.district}\n\n${media.description}`); // Max 11000 characters.
	for (let i = 0; i < media.fileArr.length; ++i) {
		await frame.click('a.pic');
		await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for the button to load.
		const [fileChooser] = await Promise.all([
			page.waitForFileChooser(),
			frame.click('li.qz_poster_btn_local_pic'),
		]);
		console.assert(!fileChooser.isMultiple());
		await Promise.all([
			new Promise(resolve => setTimeout(resolve, 4000)),
			fileChooser.accept(media.fileArr.slice(i, i + 1)),
		]);
	}
	await frame.click('a.btn-post'),
	await new Promise(resolve => setTimeout(resolve, 5000));
	await frameHandle.dispose();
});
