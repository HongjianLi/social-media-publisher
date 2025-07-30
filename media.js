#!/usr/bin/env node
import fs from 'fs/promises';
import ExifReader from 'exifreader';
import puppeteer from 'puppeteer-core';
import OpenAI from 'openai';
const dirArr = (await fs.readdir('Pictures', { withFileTypes: true })).filter(file => file.isDirectory()).map(file => `${file.parentPath}/${file.name}`);
console.log(`Found ${dirArr.length} directories.`);
console.assert(dirArr.length);
let mediaArr = [];
for (const dir of dirArr) {
	const fileArr = (await fs.readdir(dir, { withFileTypes: true })).filter(file => file.isFile() && file.name.length >= 23 && file.name.startsWith('IMG_') && (file.name.endsWith('.jpg') || file.name.endsWith('.HEIC')) && file.name.substring(19, 26) !== '_STEREO')/*.map(file => file.name)*/; // file.name should look like IMG_YYYYmmdd_HHMMSS(_HDR)?.{jpg,HEIC}
	mediaArr.push(...fileArr.reduce((res, file) => {
		const date = file.name.substring(4, 12);
		if (!res.length || res[res.length - 1].date !== date) {
			res.push({
				dir,
				date,
				fileArr: [],
			});
		}
		res[res.length - 1].fileArr.push(file);
		return res;
	}, []));
}
console.log(`Expanded to ${mediaArr.length} medias.`);
console.assert(mediaArr.length);
const minorities = ["蒙古族","回族","藏族","维吾尔族","苗族","彝族","壮族","布依族","朝鲜族","满族","侗族","瑶族","白族","土家族","哈尼族","哈萨克族","傣族","黎族","傈僳族","佤族","畲族","高山族","拉祜族","水族","东乡族","纳西族","景颇族","柯尔克孜族","土族","达斡尔族","仫佬族","羌族","布朗族","撒拉族","毛南族","仡佬族","锡伯族","阿昌族","普米族","塔吉克族","怒族","乌孜别克族","俄罗斯族","鄂温克族","德昂族","保安族","裕固族","京族","塔塔尔族","独龙族","鄂伦春族","赫哲族","门巴族","珞巴族","基诺族","各族"];
const openai = new OpenAI({
	apiKey: process.env.DASHSCOPE_API_KEY,
	baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
for (const media of mediaArr) { // Use sequential loop instead of promise.all, because parallel requests to api.map.baidu.com/reverse_geocoding would exhaust its concurrency limit, and parallel calls to openai.chat.completions.create() would hang.
	media.weekday = `周${['日', '一', '二', '三', '四', '五', '六'][(new Date(`${media.date.substring(0, 4)}-${media.date.substring(4, 6)}-${media.date.substring(6, 8)}`)).getDay()]}`;
	console.log(media.dir, media.date, media.weekday, media.fileArr.length);
	await Promise.all(media.fileArr.map(async (file) => {
		const exifTags = await ExifReader.load(`${media.dir}/${file.name}`);
		const model = exifTags.Model.description;
		console.assert(['iQOO Neo8 Pro', 'Redmi K30 Pro', 'Redmi Note 5', 'Redmi Pro', 'Redmi Note 2'].includes(model), 'Unknown model:', model);
		const orientation = exifTags['Orientation'];
		if (orientation) {
			console.assert(orientation.id === 274);
			console.assert([0, 1, 3, 6, 8].includes(orientation.value), file.name, model, orientation);
			if (!(
				(model === 'iQOO Neo8 Pro' && ((orientation.value === 0 && orientation.description === 'Undefined'))) || // Other values are { id: 274, value: 1, description: 'top-left' }, { id: 274, value: 6, description: 'right-top' }
				(model === 'Redmi K30 Pro' && ((orientation.value === 6 && orientation.description === 'right-top'))) || // Other values are { id: 274, value: 1, description: 'top-left' }, { id: 274, value: 3, description: 'bottom-right' }, { id: 274, value: 8, description: 'left-bottom' }
				(model === 'Redmi Note 5'  && ((orientation.value === 6 && orientation.description === 'right-top'))) ||
				(model === 'Redmi Pro'     && ((orientation.value === 0 && orientation.description === 'Undefined') || (orientation.value === 1 && orientation.description === 'top-left'))) ||
				(model === 'Redmi Note 2'  && ((orientation.value === 1 && orientation.description === 'top-left')))
			)) return; // Keep portrait orientation only. Discard landscape orientation and panorama.
		}
		// Images taken by iQOO Neo8 Pro have ImageWidth and 'Image Width'. Images taken by Redmi K30 Pro all have ImageWidth, but only some have 'Image Width'. Images taken by Redmi Note 5, Redmi Pro, Redmi Note 2 have 'Image Width' but not ImageWidth.
		const width = exifTags['ImageWidth'] ? exifTags['ImageWidth'].value : exifTags['Image Width'].value;
		const height = exifTags['ImageLength'] ? exifTags['ImageLength'].value : exifTags['Image Height'].value;
		console.assert(
			(model === 'iQOO Neo8 Pro' && ((width === 3072 && height === 4096) || (width === 2448 && height === 3264) || (width === 4096 && height === 3072) || (width === 3456 && height === 4608))) || // (width === 4096 && height === 3072) is landscape orientation. (width === 3456 && height === 4608) was taken by front camera.
			(model === 'Redmi K30 Pro' && ((width === 4624 && height === 3472) || (width === 4208 && height === 3120) || (width === 3296 && height === 2472) || (width === 9248 && height === 6944))) || // (width === 9248 && height === 6944) is portrait orientation and taken by rear camera, but has a pretty large file size, e.g. 27MB.
			(model === 'Redmi Note 5'  && ((width === 4000 && height === 3000))) ||
			(model === 'Redmi Pro'     && ((width === 3120 && height === 4160) || (width === 2368 && height === 4208) || (width === 4160 && height === 3120) || (width === 4208 && height === 2368))) || // (width === 4160 && height === 3120) is landscape orientation. (width === 4208 && height === 2368) is landscape orientation.
			(model === 'Redmi Note 2'  && ((width === 3120 && height === 4160) || (width === 4160 && height === 3120))) // (width === 4160 && height === 3120) is landscape orientation.
		, file.name, model, orientation, width, height);
		if (!(
			(model === 'iQOO Neo8 Pro' && ((width === 3072 && height === 4096) || (width === 2448 && height === 3264))) ||
			(model === 'Redmi K30 Pro' && ((width === 4624 && height === 3472) || (width === 4208 && height === 3120) || (width === 3296 && height === 2472))) ||
			(model === 'Redmi Note 5'  && ((width === 4000 && height === 3000))) ||
			(model === 'Redmi Pro'     && ((width === 3120 && height === 4160) || (width === 2368 && height === 4208))) ||
			(model === 'Redmi Note 2'  && ((width === 3120 && height === 4160)))
		)) return; // Keep portrait orientation and rear camera only. Discard front camera.
		file.resolutionOK = true;
		file.gpsOK = exifTags.GPSLatitude !== undefined;
	}));
	media.fileArr = media.fileArr.filter(file => file.resolutionOK);
	if (!media.fileArr.length) {
		console.log('Resolution not OK');
		continue;
	}
	const fileGpsArr = media.fileArr.filter(file => file.gpsOK).map(file => file.name);
	if (fileGpsArr.length) {
		const file = fileGpsArr[Math.floor(fileGpsArr.length / 2)]; // This is the file where GPS tags will be retrieved from.
		const exifTags = await ExifReader.load(`${media.dir}/${file}`);
		const { GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitudeRef, GPSAltitude } = exifTags;
		console.assert(GPSLatitudeRef.id === 1 && GPSLatitudeRef.value.length === 1 && GPSLatitudeRef.value[0] === 'N' && GPSLatitudeRef.description === 'North latitude', file, GPSLatitudeRef);
		console.assert(GPSLatitude.id === 2 && GPSLatitude.value.length === 3 && GPSLatitude.value.every(v => v.length === 2) && GPSLatitude.value[0][1] === 1 && GPSLatitude.value[1][1] === 1 && GPSLatitude.value[2][1] > 0 && GPSLatitude.value[0][0] >= 0 && GPSLatitude.value[0][0] < 90, file, GPSLatitude); // GPSLatitude.value[2][1] could be 1, 100, 3286, 1000000.
		console.assert(GPSLatitude.description === GPSLatitude.value[0][0]/GPSLatitude.value[0][1] + (GPSLatitude.value[1][0]/GPSLatitude.value[1][1]) / 60 + (GPSLatitude.value[2][0]/GPSLatitude.value[2][1]) / 3600);
		console.assert(GPSLongitudeRef.id === 3 && GPSLongitudeRef.value.length === 1 && GPSLongitudeRef.value[0] === 'E' && GPSLongitudeRef.description === 'East longitude', file, GPSLongitudeRef);
		console.assert(GPSLongitude.id === 4 && GPSLongitude.value.length === 3 && GPSLongitude.value.every(v => v.length === 2) && GPSLongitude.value[0][1] === 1 && GPSLongitude.value[1][1] === 1 && GPSLongitude.value[2][1] > 0 && GPSLongitude.value[0][0] >= 0 && GPSLongitude.value[0][0] < 180, file, GPSLongitude); // GPSLongitude.value[2][1] could be 100, 625, 1000000.
		console.assert(GPSLongitude.description === GPSLongitude.value[0][0]/GPSLongitude.value[0][1] + (GPSLongitude.value[1][0]/GPSLongitude.value[1][1]) / 60 + (GPSLongitude.value[2][0]/GPSLongitude.value[2][1]) / 3600);
		console.assert(GPSAltitudeRef.id === 5 && ((GPSAltitudeRef.value === 0 && GPSAltitudeRef.description === 'Sea level') || (GPSAltitudeRef.value === 1 && GPSAltitudeRef.description === 'Sea level reference (negative value)')), file, GPSAltitudeRef);
		console.assert(GPSAltitude.id === 6 && GPSAltitude.value.length === 2 && GPSAltitude.value[1] > 0 && GPSAltitude.value[0] >= 0 && (GPSAltitude.value[0] < 99999000 || GPSAltitude.value[0] > 4200000000), file, GPSAltitude); // Computed altitude should be < 99999 m. The unit can be 1 or 1000.
		media.file = file;
		media.latitude = GPSLatitude.description;
		media.longitude = GPSLongitude.description;
		media.altitude = GPSAltitude.value[0]/GPSAltitude.value[1];
		if (media.altitude > 4200000000) media.altitude -= 4294967296;
	} else {
		const m = [ // Baidu map's geocoding service can return latitude and longitude given a domestic address, like this: https://api.map.baidu.com/geocoding/v3/?ak=ak&output=json&address=宁波市天一广场  https://lbsyun.baidu.com/faq/api?title=webapi/guide/webservice-geocoding-base, but it will return wrong result for overseas addresses such as 日本大阪. In that case, manual searching Google is suggested.
			{ dir: '2016-10-28 宁波 舟山', date: '20161029', latitude: 29.940487341248926, longitude: 122.39081741762648 }, // 浙江舟山普陀朱家尖
			{ dir: '2016-10-28 宁波 舟山', date: '20161030', latitude: 29.872029593403480, longitude: 121.55048863537063 }, // 浙江宁波海曙江厦
			{ dir: '2016-11-18 昆明',     date: '20161119', latitude: 25.916746015928774, longitude: 103.07570396383425 }, // 云南昆明东川红土地
			{ dir: '2016-11-18 昆明',     date: '20161120', latitude: 25.922339537228934, longitude: 103.07511557372540 }, // 云南昆明东川红土地
			{ dir: '2019-12-07 珠海',     date: '20191206', latitude: 22.283510556832610, longitude: 113.59658937284914 }, // 广东珠海香洲香湾
			{ dir: '2019-12-07 珠海',     date: '20191207', latitude: 22.290209398539717, longitude: 113.59539848923495 }, // 广东珠海香洲香湾
			{ dir: '2020-05-13 深圳',     date: '20200513', latitude: 22.550778996792184, longitude: 114.57827398298905 }, // 广东深圳龙岗南澳
			{ dir: '2020-05-13 深圳',     date: '20200514', latitude: 22.613232773623105, longitude: 114.42310760619914 }, // 广东深圳龙岗葵涌
			{ dir: '2016-11-03 Osaka',   date: '20161103', latitude: 34.646833, longitude: 135.499083 }, // 日本大阪 For overseas locations, baidu map's reverse geocoding can resolve to the granularity of city only, with district and town usually being empty.
			{ dir: '2016-11-03 Osaka',   date: '20161104', latitude: 34.646833, longitude: 135.499083 }, // 日本大阪
			{ dir: '2016-11-03 Osaka',   date: '20161105', latitude: 35.011641, longitude: 135.768190 }, // 日本京都
			{ dir: '2016-11-03 Osaka',   date: '20161106', latitude: 35.011641, longitude: 135.768190 }, // 日本京都
			{ dir: '2016-11-03 Osaka',   date: '20161107', latitude: 34.69017, longitude: 135.19544 }, // 日本神户
		].find(m => media.dir.endsWith(m.dir) && m.date === media.date);
		if (m) {
			media.latitude = m.latitude;
			media.longitude = m.longitude;
			media.altitude = 0; // Google Elevation API can return elevation data for a location. https://developers.google.com/maps/documentation/elevation/overview
		} else {
			console.log('GPS not found');
			continue;
		}
	}
	const page = await browser.newPage();
	const revGeoRes = await page.goto(`https://api.map.baidu.com/reverse_geocoding/v3?ak=${process.env.BAIDUMAP_API_KEY}&output=json&coordtype=wgs84ll&language=zh-CN&location=${media.latitude},${media.longitude}`); // API: https://lbsyun.baidu.com/faq/api?title=webapi/guide/webservice-geocoding-abroad-base  Alternatives: https://lbs.amap.com/api/webservice/guide/api/georegeo, https://lbs.qq.com/service/webService/webServiceGuide/address/Gcoder, http://lbs.tianditu.gov.cn/server/geocoding.html
	const revGeo = await revGeoRes.json();
	await page.close();
	if (revGeo.status !== 0) {
		console.error(`revGeo.status`, revGeo.status); // 1: 服务器内部错误; 302: 天配额超限，限制访问; 401: 当前并发量已经超过约定并发配额，限制访问;
		break;
	}
	let { country, province, city, district, town } = revGeo.result.addressComponent;
	media.country = country;
	if (['香港', '澳门', '重庆市', '上海市', '天津市', '北京市'].includes(province)) {
		media.province = '';
	} else {
		['自治区', '省'].forEach(c => {
			if (province.endsWith(c)) province = province.slice(0, -c.length);
		});
		minorities.forEach(minority => province = province.replace(minority, ''));
		media.province = province;
	}
	['自治州', '自治县', '林区', '市', '县', '地区', '蒙古', '哈萨克', '柯尔克孜'].forEach(c => {
		if (city.endsWith(c)) city = city.slice(0, -c.length);
	});
	minorities.forEach(minority => city = city.replace(minority, ''));
	media.city = city;
	if (town === district) town = ''; // Avoid duplicate.
	['自治县', '特区', '林区', '新区', '市', '县', '区'].forEach(c => { // Note the order of 县 and 区 in order to correctly shorten 梅州梅县区, 赣州赣县区, 攀枝花东区, 攀枝花西区
		if (district.length >= 2 + c.length && district.endsWith(c)) district = district.slice(0, -c.length); // Avoid 城区,东区,西区 being shortened to just 城,东,西
	});
	minorities.forEach(minority => district = district.replace(minority, ''));
	media.district = district;
	if (town.length) {
		console.assert(['街道', '镇'].some(c => town.endsWith(c)), `town.endsWith(['街道', '镇'])`); // 乡, 社区
		['街道', '镇'].forEach(c => {
			if (town.endsWith(c)) town = town.slice(0, -c.length);
		});
	}
	media.town = town;
	console.log(media.country, media.province, media.city, media.district, media.town);
	const completion = await openai.chat.completions.create({
		model: "qwen-turbo", // https://help.aliyun.com/zh/model-studio/what-is-qwen-llm
		messages: [{
			"role": "user",
			"content": [{
				"type": "text",
				"text": `介绍${media.country}${media.province}${media.city}${media.district}${media.town}的四个旅游景点。输出JSON。字段poem是字符串数组，包含四句七律诗描绘这些景点，每句包含七个字和一个标点符号。字段sites是字符串数组，包含四句，每句开头是景点的名字，然后用自然语言详细介绍景点、地址、游玩月份。`,
			}],
		}],
		response_format: {
			type: 'json_object',
		},
	});
	media.description = JSON.parse(completion.choices[0].message.content);
	const { poem } = media.description;
	console.assert(poem.length === 4, 'poem.length === 4', poem.length);
	poem.forEach(sentence => console.assert(sentence.length === 8, 'sentence.length === 8', sentence.length));
	media.fileArr = media.fileArr.map(file => `${file.name.substring(0, file.name.lastIndexOf('.'))}.jpg`); // Change the extension name to .jpg, as douyin, toutiao, kuaishou, xiaohongshu, qzone do not support uploading .HEIC files. They will be converted via "magick mogrify -format jpg *.HEIC"
}
mediaArr = mediaArr.filter(media => media.fileArr.length);
console.log(`Filtered ${mediaArr.length} medias.`);
await fs.writeFile('media.json', JSON.stringify(mediaArr, null, '	'));
await browser.close();
