const curWindow = window as any;
// 假设这是在一个按钮点击事件的处理函数中
export async function openFile() {
	// 1. 让用户选择文件
	const filePath = await curWindow.electronAPI.openFileDialog();
	if (filePath) {
		// 2. 读取文件内容
		try {
			const fileContent = await curWindow.electronAPI.readFile(filePath);
			console.log('文件内容:', fileContent);
			return fileContent;
		} catch (error) {
			console.error('读取文件出错:', error);
		}
	}
}

export async function readGroupPointsConfigFile() {
	try {
		const fileContent = await curWindow.electronAPI.readGroupPointsConfig();
		console.log('文件内容:', fileContent);
		return fileContent;
	} catch (error) {
		console.error('读取文件出错:', error);
	}
}