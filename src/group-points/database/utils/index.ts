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