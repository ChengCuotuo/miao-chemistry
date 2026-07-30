<template>
  <div class="lock-container">
    <div class="lock-content">
      <div class="lock-icon">
        <el-icon :size="80" color="#f56c6c">
          <Lock />
        </el-icon>
      </div>
      <h1 class="lock-title">试用期已结束</h1>
      <p class="lock-description">感谢您的使用！您的试用期已到期，如需继续使用，请联系客服购买正式版本。</p>
      
      <div class="contact-info">
        <el-divider content-position="left">联系客服</el-divider>
        <div class="contact-item">
          <el-icon :size="20" color="#409eff">
            <Message />
          </el-icon>
          <span class="contact-label">邮箱：</span>
          <span class="contact-value">lei021191@163.com</span>
        </div>
        <!-- <div class="contact-item">
          <el-icon :size="20" color="#ff6b6b">
            <ChatDotRound />
          </el-icon>
          <span class="contact-label">小红书：</span>
          <span class="contact-value">232875531</span>
        </div> -->
        <div class="contact-item">
          <el-icon :size="20" color="#12b7f5">
            <ChatLineRound />
          </el-icon>
          <span class="contact-label">QQ：</span>
          <span class="contact-value">1433893622</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lock, Message, ChatDotRound, ChatLineRound } from '@element-plus/icons-vue'

</script>

<style scoped>
.lock-container {
  width: calc(100% - 40px);
  height: calc(100% - 40px);
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.lock-content {
  background: white;
  border-radius: 16px;
  padding: 20px;
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.lock-icon {
  margin-bottom: 24px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.lock-title {
  font-size: 28px;
  color: #303133;
  margin: 0 0 16px 0;
  font-weight: 600;
}

.lock-description {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 32px 0;
}

.contact-info {
  text-align: left;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin: 8px 0;
  background: #f5f7fa;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.contact-item:hover {
  background: #e6f7ff;
  transform: translateX(4px);
}

.contact-item .el-icon {
  margin-right: 12px;
}

.contact-label {
  font-weight: 500;
  color: #303133;
  margin-right: 8px;
}

.contact-value {
  color: #409eff;
  font-weight: 500;
  word-break: break-all;
}

.lock-footer {
  margin-top: 24px;
}
</style>