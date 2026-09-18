# Supabase 云端库存实时核对系统

初始数据：1063 条。

## 部署步骤
1. Supabase Dashboard -> SQL Editor -> 执行 `01_schema.sql`
2. 执行 `02_seed_inventory.sql`
3. Dashboard -> Project Settings -> API，复制 Project URL 和 Publishable key（或 legacy anon key）
4. 确保根目录 `supabase.js` 中的 Project URL 和 Publishable key 正确；`03_库存核对.html` 与 `04_库存上传.html` 会共同引用该配置
5. 在 Supabase Authentication -> Users 中创建管理员账号；上传页只允许已登录用户覆盖库存数据。
6. 将 `03_库存核对.html` 和 `04_库存上传.html` 一起部署到静态托管平台（Vercel / Netlify / Cloudflare Pages 等）
7. 任何拿到核对页网址的人都能查看并提交实际数量；库存上传页需要管理员登录。

## 安全
- 前端只放 publishable/anon key，绝不放 service_role。
- 游客没有 inventory UPDATE 权限。
- 游客只能调用 `submit_actual_count()` 修改实际数量。
- 管理员通过 `04_库存上传.html` 登录后上传 Excel；页面只使用 Publishable/anon key，不使用 service_role。
- `inventory_audit` 用于记录实际数量变化。

## 你的开向数据
已将 `外开外左` 自动规范为 `外包外左`，`外开外右` 自动规范为 `外包外右`。
