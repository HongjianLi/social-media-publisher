#!/usr/bin/env node
import fs from 'fs/promises';
import ExifReader from 'exifreader';
import puppeteer from 'puppeteer-core';
import OpenAI from 'openai';
const dirArr = (await fs.readdir('Pictures', { withFileTypes: true })).filter(file => file.isDirectory()).map(file => `${file.parentPath}/${file.name}`);
console.log(`Found ${dirArr.length} directories.`);
console.assert(dirArr.length);
const mediaArr = [];
for (const dir of dirArr) {
	let fileArr = (await fs.readdir(dir, { withFileTypes: true })).filter(file => file.isFile() && file.name.length >= 23 && file.name.startsWith('IMG_') && file.name.endsWith('.jpg')).map(file => file.name); // file.name should look like IMG_YYYYmmdd_HHMMSS(_HDR)?.jpg
	const filterArr = await Promise.all(fileArr.map(async (file) => {
		const exifTags = await ExifReader.load(`${dir}/${file}`);
		const imageWidth = exifTags['Image Width'].value;
		const imageHeight = exifTags['Image Height'].value;
		return (imageWidth === 3072 && imageHeight === 4096) || (imageWidth === 2448 && imageHeight === 3264); // These resolutions indicate the images were taken by the rear camera, not the front camera, to avoid selfies.
	}));
	fileArr = fileArr.filter((_, index) => filterArr[index]);
	mediaArr.push(...fileArr.reduce((res, file) => {
		const date = file.substring(4, 12);
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
	const file = `${media.dir}/${media.fileArr[Math.floor(media.fileArr.length / 2)]}`;
	const exifTags = await ExifReader.load(file);
	const { GPSLatitudeRef, GPSLatitude, GPSLongitudeRef, GPSLongitude, GPSAltitudeRef, GPSAltitude } = exifTags;
	console.assert(GPSLatitudeRef.id === 1 && GPSLatitudeRef.value.length === 1 && GPSLatitudeRef.value[0] === 'N' && GPSLatitudeRef.description === 'North latitude', [file, GPSLatitudeRef]);
	console.assert(GPSLatitude.id === 2 && GPSLatitude.value.length === 3 && GPSLatitude.value.every(v => v.length === 2) && GPSLatitude.value[0][1] === 1 && GPSLatitude.value[1][1] === 1 && GPSLatitude.value[2][1] > 0 && GPSLatitude.value[0][0] >= 0 && GPSLatitude.value[0][0] < 90, [file, GPSLatitude]); // GPSLatitude.value[2][1] could be 1, 100, 3286, 1000000.
	console.assert(GPSLongitudeRef.id === 3 && GPSLongitudeRef.value.length === 1 && GPSLongitudeRef.value[0] === 'E' && GPSLongitudeRef.description === 'East longitude', [file, GPSLongitudeRef]);
	console.assert(GPSLongitude.id === 4 && GPSLongitude.value.length === 3 && GPSLongitude.value.every(v => v.length === 2) && GPSLongitude.value[0][1] === 1 && GPSLongitude.value[1][1] === 1 && GPSLongitude.value[2][1] > 0 && GPSLongitude.value[0][0] >= 0 && GPSLongitude.value[0][0] < 180, [file, GPSLongitude]); // GPSLongitude.value[2][1] could be 100, 625, 1000000.
	console.assert(GPSAltitudeRef.id === 5 && ((GPSAltitudeRef.value === 0 && GPSAltitudeRef.description === 'Sea level') || (GPSAltitudeRef.value === 1 && GPSAltitudeRef.description === 'Sea level reference (negative value)')), [file, GPSAltitudeRef]);
	console.assert(GPSAltitude.id === 6 && GPSAltitude.value.length === 2 && GPSAltitude.value[1] > 0 && GPSAltitude.value[0] >= 0, [file, GPSAltitude]);
	media.latitude = `北纬${GPSLatitude.value[0][0]/GPSLatitude.value[0][1]}°${GPSLatitude.value[1][0]/GPSLatitude.value[1][1]}'${(GPSLatitude.value[2][0]/GPSLatitude.value[2][1]).toFixed(2)}"N`;
	media.longitude = `东经${GPSLongitude.value[0][0]/GPSLongitude.value[0][1]}°${GPSLongitude.value[1][0]/GPSLongitude.value[1][1]}'${(GPSLongitude.value[2][0]/GPSLongitude.value[2][1]).toFixed(2)}"E`;
	media.altitude = `海拔${(GPSAltitude.value[0]/GPSAltitude.value[1]).toFixed(0)}米`;
	const page = await browser.newPage();
	const revGeoRes = await page.goto(`https://api.map.baidu.com/reverse_geocoding/v3?ak=${process.env.BAIDUMAP_API_KEY}&output=json&coordtype=wgs84ll&location=${GPSLatitude.description},${GPSLongitude.description}`); // API: https://lbsyun.baidu.com/faq/api?title=webapi/guide/webservice-geocoding-abroad-base  Alternatives: https://lbs.amap.com/api/webservice/guide/api/georegeo, https://lbs.qq.com/service/webService/webServiceGuide/address/Gcoder, http://lbs.tianditu.gov.cn/server/geocoding.html
	const revGeo = await revGeoRes.json();
	await page.close();
 	if (revGeo.status !== 0) {
		console.error(`revGeo.status`, revGeo.status); // 1: 服务器内部错误; 302: 天配额超限，限制访问; 401: 当前并发量已经超过约定并发配额，限制访问;
		break;
	}
	let { province, city, district, town } = revGeo.result.addressComponent;
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
	['自治县', '特区', '林区', '新区', '市', '县', '区'].forEach(c => { // Note the order of 县 and 区 in order to correctly shorten 梅州梅县区, 赣州赣县区, 攀枝花东区, 攀枝花西区
		if (district.length >= 2 + c.length && district.endsWith(c)) district = district.slice(0, -c.length); // Avoid 城区,东区,西区 being shortened to just 城,东,西
	});
	minorities.forEach(minority => district = district.replace(minority, ''));
	media.district = district;
	media.town = town;
	console.log(media.date, media.weekday, media.province, media.city, media.district, media.town);
	const completion = await openai.chat.completions.create({
		model: "qwen-turbo", // https://help.aliyun.com/zh/model-studio/what-is-qwen-llm
		messages: [{
			"role": "user",
			"content": [{
				"type": "text",
				"text": `介绍${media.province}${media.city}${media.district}${media.town}的四个旅游景点。输出JSON。字段poem是字符串数组，包含四句七律诗描绘这些景点，每句包含七个字和一个标点符号。字段sites是字符串数组，包含四句，每句开头是景点的名字，然后用自然语言详细介绍景点、地址、游玩月份。`,
			}],
		}],
		response_format: {
			type: 'json_object',
		},
	});
	media.description = JSON.parse(completion.choices[0].message.content);
	const { poem } = media.description;
	console.assert(poem.length === 4, 'poem.length', poem.length, '!==', 4);
	poem.forEach(sentence => console.assert(sentence.length === 8, 'sentence.length', sentence.length, '!==', 8));
}
await browser.close();
await fs.writeFile('media.json', JSON.stringify(mediaArr, null, '	'));
