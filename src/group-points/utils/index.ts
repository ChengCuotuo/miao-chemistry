import { curWindow } from "../database";

// 假设这是在一个按钮点击事件的处理函数中
export async function openFile(extensions: string): Promise<{ name: string, content: any } | undefined> {
	// 1. 让用户选择文件
	const filePath = await curWindow.electronAPI.openFileDialog(extensions);
	if (filePath) {
		// 2. 读取文件内容
		try {
			const fileContent = await curWindow.electronAPI.readFullPathFile(filePath);
			return fileContent as { content: any, name: string };
		} catch (error) {
			console.error('读取文件出错:', error);
			return undefined;
		}
	}
}
