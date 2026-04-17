# Hướng dẫn deploy ECG Monitor App lên Netlify

## 1) Mục tiêu

Tài liệu này chuẩn hóa cách deploy ứng dụng Vue 3 + Vite lên Netlify để tránh lỗi trang trắng (blank page) và đảm bảo mỗi lần deploy cho ra kết quả giống nhau.

## 2) Điều kiện trước khi deploy

1. Dự án có file netlify.toml ở thư mục gốc.
2. Dự án dùng pnpm (đã có pnpm-lock.yaml).
3. Build local chạy thành công bằng lệnh pnpm run build.
4. Vite cần Node >= 20.19; cấu hình hiện tại pin Node 22.

## 3) Cấu hình chuẩn đang dùng

Nội dung file netlify.toml:

```toml
[build]
  command = "pnpm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "22"
  VITE_BASE_PATH = "/"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Ý nghĩa:

1. command: dùng đúng lệnh build của dự án Vite.
2. publish: xuất bản thư mục dist do Vite tạo ra.
3. NODE_VERSION: ép môi trường Netlify dùng Node 22 tương thích Vite 8.
4. VITE_BASE_PATH: đảm bảo asset được build theo root path trên Netlify.
5. redirects: hỗ trợ SPA route, refresh/deep-link không bị 404.

## 4) Quy trình deploy qua Netlify UI

1. Vào Netlify, chọn Add new site > Import an existing project.
2. Kết nối Git provider (GitHub/GitLab/Bitbucket).
3. Chọn repository chứa Vue-ECG-monitor-app.
4. Ở bước Build settings, giữ mặc định hoặc để trống các ô command/publish để Netlify đọc từ netlify.toml.
5. Bấm Deploy site.

Lưu ý: Nếu có cấu hình Build command hoặc Publish directory trong UI khác với netlify.toml, ưu tiên đồng bộ theo netlify.toml để tránh sai lệch.

## 5) Kiểm tra sau deploy

1. Mở Deploy log, xác nhận có dòng dùng Node 22.
2. Xác nhận build command là pnpm run build.
3. Xác nhận publish thư mục dist.
4. Mở URL site và kiểm tra dashboard hiển thị bình thường.
5. Thử truy cập trực tiếp một route bất kỳ (deep link) và refresh trang để xác nhận không 404.

## 6) Xử lý sự cố thường gặp

1. Trang trắng ngay sau deploy:
   - Kiểm tra VITE_BASE_PATH có bằng / hay không.
   - Kiểm tra asset path trong dist/index.html có bắt đầu bằng /assets/... hay không.
2. Build fail do version Node:
   - Kiểm tra NODE_VERSION trong netlify.toml phải là 22.
3. Route con bị 404:
   - Kiểm tra block redirects trong netlify.toml.
4. Deploy dùng sai command hoặc sai thư mục publish:
   - Xóa cấu hình cũ trong Netlify UI hoặc đồng bộ lại theo netlify.toml.

## 7) Ghi chú tương thích GitHub Pages

Workflow GitHub Pages có thể set VITE_BASE_PATH riêng cho sub-path của Pages. Cấu hình này độc lập với Netlify, nên giữ nguyên workflow Pages hiện tại.
