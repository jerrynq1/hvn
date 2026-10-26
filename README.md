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
- `js/orderflow-absorption.js`: Heavy Absorption (tính ngưỡng + vẽ marker); khai báo thông số ở cuối `js/indicators-custom.js` (`IND.hab`)
- `js/orderflow-dom.js`: DOM / MBO (kênh depth cTrader, bảng bên phải + histogram thanh khoản ở mép phải chart); khai báo thông số ở cuối `js/indicators-custom.js` (`IND.dom`)
- `js/hvn-profile.js`: HVN Profile (tính cụm HVN + vẽ canvas); khai báo thông số ở cuối `js/indicators-custom.js` (`IND.hvn`)
- `js/drawings-*.js`, `js/mobile.js`: công cụ vẽ và cử chỉ cảm ứng
- `tests/`: `node tests/footprint.test.js`, `node tests/customtf.test.js`, `node tests/hvn.test.js`, `node tests/hab.test.js`, `node tests/dom.test.js`

## HVN Profile (v2)

Thêm ở mục **Indicator** → **HVN Profile** (nhóm Orderflow). Chia lịch sử thành các chu kỳ (1 phút … Tuần), dựng volume profile từng chu kỳ, tìm node volume dày (HVN) kèm POC, rồi kéo vùng sang phải đến khi giá dùng hết vùng. Đây là bản tự viết lại theo mô tả công khai của HVN Profile (ProfitPro, ATAS), không phải mã gốc.

- **Volume**: tick thật nếu đã tải (bật Footprint/Big Trade/Statistic), không thì ước lượng theo đường đi của giá trong nến M1.
- **Nhận diện**: "Đỉnh nổi bật" (mặc định) tìm cực đại cục bộ, lọc theo độ nổi bật, tách node kề nhau ở thung lũng; "Theo ngưỡng" là cách cũ.
- **Chất lượng**: mỗi vùng có % volume và độ mạnh (vùng mạnh đậm hơn); lọc vùng yếu và chu kỳ volume thấp bất thường.
- **Chạm vùng**: chạm mép / chạm POC / nến đóng cửa vào-vượt vùng; giá nhảy qua vùng (gap) cũng tính; phân loại giữ/phá; vùng dưới giá là hỗ trợ, trên giá là kháng cự; đếm vùng chồng nhau (×N).

## Heavy Absorption v2 (kết hợp HVN Profile)

Thêm ở mục **Indicator** → **Heavy Absorption** (nhóm Orderflow). Tự viết lại theo mô tả công khai của Heavy Absorption (ProfitPro, ATAS), không phải mã gốc. Nếu đã thêm bản v1, hãy xoá và thêm lại để nhận mặc định mới.

**Phát hiện**
- Print = volume Ask (mua) hoặc Bid (bán) tại một hàng giá trong một nến. Ngưỡng thích nghi tính từ mọi print trong `Lookback` nến, theo hai cách: *trung bình + k·độ lệch chuẩn* (như bản gốc) hoặc *theo log volume* (ổn định hơn vì volume từng mức giá có đuôi dài).
- Độ nhạy: Thấp / Vừa / Cao hoặc tự đặt hệ số k. Mặc định loại nến đang xét khỏi thống kê để print lớn của chính nó không tự nâng ngưỡng.
- Nến thiếu tick (độ phủ dưới 60%) bị loại khỏi thống kê và không có marker; cửa sổ phải đủ số print tối thiểu. Có lọc volume tối thiểu và tỉ trọng print trong nến. Bước giá có thể để tự động.

**Hấp thụ thật**
- Chỉ có lệnh lớn thì chưa đủ, giá còn phải bị chặn: phía mua bị hấp thụ khi đỉnh nến không vượt mép trên cụm quá dung sai, phía bán ở mép dưới (có chế độ chặt hơn yêu cầu đóng cửa phía bị chặn). Cụm mà giá chạy xuyên ngay trong nến bị loại.
- Các print đủ ngưỡng ở hàng kề nhau gộp thành cụm; marker đặt tại print lớn nhất, volume là tổng cụm.
- Theo dõi K nến sau marker: giữ được thì **xác nhận** (viền đậm), đang chờ thì vòng đứt nét, đóng cửa (hoặc râu) vượt mức thì **thất bại** (mờ đi). Mức hấp thụ được kẻ sang phải đến khi bị phá.
- Lưu ý: ẩn thất bại hoặc chỉ hiện xác nhận làm marker xuất hiện/biến mất sau vài nến vì trạng thái chỉ biết khi nến sau đã đóng. Marker nến đang chạy cũng có thể đổi theo từng tick.

**Kết hợp HVN Profile** (bật cả hai indicator)
- Đối chiếu theo thời gian: marker trong vùng HVN còn hiệu lực (nến chạm vùng vẫn tính) được viền nổi bật, có nhãn vai trò vùng (R kháng cự khi giá tới từ dưới, S hỗ trợ khi từ trên) và POC.
- Viền liền = đúng vai trò (mua bị hấp thụ tại kháng cự, bán bị hấp thụ tại hỗ trợ), viền đứt = ngược vai trò. Có chế độ chỉ hiện marker trong vùng hoặc chỉ hiện marker đúng vai trò.

**Hiển thị / cảnh báo**: cỡ vòng theo số lần ngưỡng (không đổi khi cuộn) hoặc theo marker lớn nhất đang thấy; chữ là volume, điểm σ hoặc cả hai; cảnh báo khi nến có marker đóng hoặc khi marker được xác nhận.

**Dữ liệu**: dùng tick (footprint) nên tự tải tick khi bật (3 ngày gần nhất). Với CFD là số ước lượng từ chuỗi báo giá bid/ask. Cần khung từ M1 trở lên. Không phải tín hiệu mua/bán độc lập.

## DOM / MBO

Thêm ở mục **Indicator** → **DOM / MBO** (nhóm Orderflow). Đăng ký kênh depth của cTrader Open API (`SubscribeDepthQuotes` 2156, nhận `DepthEvent` 2155, huỷ bằng 2158) cho mã đang xem; mỗi báo giá trong sổ có ID riêng nên giữ được từng lệnh (MBO).

- **Bảng DOM bên phải chart**: Bid | Giá | Ask | VP. Hàng chứa best bid / best ask được tô, ×N là số lệnh riêng lẻ ở mức đó, ô nháy khi size tăng (màu Bid) hoặc giảm (màu Ask) trong 1,2 giây gần nhất. Cuộn bằng bánh xe, nhấp đúp để căn giữa lại. Cột VP là volume đã khớp theo giá (từ tick footprint, nên bật nó sẽ tự tải tick).
- **Histogram thanh khoản ở mép phải vùng vẽ**: thanh ngang thẳng hàng với trục giá, đỏ là Ask, xanh là Bid, mỗi lệnh là một đoạn riêng (MBO). Mức có size vượt trung bình + k·độ lệch chuẩn của cả sổ được viền nổi, ghi nhãn "size @ giá" và kẻ đường ngang sang trái.
- **Đơn vị**: lot = size / lotSize của mã (size cTrader tính theo 1/100 đơn vị). Có thể đổi sang đơn vị hợp đồng hoặc số thô.
- **Heatmap lịch sử (tuỳ chọn, mặc định tắt)**: chụp sổ lệnh mỗi giây, tô nền chart theo size từng mức giá theo thời gian (đậm = dày; xanh Bid, đỏ Ask), kiểu Bookmap. Giữ 2–240 phút gần nhất trong bộ nhớ, đổi mã hoặc đổi mức gộp giá thì xoá lịch sử.

Giới hạn: với forex/CFD đây là thanh khoản tổng hợp do broker báo, không phải sổ lệnh tập trung như CME; giảm size không phân biệt được rút lệnh hay bị khớp; không có lịch sử depth từ trước (heatmap chỉ có từ lúc bật indicator và mất khi tải lại trang). Một số broker không bật depth, khi đó bảng báo lỗi đăng ký.

## Bar Replay (manual backtesting)

The chart view includes a Replay button and a Bar Replay panel. Replay uses the historical candles already loaded into the chart and provides play/pause, one-bar back/forward, jump to first/last loaded bar, playback speed, a draggable timeline, date/time jump, and click-on-chart selection. While replay is active, the main candlestick/volume chart and indicator calculations are limited to candles up to the selected replay index to reduce future-bar leakage. The browser continues receiving live data in the background; exit Replay to return to the latest chart. Historical range is limited to data actually loaded from cTrader, so connect cTrader and load/scroll historical candles before selecting an older period.
