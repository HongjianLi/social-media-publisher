import { readFileSync } from 'fs';
import OpenAI from "openai";
const openai = new OpenAI({
	apiKey: process.env.DASHSCOPE_API_KEY,
	baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
});
const completion = await openai.chat.completions.create({
	model: "qwen3-32b", // https://help.aliyun.com/zh/model-studio/what-is-qwen-llm
	messages: [{
		"role": "user",
		"content": [{
			"type": "text",
			"text": "列举海南省海口市秀英区的三个旅游景点，以及简介、地址、公交路线、下车站点、门票价格、最佳游玩时间。输出自动换行，不需前言后语，不需序号。",
		}],
	}],
	stream: true,
/*	model: "qwen-vl-max",
	messages: [{
		"role": "system",
		"content": [{ "type": "text", "text": "结合图片信息中的地址、海拔、时间、季节、气候，联网搜索出描述当地的多首七律诗，每首诗包含四句或八句。" }],
	}, {
		"role": "user",
		"content": [{
			"type": "image_url",
			"image_url": { "url": `data:image/jpeg;base64,${readFileSync("IMG_20250124_173613.jpg").toString('base64')}` },
			"image_url": { "url": `data:image/jpeg;base64,${readFileSync("IMG_20250124_173823.jpg").toString('base64')}` },
		}],
	}],
	enable_search: true,*/
});
//console.log(completion.choices[0].message.content);
let fullContent = "";
console.log("流式输出内容为：")
for await (const chunk of completion) {
    if (Array.isArray(chunk.choices) && chunk.choices.length > 0) {
		const { content } = chunk.choices[0].delta;
		if (content) {
			fullContent = fullContent + content;
		}
    }
}
console.log("\n完整内容为：")
console.log(fullContent);
