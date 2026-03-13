// - 奖品设置 - prize
//   - id - id
//   - 奖品名称 - name
//   - 奖品描述 - description
//   - 奖品图片 - image
//   - 奖品数量 - quantity
//   - 积分值 - points

export class Prize {
	id: string;
	name: string;
	description: string;
	points: number;
	image: string;
	quantity: number;
	allow_grades: string[];

	constructor(params: { id: string, name: string, description: string, points: number, image: string, quantity: number, allow_grades: string[] }) {
		this.id = params.id;
		this.name = params.name;
		this.description = params.description;
		this.points = params.points;
		this.image = params.image;
		this.quantity = params.quantity;
		this.allow_grades = params.allow_grades;
	}

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			description: this.description,
			points: this.points,
			image: this.image,
			quantity: this.quantity,
			allow_grades: this.allow_grades,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}