#!/usr/bin/env node
import fs from 'fs/promises';
import ExifReader from 'exifreader';
import puppeteer from 'puppeteer-core';
import OpenAI from 'openai';
const dirArr = (await fs.readdir('Pictures', { withFileTypes: true })).filter(file => file.isDirectory()).map(file => `${file.parentPath}/${file.name}`);
console.assert(dirArr.length);
const mediaArr = [];
for (const dir of dirArr) {
	let fileArr = (await fs.readdir(dir, { withFileTypes: true })).filter(file => file.isFile() && file.name.endsWith('.jpg')).map(file => file.name);
	const filterArr = await Promise.all(fileArr.map(async (file, index) => {
		const exifTags = await ExifReader.load(`${dir}/${file}`);
		const imageWidth = exifTags['Image Width'].value;
		const imageHeight = exifTags['Image Height'].value;
		return (imageWidth === 3072 && imageHeight === 4096) || (imageWidth === 2448 && imageHeight === 3264); // These resolutions indicate the images were taken by the rear camera, not the front camera, to avoid selfies.
	}));
	fileArr = fileArr.filter((_, index) => filterArr[index]);
	mediaArr.push(...fileArr.reduce((res, file) => {
		const date = file.split('_')[1];
		if (!res.length || res[res.length - 1].date !== date) {
			res.push({
				date,
				dir,
				fileArr: [file],
			});
		} else {
			res[res.length - 1].fileArr.push(file);
		}
		return res;
	}, []));
}
console.assert(mediaArr.length);
const minorities = ["蒙古族","回族","藏族","维吾尔族","苗族","彝族","壮族","布依族","朝鲜族","满族","侗族","瑶族","白族","土家族","哈尼族","哈萨克族","傣族","黎族","傈僳族","佤族","畲族","高山族","拉祜族","水族","东乡族","纳西族","景颇族","柯尔克孜族","土族","达斡尔族","仫佬族","羌族","布朗族","撒拉族","毛南族","仡佬族","锡伯族","阿昌族","普米族","塔吉克族","怒族","乌孜别克族","俄罗斯族","鄂温克族","德昂族","保安族","裕固族","京族","塔塔尔族","独龙族","鄂伦春族","赫哲族","门巴族","珞巴族","基诺族","各族"];
const browser = await puppeteer.launch({
	executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
});
const m = 9; // QQ说说 supports uploading 9 pictures at most. Kuaishou supports uploading 31 pictures. toutiao, xiaohongshu and weibo support uploading 18 pictures. Douyin supports uploading 35 pictures.
await Promise.all(mediaArr.map(async (media, index) => {
	media.weekday = `周${['日', '一', '二', '三', '四', '五', '六'][(new Date(`${media.date.substring(0, 4)}-${media.date.substring(4, 6)}-${media.date.substring(6, 8)}`)).getDay()]}`;
	if (media.fileArr.length > m) {
		const segmentSize = media.fileArr.length / m;
		const indexArr = [...Array(m).keys()].map(i => {
			return Math.round((segmentSize * (2 * i + 1) - 1) / 2);
		});
		media.fileArr =  media.fileArr.filter((_, index) => indexArr.includes(index));
	}
	const page = await browser.newPage();
	const exifTags = await ExifReader.load(`${media.dir}/${media.fileArr[Math.floor(media.fileArr.length / 2)]}`);
	const revGeoRes = await page.goto(`https://api.map.baidu.com/reverse_geocoding/v3?ak=${process.env.BAIDUMAP_API_KEY}&output=json&coordtype=wgs84ll&extensions_poi=0&location=${['GPSLatitude', 'GPSLongitude'].map(key => exifTags[key].description).join(',')}`);
	const revGeo = await revGeoRes.json();
	await page.close();
	console.assert(revGeo.status === 0);
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
}));
await browser.close();
const openai = new OpenAI({
	apiKey: process.env.DASHSCOPE_API_KEY,
	baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
for (let i = 0; i < mediaArr.length; ++i) { // Use sequential calls to openai.chat.completions.create(), because parallel calls would hang.
	const media = mediaArr[i];
	console.log(i, media.date, media.weekday, media.province, media.city, media.district, media.town);
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
}
await fs.writeFile('media.json', JSON.stringify(mediaArr, null, '	'));
