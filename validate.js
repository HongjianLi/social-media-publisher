#!/usr/bin/env node
import fs from 'fs/promises';
const mediaArr = await fs.readFile(`media.json`).then(JSON.parse);
console.log(mediaArr.length);
const countArr = [0, 0, 0, 0, 0, 0, 0, 0, 0];
mediaArr.forEach(media => {
	console.log(media.date, media.weekday, media.province, media.city, media.district, media.town, media.fileArr.length);
	media.title = `${media.date}${media.weekday}${media.province}${media.city}${media.district.length ? media.district : media.town}`;
	console.assert(media.title.length <= 18, media.title); // Max 20 characters for douyin, xiaohongshu.
	console.assert(media.fileArr.length);
	console.assert(media.latitude !== undefined);
	console.assert(media.altitude <= 99999);
	console.assert(media.district.length <= 5);
	console.assert(media.town.length <= 5);
	console.assert(!media.town.endsWith('镇') || media.town === '古镇', media.town);
	console.assert(!media.town.endsWith('街道'));
	const { poem } = media.description;
	console.assert(poem.length === 4, 'poem.length === 4', poem.length);
	poem.forEach(sentence => console.assert(sentence.length === 8, 'sentence.length === 8', sentence.length, sentence));
	if (media.fileArr.length >= 9) ++countArr[0]; else ++countArr[media.fileArr.length];
/*	if (media.fileArr.length === 1) { // Create symlinks to inspect those dates with only one picture.
		media.fileArr.forEach(async file => {
			try { await fs.access(`${media.dir}/${file}`); } catch { file = `${file.substring(0, file.lastIndexOf('.'))}.HEIC`; }
			await fs.symlink(`${media.dir}/${file}`, file);
		});
	}*/
});
console.log(countArr);
