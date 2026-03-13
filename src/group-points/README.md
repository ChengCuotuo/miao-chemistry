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
  - 奖励描述 - description
  - 奖励图片 - image
  - 奖励数量 - quantity
  - 积分值 - points
  - 允许的年级id - allow_grades
- 规则信息 - rule
  - id - id
  - 规则名称 - name
  - 规则描述 - description
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

## 记录

- 规则、奖品是共有的（也可以指定某个班级拥有）
