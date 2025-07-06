import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
export default async (url, pageHandler) => {
	const browser = await puppeteer.launch({
		executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
		headless: false,
		defaultViewport: { width: 1440, height: 900 },
		args: ['--start-fullscreen'],
	});
	await fs.readFile('cookies.json').then(JSON.parse).then(cookies => browser.setCookie(...cookies));
	const mediaArr = await fs.readFile('media.json').then(JSON.parse);
	for (const media of mediaArr) {
		const page = await browser.newPage();
		await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0');
		const response = await page.goto(url, { waitUntil: 'networkidle2' });
		console.assert(response.ok());
		console.assert(page.url() === url);
		await pageHandler(page, media);
		await new Promise(resolve => setTimeout(resolve, 3000));
		await page.close();
	}
	await browser.close();
};
