; electron-builder 的 NSIS 自定义脚本（由 electron-builder.yml 的 nsis.include 引入）
;
; 说明：electron-builder 支持一批可选钩子宏，未定义时走它自己的默认实现，
; 定义了就按我们的来。可用的有 customInit / customInstall / customUnInstall /
; customRemoveFiles / customHeader / customCheckAppRunning 等。
;
; 本文件只做一件事：把上一个版本（Squirrel.Windows 安装的）留下的残留清掉。
; 新旧安装器互不知情 —— 旧版在 %LOCALAPPDATA%\student-score-system 与
; 注册表 HKCU\...\Uninstall\student-score-system 都留了记录，不清掉会出现
; 「控制面板两条卸载项 + 磁盘两份程序」。
;
; 两个钩子的执行时机（来自 electron-builder 模板 installSection.nsh 的顺序）：
;   customInit      → .onInit 里，早于任何文件写入
;   customInstall   → 文件落盘、快捷方式创建之后
; 所以「删快捷方式」放在 customInit（此时桌面上只有旧版的），
; 「删程序目录 / 删注册表项」放在 customInstall（此时 electron-builder 已经
; 帮我们把运行中的旧版进程关掉了，目录才删得干净）。
;
; 所有清理都是 best-effort：删不掉不会中断安装（NSIS 的 RMDir / Delete 失败
; 只设置错误标志，不终止安装），最坏情况是留下一个可手动删除的残留目录。

!macro customInit
  ; 清掉旧版留在桌面与开始菜单的快捷方式（Squirrel 的命名可能带版本后缀，用通配）
  ; 放在这里是因为此刻我们自己的快捷方式还没创建，不会误删
  FindFirst $0 $1 "$DESKTOP\Miao积分管理*.lnk"
  loopOldDesktopLink:
    StrCmp $1 "" doneOldDesktopLink
    Delete "$DESKTOP\$1"
    FindNext $0 $1
    Goto loopOldDesktopLink
  doneOldDesktopLink:
  FindClose $0

  FindFirst $0 $1 "$SMPROGRAMS\Miao积分管理*.lnk"
  loopOldStartMenuLink:
    StrCmp $1 "" doneOldStartMenuLink
    Delete "$SMPROGRAMS\$1"
    FindNext $0 $1
    Goto loopOldStartMenuLink
  doneOldStartMenuLink:
  FindClose $0
!macroend

!macro customInstall
  ; 删除旧 Squirrel 安装目录（含 app-1.0.0 / app-2.0.1 等多个历史版本目录）
  RMDir /r "$LOCALAPPDATA\student-score-system"
  ; 删除旧版留下的卸载项
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\student-score-system"
!macroend
