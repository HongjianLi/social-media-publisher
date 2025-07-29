import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
export default async (url, numFiles = 9, pageHandler) => {
	const browser = await puppeteer.launch({
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
		headless: false,
		defaultViewport: { width: 1440, height: 1400 },
		args: ['--start-fullscreen'],
	});
	await browser.defaultBrowserContext().overridePermissions(url.split('/').slice(0, 3).join('/'), ['geolocation']); // https://pptr.dev/api/puppeteer.browsercontext.overridepermissions
	await fs.readFile('cookies.json').then(JSON.parse).then(cookies => browser.setCookie(...cookies));
	const mediaArr = await fs.readFile('media.json').then(JSON.parse);
	for (const media of mediaArr) {
//		if (!(media.date >= '20250416')) continue; // Used to filter medias to publish.
		console.log(media.date, media.weekday, media.province, media.city, media.district, media.town);
		if (media.fileArr.length > numFiles) {
			const segmentSize = media.fileArr.length / numFiles;
			const indexArr = [...Array(numFiles).keys()].map(i => {
				return Math.round((segmentSize * (2 * i + 1) - 1) / 2);
			});
			media.fileArr =  media.fileArr.filter((_, index) => indexArr.includes(index));
		}
		const page = await browser.newPage();
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
		await page.setGeolocation({ latitude: media.latitude, longitude: media.longitude }); // https://pptr.dev/api/puppeteer.page.setgeolocation
		const response = await page.goto(url, { waitUntil: 'networkidle2' });
//		console.assert(response.ok()); // kuaishou would fail this assertion.
		console.assert(page.url() === url);
		media.fileArr = media.fileArr.map(file => `${media.dir}/${file}`);
		media.title = `${media.date}${media.weekday}${media.province}${media.city}${media.district.length ? media.district : media.town}`;
		const latitudeArr = [media.latitude]; convertll(latitudeArr); convertll(latitudeArr);
		const longitudeArr = [media.longitude]; convertll(longitudeArr); convertll(longitudeArr);
		media.description = [ ...media.description.poem, ...media.description.sites.map(site => `🤪\n${site}`), '🌏', `北纬${latitudeArr[0]}°${latitudeArr[1]}'${latitudeArr[2].toFixed(2)}"N`, `东经${longitudeArr[0]}°${longitudeArr[1]}'${longitudeArr[2].toFixed(2)}"E`, `海拔${media.altitude.toFixed(0)}米`, '🌈', '原创声明：图片是自主拍摄，文字是根据图片拍摄地点由AI生成。' ].join('\n');
		await pageHandler(page, media);
		await new Promise(resolve => setTimeout(resolve, 3000));
		await page.close();
	}
	await browser.close();
};
function convertll(a) {
	const v = a.pop();
	const f = Math.floor(v);
	a.push(f, (v - f) * 60);
}
