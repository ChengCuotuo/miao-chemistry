// 规则 Excel 导入导出工具
// 表格格式（单 sheet，表头名称一致即可，列顺序可调整）：
//   分组 | 规则名称 | 积分值 | 适用班级 | 规则描述
// - 分组：留空 → 默认分组；分组不存在时导入过程中自动创建（最多两层：分组 → 规则）
// - 积分值：数字（正数加分 / 负数减分）；留空或填「自定义」→ 无分值规则
// - 适用班级：班级名称，多个用逗号 / 顿号 / 分号分隔；留空表示所有班级通用
import { read, utils, writeFile as writeExcelFile } from 'xlsx';
import type { Rule, RuleGroup } from '../class';

export const RULE_EXCEL_SHEET = '规则';
export const RULE_EXCEL_HEADERS = ['分组', '规则名称', '积分值', '适用班级', '规则描述'];
export const RULE_EXCEL_TEMPLATE_FILENAME = '规则导入模板.xlsx';
export const RULE_EXCEL_EXPORT_FILENAME = '规则导出.xlsx';

// 无分值规则在表格中可填写的占位文案
export const NO_POINTS_TEXT = '自定义';
const NO_POINTS_WORDS = ['自定义', '自定义分值', '无', '无分值', '不设分值', '-', '—'];

// 表头别名（小写、去空格后比较），兼容手工改过的表头
const HEADER_ALIASES: Record<'group' | 'name' | 'points' | 'grades' | 'description', string[]> = {
	group: ['分组', '所属分组', '分组名称', 'group', 'groupname'],
	name: ['规则名称', '名称', '规则', 'name', 'rulename'],
	points: ['积分值', '积分', '分值', 'points', 'score'],
	grades: ['适用班级', '班级', '班级名称', 'grades', 'allowgrades', 'allow_grades'],
	description: ['规则描述', '描述', '说明', '备注', 'description', 'desc'],
};

export interface RuleExcelRow {
	/** Excel 中的行号（含表头，从 1 开始），用于错误定位 */
	row: number;
	/** 分组名称（已 trim，可能为空字符串，表示默认分组） */
	groupName: string;
	name: string;
	/** null 表示无分值规则 */
	points: number | null;
	/** 适用班级名称（原始文本，未映射为 id） */
	gradeNames: string[];
	description: string;
}

export interface RuleExcelParseResult {
	rows: RuleExcelRow[];
	errors: { row: number; message: string }[];
}

const normalizeHeader = (value: unknown) => String(value ?? '').replace(/\s/g, '').toLowerCase();

const findColumnIndex = (headerRow: string[], aliases: string[]) =>
	headerRow.findIndex(header => aliases.includes(header));

// 解析单元格中的班级名称：支持中英文逗号/顿号/分号/斜杠分隔
const splitGradeNames = (value: unknown): string[] => {
	if (value === null || value === undefined) return [];
	return String(value)
		.split(/[，,、;；/|\s]+/)
		.map(name => name.trim())
		.filter(name => !!name && name !== '所有班级' && name !== '全部班级' && name !== '全部' && name !== '所有');
};

// 解析积分值：空 / 「自定义」等 → null（无分值规则）
const parsePoints = (value: unknown): { points: number | null; invalid?: string } => {
	if (value === null || value === undefined) return { points: null };
	const raw = String(value).trim();
	if (!raw) return { points: null };
	if (NO_POINTS_WORDS.includes(raw) || NO_POINTS_WORDS.includes(raw.toLowerCase())) return { points: null };
	const num = Number(raw);
	if (Number.isNaN(num)) return { points: null, invalid: raw };
	return { points: num };
};

const isRowEmpty = (row: unknown[]) => row.every(cell => String(cell ?? '').trim() === '');

/**
 * 解析 Excel 内容（ArrayBuffer / Uint8Array）为规则行。
 * 兼容两种格式：
 *  1. 标准格式：含「分组 / 规则名称 / 积分值 / 适用班级 / 规则描述」表头
 *  2. 旧格式（无表头）：第一列名称、第二列积分，全部归入默认分组
 */
export const parseRuleExcel = (data: Uint8Array | ArrayBuffer): RuleExcelParseResult => {
	const errors: RuleExcelParseResult['errors'] = [];
	const workbook = read(data, { type: 'array' });
	const firstSheetName = workbook.SheetNames[0];
	if (!firstSheetName) return { rows: [], errors: [{ row: 0, message: '未找到任何工作表' }] };
	const worksheet = workbook.Sheets[firstSheetName];
	const aoa = utils.sheet_to_json<unknown[]>(worksheet, { header: 1, blankrows: false, defval: '' }) as unknown[][];
	if (!aoa.length) return { rows: [], errors: [{ row: 0, message: '表格内容为空' }] };

	const headerRow = (aoa[0] || []).map(normalizeHeader);
	const nameIdx = findColumnIndex(headerRow, HEADER_ALIASES.name);
	const groupIdx = findColumnIndex(headerRow, HEADER_ALIASES.group);
	const pointsIdx = findColumnIndex(headerRow, HEADER_ALIASES.points);
	const gradesIdx = findColumnIndex(headerRow, HEADER_ALIASES.grades);
	const descIdx = findColumnIndex(headerRow, HEADER_ALIASES.description);
	// 未识别到「规则名称」列 → 按无表头的旧格式处理（第 1 列名称、第 2 列积分）
	const legacyMode = nameIdx === -1;
	if (legacyMode) {
		errors.push({ row: 1, message: '未识别到「规则名称」表头，已按「名称 / 积分」两列格式解析，全部归入默认分组' });
	}

	const rows: RuleExcelRow[] = [];
	aoa.slice(legacyMode ? 0 : 1).forEach((rawRow, index) => {
		const excelRow = (legacyMode ? 0 : 1) + index + 1;
		if (isRowEmpty(rawRow)) return;
		const cell = (idx: number) => (idx >= 0 ? rawRow[idx] : undefined);

		const name = legacyMode ? String(cell(0) ?? '').trim() : String(cell(nameIdx) ?? '').trim();
		if (!name) {
			errors.push({ row: excelRow, message: '规则名称为空，已跳过该行' });
			return;
		}
		const { points, invalid } = parsePoints(legacyMode ? cell(1) : cell(pointsIdx));
		if (invalid !== undefined) {
			errors.push({ row: excelRow, message: `积分值「${invalid}」无法识别，已按无分值规则处理` });
		}

		rows.push({
			row: excelRow,
			groupName: legacyMode ? '' : String(cell(groupIdx) ?? '').trim(),
			name,
			points,
			gradeNames: legacyMode ? [] : splitGradeNames(cell(gradesIdx)),
			description: legacyMode ? '' : String(cell(descIdx) ?? '').trim(),
		});
	});

	return { rows, errors };
};

/** 班级名称 → 班级 id；返回未匹配到的名称，便于提示用户 */
export const resolveGradeNames = (
	gradeNames: string[],
	gradeList: { id?: string; name: string }[] = [],
): { ids: string[]; unknown: string[] } => {
	const ids: string[] = [];
	const unknown: string[] = [];
	gradeNames.forEach(name => {
		const hit = gradeList.find(grade => grade.name === name);
		if (hit?.id) {
			if (!ids.includes(hit.id)) ids.push(hit.id);
		} else if (!unknown.includes(name)) {
			unknown.push(name);
		}
	});
	return { ids, unknown };
};

const pointsToCell = (points: number | null | undefined): string | number =>
	points === null || points === undefined ? NO_POINTS_TEXT : points;

/** 构建规则导出的工作簿（分组 → 规则，含适用班级名称与描述） */
export const buildRuleWorkbook = (
	groups: RuleGroup[],
	rules: Rule[],
	gradeList: { id?: string; name: string }[] = [],
) => {
	const workbook = utils.book_new();
	const gradeName = (id: string) => gradeList.find(grade => grade.id === id)?.name || id;
	const data: (string | number)[][] = [RULE_EXCEL_HEADERS];
	groups.forEach(group => {
		rules
			.filter(rule => rule.group_id === group.id)
			.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
			.forEach(rule => {
				data.push([
					group.name,
					rule.name,
					pointsToCell(rule.points),
					(rule.allow_grades || []).map(gradeName).join('、'),
					rule.description || '',
				]);
			});
	});
	const sheet = utils.aoa_to_sheet(data);
	sheet['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 22 }, { wch: 40 }];
	utils.book_append_sheet(workbook, sheet, RULE_EXCEL_SHEET);
	return workbook;
};

/** 构建导入模板（含示例数据 + 填写说明 sheet） */
export const buildRuleTemplateWorkbook = () => {
	const workbook = utils.book_new();
	const data: (string | number)[][] = [
		RULE_EXCEL_HEADERS,
		['课堂表现', '主动回答问题', 2, '所有班级', '整节课积极举手并回答正确'],
		['课堂表现', '课堂走神', -1, '一年级1班、一年级2班', '仅在一年级使用，留空班级表示全部班级'],
		['作业', '作业优秀', 3, '', '字迹工整、正确率高'],
		['作业', '未交作业', -2, '', ''],
		['学习', '随堂小测加分', NO_POINTS_TEXT, '', '分值不固定，记分时再填写'],
	];
	const sheet = utils.aoa_to_sheet(data);
	sheet['!cols'] = [{ wch: 14 }, { wch: 24 }, { wch: 10 }, { wch: 22 }, { wch: 40 }];
	utils.book_append_sheet(workbook, sheet, RULE_EXCEL_SHEET);

	const help = utils.aoa_to_sheet([
		['规则 Excel 导入说明'],
		['列名', '填写说明'],
		['分组', `规则所属分组（最多两层：分组 → 规则）。留空归入「默认分组」；分组不存在时导入会自动创建。`],
		['规则名称', '必填。同一分组下同名的规则视为重复，导入时可按所选策略跳过 / 覆盖 / 新增。'],
		['积分值', `正数加分、负数减分。留空或填写「${NO_POINTS_TEXT}」表示无分值规则（记分时再指定分值）。`],
		['适用班级', '填写班级名称，多个用逗号、顿号分隔；留空表示所有班级通用。名称需与系统内班级名一致。'],
		['规则描述', '可选，用于说明规则的适用范围或注意事项。'],
	]);
	help['!cols'] = [{ wch: 14 }, { wch: 68 }];
	utils.book_append_sheet(workbook, help, '填写说明');
	return workbook;
};

/** 触发浏览器下载工作簿 */
export const downloadWorkbook = (workbook: ReturnType<typeof utils.book_new>, fileName: string) => {
	writeExcelFile(workbook, fileName);
};
