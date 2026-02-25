#!/usr/bin/env node
import fs from 'fs/promises';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
await fs.readFile('cookies.json').then(JSON.parse).then(cookies => browser.setCookie(...cookies));
const [ page ] = await browser.pages();
await page.goto('https://creator.douyin.com/creator-micro/content/manage', {waitUntil: 'networkidle2'});
await page.waitForSelector('div.content-header-total-cqI3dd');
const mediaCount = await page.$eval('div.content-header-total-cqI3dd', el => parseInt(el.innerText.split(' ')[1])); // e.g. 共 321 个作品
console.log(`Found ${mediaCount} media published`);
const mediaArr = await fs.readFile('media.json').then(JSON.parse).then(arr => arr.slice(mediaCount, mediaCount + 1));
await fs.writeFile('media1.json', JSON.stringify(mediaArr, null, '	'));
await browser.close();
