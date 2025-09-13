#!/usr/bin/env node
import browse from './browser.js';
browse('https://user.qzone.qq.com/439629497/311', 9, async (page, media) => { // Max 18 pictures.
	const frameHandle = await page.waitForSelector('iframe[id="app_canvas_frame"]');
	await new Promise(resolve => setTimeout(resolve, 2000));
	const frame = await frameHandle.contentFrame();
	const divHandle = await frame.waitForSelector('div[id="QM_Mood_Poster_Container"]');
	await divHandle.click();
	await new Promise(resolve => setTimeout(resolve, 1000));
	await divHandle.type(`${media.title}\n🌲\n${media.description}`); // Max 11000 characters.
	await new Promise(resolve => setTimeout(resolve, 500));
	for (let i = 0; i < media.fileArr.length; ++i) {
		await frame.click('a.pic');
		await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for the button to load.
		const [fileChooser] = await Promise.all([
			page.waitForFileChooser(),
			frame.click('li.qz_poster_btn_local_pic'),
		]);
		console.assert(!fileChooser.isMultiple());
		await Promise.all([
			frame.waitForSelector('ul.img-item-list>li:last-of-type>div.thumbnail>img[src^="http://photogzmaz.photo.store.qq.com/"]'), // When upload completes, the <img src=""> attribute will be changed to e.g. http://photogzmaz.photo.store.qq.com/psc?/V51IVfMS1ES2yk3CC9421L1OT04Wnbtj/LiySpxowE0yeWXwBdXN*SeTTAEu7N6a7sXEmyAyBSYdrwOiEmOSAiPoCiZzY4fru6y.43v8ACQyz.k35kh4Js04Gxf3yX51zIRCWfjouEZo!/a&bo=OASgBQAAAAAWELk!
			fileChooser.accept(media.fileArr.slice(i, i + 1)),
		]);
	}
	await new Promise(resolve => setTimeout(resolve, 2000)),
	await frame.click('a.btn-post'),
	await new Promise(resolve => setTimeout(resolve, 5000));
	await frameHandle.dispose();
});
