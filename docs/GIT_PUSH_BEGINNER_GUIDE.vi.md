# Hướng dẫn tạo repository và push code cho beginner

## 1) Mục tiêu

Tài liệu này giúp người mới làm được 2 việc:

1. Tạo repository mới trên GitHub.
2. Push project local lên GitHub bằng:
   - Git CLI (thủ công, chọn file/folder để add)
   - GitHub Desktop (giao diện)

## 2) Chuẩn bị trước khi bắt đầu

1. Cài Git: https://git-scm.com/downloads
2. Có tài khoản GitHub.
3. Mở terminal tại thư mục project.
4. Kiểm tra đã có `.gitignore` và không commit `.env`.

## 3) Cách A - Git CLI (thủ công, chi tiết)

### Bước 1: Tạo repository mới trên GitHub

1. Vào GitHub, bấm New repository.
2. Nhập tên repository.
3. Chọn Public hoặc Private.
4. Khuyến nghị để trống phần khởi tạo (khong tick README/.gitignore/LICENSE) để tránh xung đột lần push đầu.
5. Bấm Create repository.
6. Copy URL repository (HTTPS hoặc SSH), ví dụ:
   - `https://github.com/your-username/your-repo.git`

### Bước 2: Khởi tạo Git tại project local (nếu chưa có)

```bash
git init
git branch -M main
```

Neu project da co Git roi thi bo qua buoc nay.

### Bước 3: Kiểm tra thay đổi

```bash
git status
```

Y nghia nhanh:

1. `??` la file chua duoc track.
2. `M` la file da sua.

### Bước 4: Add file/folder theo cách thủ công

Chi add tung file cu the:

```bash
git add src/App.vue
git add docs/GIT_PUSH_BEGINNER_GUIDE.vi.md
```

Chi add mot folder cu the:

```bash
git add src/modules/
```

Add nhieu muc trong 1 lenh:

```bash
git add src/App.vue docs/
```

Add tat ca (chi dung khi chac chan):

```bash
git add .
```

Neu add nham file, bo file ra khoi staging:

```bash
git restore --staged duong-dan-file
```

### Bước 5: Commit

```bash
git commit -m "feat: update ECG monitor UI"
```

### Bước 6: Gắn remote

```bash
git remote add origin https://github.com/your-username/your-repo.git
```

Neu da ton tai origin:

```bash
git remote remove origin
git remote add origin https://github.com/your-username/your-repo.git
```

### Bước 7: Push lần đầu

```bash
git push -u origin main
```

Sau lan dau, cac lan sau chi can:

```bash
git push
```

## 4) Cách B - GitHub Desktop (GUI)

### Bước 1: Cài và đăng nhập

1. Cài GitHub Desktop: https://desktop.github.com/
2. Đăng nhập tài khoản GitHub.

### Bước 2: Thêm project local vào GitHub Desktop

1. Chọn File > Add local repository.
2. Chọn đúng folder project.
3. Nếu project chưa có Git, Desktop sẽ cho khởi tạo repository.

### Bước 3: Chọn file để add (stage)

1. Mở tab Changes.
2. Tick file muốn đưa vào commit.
3. Có thể bỏ tick file nhạy cảm hoặc file chưa sẵn sàng.

### Bước 4: Commit

1. Điền Summary (bat buoc), ví dụ: `docs: add push guide for beginners`.
2. Bấm Commit to main (hoặc commit vào branch hiện tại).

### Bước 5: Publish/Push

1. Nếu chưa có remote: bấm Publish repository.
2. Chọn tên repo, Public/Private.
3. Bấm Publish repository.
4. Các lần sau chỉ cần bấm Push origin.

## 5) Lưu ý quan trọng cho beginner

1. Luon xem `git status` truoc commit.
2. Uu tien `git add` tung file/folder thay vi `git add .`.
3. Khong commit `.env`, key API, token, file chua thong tin nhay cam.
4. Viet commit message ngan gon, ro nghia (feat/fix/docs/chore).
5. Truoc khi push, neu lam viec nhom, nen pull/rebase truoc de tranh conflict.

Lenh goi y:

```bash
git pull --rebase origin main
git push
```

## 6) Lỗi thường gặp và cách xử lý

1. `remote origin already exists`
   - Dung `git remote remove origin` roi add lai remote moi.
2. `rejected non-fast-forward`
   - Dung `git pull --rebase origin main` roi push lai.
3. Push bi yeu cau dang nhap
   - Dung GitHub login hop le (hoac PAT neu dung HTTPS).
4. Lo commit file nhay cam
   - Rotate key ngay, xoa key khoi code, chuyen sang `.env`, commit lai ban sach.

## 7) Checklist 30 giây trước khi push

1. Da dung dung branch chua?
2. `git status` co file nao la khong mong muon khong?
3. Co file nhay cam nao bi stage khong?
4. Commit message da ro nghia chua?
5. Da pull/rebase moi nhat chua (neu lam viec nhom)?
