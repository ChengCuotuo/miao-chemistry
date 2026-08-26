// - 班委账号 - monitor account
//   - id - id（自增序号）
//   - 账号名 - name
//   - 密码 - password（md5 存储）

export class MonitorAccount {
	id: string;
	name: string;
	password: string;

	constructor(params: { id: string, name: string, password: string }) {
		this.id = params.id;
		this.name = params.name;
		this.password = params.password;
	}
	toJSON() {
		return {
			id: this.id,
			name: this.name,
			password: this.password,
		}
	}

	toString() {
		return JSON.stringify(this.toJSON());
	}
}
