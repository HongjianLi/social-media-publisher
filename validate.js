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
	console.assert(media.latitude.length);
	console.assert(media.altitude.length <= 7);
	console.assert(media.district.length <= 5);
	console.assert(media.town.length <= 5);
	console.assert(!media.town.endsWith('镇') || media.town === '古镇', media.town);
	console.assert(!media.town.endsWith('街道'));
	const { poem } = media.description;
	console.assert(poem.length === 4, 'poem.length === 4', poem.length);
	poem.forEach(sentence => console.assert(sentence.length === 8, 'sentence.length === 8', sentence.length, sentence));
	if (media.fileArr.length >= 9) ++countArr[0]; else ++countArr[media.fileArr.length];
});
console.log(countArr);
