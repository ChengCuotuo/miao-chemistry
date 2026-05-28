import { curWindow, GroupPointsConfig } from "..";

export const getTablePath = (table: string) => {
	return [GroupPointsConfig.database, `${table}${GroupPointsConfig.suffix}`].join('/');
}

export async function writeIntoTable(table: string, content: string) {
	try {
		await curWindow.electronAPI.writeFile({
			filePath: getTablePath(table),
			content,
		});
	} catch (error) {
		console.error('写入文件出错:', error);
	}
}

// 生成6位随机数
export const generateRandom6Digit = () => {
	return Math.floor(Math.random() * 900000 + 100000).toString();
}
