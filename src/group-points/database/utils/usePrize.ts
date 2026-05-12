import { appendPrizeConfig } from "..";
import { useAppStore } from "../../store/models/app";
import { Prize } from "../class";
import { v4 as uuidv4 } from 'uuid';

export const usePrize = () => {
	const appStore = useAppStore();

	// 创建奖品
	const createPrize = async (params: { name: string, description: string, points: number, image: string, quantity: number, allow_grades: string[] }) => {
		const { name, description, points, image, quantity, allow_grades = [] } = params;
		try {
			const uuid = uuidv4() as string;
			const prize = new Prize({
				id: uuid,
				name,
				description,
				points,
				image,
				quantity,
				allow_grades
			});
			appStore.database.prizeList.push(prize);

			// 更新 database.prize 表数据写入文件
			await appendPrizeConfig(JSON.stringify(appStore.database.prizeList));
			return true;
		} catch (error) {
			console.error('创建奖品出错:', error);
			return false;
		}
	};

	// 删除奖品
	const deletePrize = async (id: string) => {
		try {
			const index = appStore.database.prizeList.findIndex(item => item.id === id);
			if (index === -1) {
				console.error('奖品不存在:', id);
				return false;
			}
			appStore.database.prizeList.splice(index, 1);
			await appendPrizeConfig(JSON.stringify(appStore.database.prizeList));
			return true;
		} catch (error) {
			console.error('删除奖品出错:', error);
			return false;
		}
	};

	// 更新奖品
	const updatePrize = async (params: { id: string, name: string, description: string, points: number, image: string, quantity: number, allow_grades: string[] }) => {
		const { id, name, description, points, image, quantity, allow_grades = [] } = params;
		try {
			const prize = appStore.database.prizeList.find(item => item.id === id);
			if (!prize) {
				console.error('奖品不存在:', id);
				return false;
			}
			prize.name = name;
			prize.description = description;
			prize.points = points;
			prize.image = image;
			prize.quantity = quantity;
			prize.allow_grades = allow_grades;
			await appendPrizeConfig(JSON.stringify(appStore.database.prizeList));
			return true;
		} catch (error) {
			console.error('更新奖品出错:', error);
			return false;
		}
	};

	// 获取奖品列表
	const getPrizeList = () => {
		return appStore.database.prizeList;
	};

	// 搜索奖品
	const searchPrizes = (keyword: string, searchType: 'name' | 'all' = 'all') => {
		const prizes = getPrizeList();

		if (!keyword.trim()) {
			return prizes;
		}

		if (searchType === 'name') {
			return prizes.filter(prize =>
				prize.name.toLowerCase().includes(keyword.toLowerCase())
			);
		}

		// 搜索所有字段
		return prizes.filter(prize => {
			const matchName = prize.name.toLowerCase().includes(keyword.toLowerCase());
			const matchDesc = prize.description.toLowerCase().includes(keyword.toLowerCase());
			return matchName || matchDesc;
		});
	};

	return { createPrize, deletePrize, updatePrize, getPrizeList, searchPrizes };
};