# Indicator Lab

Bản rút gọn của signal-bridge chỉ giữ **chart**, **indicator** (kể cả Orderflow: Footprint, Big Trade, Statistic) và **kết nối cTrader Open API**. Không còn đăng nhập Discord, Journal, TPO, Lịch kinh tế, nhiều chart, đa ngôn ngữ hay worker.

## Chạy

Mở `index.html` trực tiếp, hoặc phục vụ qua một web server tĩnh cho tiện:

    python3 -m http.server 8000      # rồi mở http://localhost:8000

Cần Internet để tải thư viện lightweight-charts (CDN) và font.

## Kết nối cTrader

Vào mục **Kết nối**, nhập Client ID, Client Secret, Access Token (tuỳ chọn: Account ID, môi trường) rồi bấm **Lưu & kết nối**. Trình duyệt nối thẳng tới `wss://live|demo.ctraderapi.com:5036`, tự chọn máy chủ live/demo theo tài khoản của token. Key lưu trong `localStorage` (khoá `ct_cfg`) của trình duyệt này.

> Client Secret và Access Token nằm trong trình duyệt nên bản này chỉ dùng để test ở máy cá nhân, đừng đưa lên hosting công khai.

## Thêm indicator mới

Sửa `js/indicators-custom.js` (đã có sẵn một mẫu `IND.mine` và hướng dẫn cấu trúc ở đầu file), tải lại trang rồi thêm indicator ở mục **Indicator**. Các indicator có sẵn nằm ở `js/indicators-defs.js`, phần vẽ/tính toán ở `js/indicators-engine.js`.

## Cấu trúc

- `js/ctrader.js`: kết nối, đăng nhập, nến M1, tick, footprint
- `js/chart.js`, `js/candle-style.js`, `js/timezone.js`, `js/symbols.js`: chart, màu nến, múi giờ, chọn mã
- `js/indicators-*.js`, `js/volume-profile.js`, `js/orderflow-*.js`: indicator
- `js/hvn-profile.js`: HVN Profile (tính cụm HVN + vẽ canvas); khai báo thông số ở cuối `js/indicators-custom.js` (`IND.hvn`)
- `js/drawings-*.js`, `js/mobile.js`: công cụ vẽ và cử chỉ cảm ứng
- `tests/`: `node tests/footprint.test.js`, `node tests/customtf.test.js`, `node tests/hvn.test.js`

## HVN Profile (v2)

Thêm ở mục **Indicator** → **HVN Profile** (nhóm Orderflow). Chia lịch sử thành các chu kỳ (1 phút … Tuần), dựng volume profile từng chu kỳ, tìm node volume dày (HVN) kèm POC, rồi kéo vùng sang phải đến khi giá dùng hết vùng. Đây là bản tự viết lại theo mô tả công khai của HVN Profile (ProfitPro, ATAS), không phải mã gốc.

- **Volume**: tick thật nếu đã tải (bật Footprint/Big Trade/Statistic), không thì ước lượng theo đường đi của giá trong nến M1.
- **Nhận diện**: "Đỉnh nổi bật" (mặc định) tìm cực đại cục bộ, lọc theo độ nổi bật, tách node kề nhau ở thung lũng; "Theo ngưỡng" là cách cũ.
- **Chất lượng**: mỗi vùng có % volume và độ mạnh (vùng mạnh đậm hơn); lọc vùng yếu và chu kỳ volume thấp bất thường.
- **Chạm vùng**: chạm mép / chạm POC / nến đóng cửa vào-vượt vùng; giá nhảy qua vùng (gap) cũng tính; phân loại giữ/phá; vùng dưới giá là hỗ trợ, trên giá là kháng cự; đếm vùng chồng nhau (×N).
