# 小组积分的

## 基本信息管理

- 年级信息 - grade
  - id - id
  - 年级名称 - name
- 学生信息 - student
  - id - id
  - 姓名 - name
  - 年级id - grade_id
- 分组信息 - group
  - id - id
  - 分组名称 - name
  - 年级id - grade_id
- 学生分组关系表 - student_group
  - id - id
  - 学生id - student_id
  - 分组id - group_id
  - 年级id - grade_id
- 奖励信息 - prize
  - id - id
  - 奖励名称 - name
  - 奖励描述 - desc
  - 奖励图片 - image
  - 奖励数量 - quantity
  - 积分值 - points
  - 允许的年级id - allow_grades
- 规则信息 - rule
  - id - id
  - 规则名称 - name
  - 规则描述 - desc
  - 积分值 - points
  - 允许的年级id - allow_grades
- 积分记录 - record
  - id - id
  - 年级id - grade_id
  - 年级名称 - grade_name
  - 学生id - student_id
  - 学生姓名 - student_name
  - 规则id - rule_id
  - 规则名称 - rule_name
  - 积分值 - points
  - 记录时间 - time
- 基础信息 - basic
  - 积分步长 - step

## 记录

- 规则、奖品是共有的（也可以指定某个班级拥有）

## 剩余内容

- 奖品设置
  - 图片上传需要做压缩，支持裁剪、旋转图片
  - 奖品项目增删改（名称、库存、图片）
- 规则设置
  - 规则增删改（标题，说明，积分值，加减分标记）
- 学生管理
  - 批量新增、删除、调整积分、快速分组
- 分组管理
  - 积分加减、按照规则调整积分
  - 批量加减积分
- 竞价页面
  - 左边是奖品，右边是学生列表
- 全屏
- 随机点名
- 数据导出/导入
  - 班级纬度导出/导入（在添加班级面板）
  - 学生数据导入/导出（在学生管理面板）
