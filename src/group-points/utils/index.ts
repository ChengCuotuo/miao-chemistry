import { curWindow } from "../database";

// 假设这是在一个按钮点击事件的处理函数中
export async function openFile(extensions: string) {
	// 1. 让用户选择文件
	const filePath = await curWindow.electronAPI.openFileDialog(extensions);
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