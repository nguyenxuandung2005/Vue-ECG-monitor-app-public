# Quy tắc đặt tên thống nhất (ECG Monitor App)

## 1) Nguyên tắc chung

1. Dùng tiếng Anh cho tên code (file, biến, hàm, class, component).
2. Tên phải thể hiện mục đích nghiệp vụ, tránh viết tắt khó hiểu.
3. Một khái niệm dùng đúng một tên xuyên suốt codebase.

## 2) Quy tắc theo loại

1. Vue component: PascalCase.
   - Ví dụ: EcgMonitorModule.vue, AlertsModule.vue.
2. Composable: camelCase và tiền tố use.
   - Ví dụ: useEcgMonitor.js, useSessionRecorder.js.
3. Service/utility file: camelCase + hậu tố Service/Formatter khi cần.
   - Ví dụ: patientProfileService.js, timeFormatter.js.
4. Hàm: camelCase, động từ trước.
   - Ví dụ: startMonitoring(), stopMonitoring(), addSnapshot().
5. Biến reactive/ref: danh từ rõ nghĩa.
   - Ví dụ: heartRate, leadConnected, elapsedSeconds.
6. Constant: UPPER_SNAKE_CASE.
   - Ví dụ: SAMPLE_PERIOD_MS, WINDOW_SIZE.

## 3) Tên event và props trong component

1. Props: camelCase trong script, kebab-case khi bind ở template cha.
   - Script: heartRate
   - Template cha: :heart-rate
2. Events emit: kebab-case.
   - Ví dụ: toggle-lead, start, stop.

## 4) Tên module và cấu trúc thư mục

1. Module đặt theo domain nghiệp vụ.
   - ecg, alerts, patient, session
2. Không đặt module theo kiểu kỹ thuật chung chung.
   - Tránh: helpers1, common2, utils-final

## 5) Tên severity và trạng thái

1. Dùng enum string thống nhất.
   - severity: info | warning | critical
   - signalQuality: Standby | Good | Lead Off
2. Tránh dùng nhiều biến thể cho cùng ý nghĩa.
   - Không trộn: danger và critical cho cùng mức.

## 6) Quy tắc commit (khuyến nghị)

1. feat(ecg): add realtime waveform composable
2. feat(alerts): add threshold-based alert engine
3. refactor(session): split timer and formatter services
4. docs(architecture): add modular build guide

## 7) Checklist trước khi merge

1. Tên file/component đúng chuẩn theo mục 2.
2. Không có tên viết tắt mơ hồ.
3. Event/prop thống nhất camelCase-kebab-case.
4. Các hằng số ngưỡng/tần số được đưa về constant.
