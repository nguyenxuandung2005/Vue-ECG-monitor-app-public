# Hướng dẫn cập nhật Firebase API (an toàn)

## 1) Mục tiêu

Tài liệu này hướng dẫn cập nhật Firebase config cho dự án mà không lộ thông tin nhạy cảm lên Git.

## 2) Nguyên tắc bắt buộc

1. Không sửa key trực tiếp trong source code.
2. Chỉ cập nhật giá trị trong file `.env` (local hoặc CI/CD secret).
3. Không commit file `.env` lên repository.

## 3) Các biến cần cập nhật

Dự án đang dùng các biến sau:

1. `VITE_FIREBASE_API_KEY`
2. `VITE_FIREBASE_AUTH_DOMAIN`
3. `VITE_FIREBASE_PROJECT_ID`
4. `VITE_FIREBASE_STORAGE_BUCKET`
5. `VITE_FIREBASE_MESSAGING_SENDER_ID`
6. `VITE_FIREBASE_APP_ID`
7. `VITE_BASE_PATH` (thường là `/` khi deploy Netlify)

## 4) Quy trình cập nhật cho môi trường local

1. Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Trên PowerShell có thể dùng:

```powershell
Copy-Item .env.example .env
```

2. Mở `.env` và thay toàn bộ giá trị placeholder bằng thông tin Firebase thật.
3. Lưu file, chạy lại ứng dụng:

```bash
pnpm dev
```

4. Kiểm tra app chạy bình thường (không lỗi thiếu biến môi trường).

## 5) Quy trình cập nhật cho Netlify

1. Vào Site settings > Environment variables.
2. Tạo/cập nhật từng biến `VITE_FIREBASE_*` giống local `.env`.
3. Đảm bảo `VITE_BASE_PATH` là `/` cho deploy Netlify.
4. Trigger deploy lại (Redeploy site).

## 6) Cách kiểm tra sau khi cập nhật

1. Build local thành công:

```bash
pnpm build
```

2. Mở site đã deploy, kiểm tra:
   - Dữ liệu Firebase đọc/ghi được.
   - Không có lỗi `Missing required environment variable` trong console.

## 7) Checklist bảo mật

1. Không chia sẻ ảnh chụp chứa giá trị key thật.
2. Không paste key thật vào issue/chat công khai.
3. Nếu nghi ngờ lộ key: rotate key trên Firebase và cập nhật lại `.env` + Netlify env vars.
