<template>
	<el-dialog v-model="dialogVisible" title="修改密码" width="400px" :close-on-click-modal="false">
		<el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="80px">
			<el-form-item label="旧密码" prop="oldPassword">
				<el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" show-password />
			</el-form-item>
			<el-form-item label="新密码" prop="newPassword">
				<el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
			</el-form-item>
			<el-form-item label="确认密码" prop="confirmPassword">
				<el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="dialogVisible = false">取消</el-button>
			<el-button type="primary" @click="handlePasswordChange">确认修改</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { ElMessage, FormInstance, FormRules } from 'element-plus';
import md5 from 'blueimp-md5'

interface Props {
	visible: boolean;
	currentPassword: string;
}

interface Emits {
	(e: 'update:visible', value: boolean): void;
	(e: 'password-changed', newPassword: string): void;
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dialogVisible = ref(false)
const passwordFormRef = ref<FormInstance>()
const passwordForm = reactive({
	oldPassword: '',
	newPassword: '',
	confirmPassword: ''
})

watch(() => props.visible, (newVal) => {
	dialogVisible.value = newVal
})

watch(dialogVisible, (newVal) => {
	emit('update:visible', newVal)
})

const validateOldPassword = (rule: any, value: any, callback: any) => {
	if (!value) {
		callback(new Error('请输入旧密码'))
	} else if (md5(value) !== props.currentPassword) {
		callback(new Error('旧密码不正确'))
	} else {
		callback()
	}
}

const validateNewPassword = (rule: any, value: any, callback: any) => {
	if (!value) {
		callback(new Error('请输入新密码'))
	} else if (value.length < 6) {
		callback(new Error('密码长度不能少于6位'))
	} else {
		callback()
	}
}

const validateConfirmPassword = (rule: any, value: any, callback: any) => {
	if (!value) {
		callback(new Error('请再次输入新密码'))
	} else if (value !== passwordForm.newPassword) {
		callback(new Error('两次输入的密码不一致'))
	} else {
		callback()
	}
}

const passwordRules: FormRules = {
	oldPassword: [{ validator: validateOldPassword, trigger: 'blur' }],
	newPassword: [{ validator: validateNewPassword, trigger: 'blur' }],
	confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
}

const handlePasswordChange = async () => {
	if (!passwordFormRef.value) return

	await passwordFormRef.value.validate((valid) => {
		if (valid) {
			emit('password-changed', passwordForm.newPassword)
			ElMessage.success('密码修改成功')
			dialogVisible.value = false
		}
	})
}
</script>
