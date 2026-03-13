export const curWindow = window as any;

export const GroupPointsConfig = {
	database: "group-points",
	mainTable: 'grade',
	suffix: '.json',
};

export async function loadGroupPointsConfig() {
	try {
		const mainConfig = await curWindow.electronAPI.loadConfigFromFile({
			mainPath: GroupPointsConfig.database,
			fileList: [GroupPointsConfig.mainTable],
			suffix: GroupPointsConfig.suffix,
			defaultContent: '[]'
		});
		console.log('mainConfig:', JSON.parse(mainConfig[GroupPointsConfig.mainTable]));
	} catch (error) {
		console.error('读取文件出错:', error);
	}
}

export async function writeGroupPointsGrade(content: string) {
	try {
		await curWindow.electronAPI.writeFile({
			filePath: [GroupPointsConfig.database, `${GroupPointsConfig.mainTable}${GroupPointsConfig.suffix}`].join('/'),
			content,
		});
	} catch (error) {
		console.error('写入文件出错:', error);
	}
}