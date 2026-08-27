# 防盗门预计出货查询系统 V2.0

Supabase 项目：
https://bszucvsimgijzhuvzcnt.supabase.co

## 1. 先执行数据库 SQL
打开 Supabase Dashboard → SQL Editor → New Query。
复制 `supabase-schema.sql` 全部内容执行。

## 2. 创建管理员
打开 Authentication → Users → Add user。
创建你的管理员邮箱和密码。
建议关闭公开注册，避免任何人自行注册。

## 3. 使用
- 打开 admin.html
- 使用管理员账号登录
- 在“当前仓库”选择仓库一或仓库二；上传只覆盖当前选中的仓库
- 上传《未入库.xlsx》
- 系统读取第一个工作表
- 自动拆分左、右
- 未入库 = 原数量 - 已入库数量
- 生产编号如 8-12-3 → 识别 8月12日；普通门增加 8 天，子母门增加 10 天作为预计出货日期
- 上传完成后，index.html 选择相同仓库即可读取对应数据；两个仓库的数据相互独立

## 重要安全说明
项目使用的是 Publishable Key，适合放在浏览器端，但安全性依赖 RLS 策略。
不要把 Secret Key / service_role Key 放入任何前端文件。

## 本地测试
建议使用 VS Code 的 Live Server 或任何静态网站服务器打开，而不是直接双击 file://。
