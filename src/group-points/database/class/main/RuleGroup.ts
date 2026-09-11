// - 规则分组 - ruleGroup
//   规则设置模块树形结构的第一层（最多两层：分组 → 规则）
//   - id - id
//   - 分组名称 - name
//   - 排序 - order

export class RuleGroup {
	id: string;
	name: string;
	order: number;

	constructor(params: { id: string, name: string, order?: number }) {
		this.id = params.id;
		this.name = params.name;
		this.order = params.order ?? 0;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			order: this.order,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
