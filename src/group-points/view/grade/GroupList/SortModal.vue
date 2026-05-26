<template>
	<el-dialog title="调整排序" v-model="visible" width="500px" :before-close="handleClose">
		<el-space>
			<el-radio-group v-model="orderByPoints">
				<el-radio label="1" :value="1">根据总积分排序</el-radio>
				<el-radio label="0" :value="0">自定义排序</el-radio>
			</el-radio-group>
		</el-space>
		<div v-if="orderByPoints === 0">
			<draggable
        class="list-group"
        item-key="order"
        tag="ul"
        v-model="groupList"
        v-bind="dragOptions"
        @start="isDragging = true"
        @end="isDragging = false"
      >
        <template #item="{ element }">
          <li class="list-group-item">
            <i
              :class="
                element.fixed ? 'fa fa-anchor' : 'glyphicon glyphicon-pushpin'
              "
              @click="element.fixed = !element.fixed"
              aria-hidden="true"
            ></i>
            {{ element.name }}
          </li>
        </template>
      </draggable>
		</div>
		<template #footer>
			<el-button @click="handleClose">取消</el-button>
			<el-button type="primary" @click="handleSubmit">确定</el-button>
		</template>
	</el-dialog>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { computed, ref, watch } from 'vue';
import { GroupInfo } from './index.vue';

const props = defineProps<{
	visible: boolean;
	defaultOrderByPoints: number;
	defaultGroupList: Array<GroupInfo>;
}>();

const emit = defineEmits<{
	(e: 'update:visible', value: boolean): void;
	(e: 'confirm', params: {orderByPoints: number, groupList: string[]}): void;
}>();

const visible = computed({
	get: () => props.visible,
	set: (value) => emit('update:visible', value)
});

const isDragging = ref(false)
const orderByPoints = ref(props.defaultOrderByPoints);

// 确保 groupList 始终是有效的数组，避免 vuedraggable 初始化报错
const groupList = ref<Array<GroupInfo>>([...(props.defaultGroupList || [])]);

// 监听 visible 变化，当弹窗打开时同步最新数据
watch(() => props.visible, (newVal) => {
  if (newVal) {
    // 弹窗打开时，同步最新的小组列表和排序方式
    orderByPoints.value = props.defaultOrderByPoints;
    groupList.value = [...(props.defaultGroupList || [])];
  }
});

const dragOptions = ref({
	animation: 200,
	group: "description",
	disabled: false,
	ghostClass: "ghost"
})

const handleClose = () => {
	visible.value = false;
	// 重置数据，避免下次打开时使用旧数据
	groupList.value = [...(props.defaultGroupList || [])];
};

const handleSubmit = () => {
	emit('confirm', {orderByPoints: orderByPoints.value, groupList: groupList.value.map(group => group.id)});
	visible.value = false;
};
</script>
<style scoped>
.list-group {
  min-height: 100px;
  padding: 8px;
  border-radius: 8px;
  background-color: #f8f9fa;
}

.list-group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  background-color: #fff;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: move;
  transition: all 0.2s ease;
}

.list-group-item:hover {
  background-color: #f5f5f5;
  border-color: #d0d7de;
  transform: translateX(4px);
}

.list-group-item i {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  cursor: pointer;
  color: #6c757d;
  transition: color 0.2s ease;
}

.list-group-item i:hover {
  color: #409eff;
}

/* 拖拽中的样式 */
.list-group-item.dragging {
  opacity: 0.6;
  background-color: #e8f4fd;
  border-color: #409eff;
}

/* ghost 样式 - 拖拽时显示的占位符 */
.ghost {
  opacity: 0.4;
  background-color: #409eff !important;
  border-style: dashed;
}

/* 拖拽手柄图标 */
.list-group-item::before {
  content: '⋮⋮';
  font-size: 16px;
  color: #adb5bd;
  margin-right: 8px;
  cursor: grab;
}

.list-group-item:active::before {
  cursor: grabbing;
}
</style>