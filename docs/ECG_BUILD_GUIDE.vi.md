# Hướng dẫn từng bước xây dựng ECG Monitor App (Vue 3)

## 1) Xác định phạm vi chức năng

Tối thiểu nên có 4 module nghiệp vụ tách biệt:

1. Monitor: hiển thị sóng ECG realtime, trạng thái lead, BPM.
2. Alerts: cảnh báo nhịp tim thấp/cao hoặc mất kết nối lead.
3. Patient: thông tin bệnh nhân đang theo dõi.
4. Session: ghi phiên theo dõi, lưu snapshot nhanh theo thời gian.

## 2) Thống nhất kiến trúc thư mục

Sử dụng mô hình feature-first để code mỗi chức năng ở module riêng:

- src/modules/ecg
- src/modules/alerts
- src/modules/patient
- src/modules/session

Trong mỗi module ưu tiên tách:

- components: giao diện
- composables: state + logic tương tác
- services: xử lý dữ liệu/adapter/formatter

## 3) Tạo module Monitor (ECG realtime)

1. Tạo service sinh mẫu sóng ECG: src/modules/ecg/services/ecgSignalGenerator.js.
2. Tạo composable điều khiển luồng dữ liệu: src/modules/ecg/composables/useEcgMonitor.js.
3. Tạo UI hiển thị chart + nút Start/Stop + lead connection: src/modules/ecg/components/EcgMonitorModule.vue.

Mục tiêu ở bước này: mô phỏng ECG liên tục với cửa sổ dữ liệu trượt (sliding window), để UI luôn có waveform mới.

## 4) Tạo module Alerts

1. Tạo composable useAlerts.js nhận trạng thái từ monitor (heartRate, leadConnected, isRunning).
2. Định nghĩa thresholds mặc định (ví dụ min 55, max 120).
3. Mapping thành danh sách cảnh báo có severity: info, warning, critical.
4. Tạo component AlertsModule.vue để render cảnh báo.

Mục tiêu: module alert chỉ quan tâm luật cảnh báo, không phụ thuộc chi tiết chart.

## 5) Tạo module Patient

1. Tạo service patientProfileService.js trả dữ liệu bệnh nhân mặc định hoặc mock API.
2. Tạo PatientModule.vue chỉ hiển thị thông tin bệnh nhân.

Mục tiêu: có thể thay nguồn dữ liệu patient (Firebase/REST) mà không sửa UI monitor.

## 6) Tạo module Session Recorder

1. Tạo composable useSessionRecorder.js (start/stop/reset timer, thêm snapshot).
2. Tạo service timeFormatter.js cho format thời gian.
3. Tạo SessionModule.vue để thao tác ghi phiên.

Mục tiêu: tách logic ghi session khỏi module monitor.

## 7) Ghép module ở App.vue

App.vue chỉ làm composition root:

1. Khởi tạo composables của từng module.
2. Truyền props/event giữa module với nhau.
3. Khai báo form cấu hình threshold và gọi updateThresholds().

Lưu ý: App.vue không nên chứa thuật toán sinh sóng ECG.

## 8) Chuẩn bị Firebase cho mở rộng dữ liệu thật

1. Chuẩn hóa file src/firebase.js để export firebaseApp và firebaseConfig.
2. Ở bước sau có thể thêm Firestore để lưu:
   - snapshots,
   - alert logs,
   - lịch sử phiên monitor.

## 9) Kiểm thử và chạy ứng dụng

1. Cài dependencies: pnpm install.
2. Chạy local: pnpm dev.
3. Build production: pnpm build.
4. Kiểm tra các kịch bản chính:
   - Start/Stop monitor.
   - Disconnect/Reconnect lead.
   - Cảnh báo low/high BPM.
   - Start/Stop session và snapshot.

## 10) Lộ trình nâng cấp

1. Kết nối thiết bị ECG thật qua Web Bluetooth hoặc MQTT gateway.
2. Thay dữ liệu mô phỏng bằng stream realtime từ backend.
3. Áp dụng auth + phân quyền (doctor/nurse/admin).
4. Lưu lịch sử và xuất báo cáo PDF/CSV.
5. Viết unit test cho composables và component test cho module chính.
