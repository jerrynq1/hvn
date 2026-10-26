/* ================= INDICATOR CỦA BẠN (chỗ để thử indicator mới) =================
   File này nạp SAU indicators-defs.js và TRƯỚC indicators-engine.js, nên chỉ cần gán thêm vào IND là indicator xuất hiện trong mục "Indicator" (Kho indicator).
   Sửa file rồi tải lại trang (Ctrl+F5) là thấy.

   Cấu trúc một indicator (xem thêm các indicator có sẵn trong indicators-defs.js):
     key:{
       n:"Tên hiển thị",  t:"ov" (vẽ đè lên nến) | "osc" (có pane riêng bên dưới),  d:"Mô tả ngắn",
       p:[[khóa,nhãn,mặc định,kiểu, {min,max,step,o,...}], ...]   kiểu: "n" số | "i" số nguyên | "s" chọn (o:[...]) | "b" bật/tắt
       c:[màu mặc định, ...]   L:[tên từng ô màu, ...]   ("@up"/"@dn" = theo màu nến tăng/giảm)
       hl:[{y:0,al:.5}]        đường ngang tham chiếu (tuỳ chọn)
       f:(A,p,E)=>[series]     tính toán: trả về mảng series
     }
   A = dữ liệu nến đã gom theo khung giờ đang xem: A.t thời gian hiển thị, A.s giờ server (giây), A.o/A.h/A.l/A.c giá, A.v khối lượng (mỗi mảng cùng độ dài).
   p = giá trị thông số hiện tại. Phần tử chưa đủ dữ liệu trả null.
   series: {k:"l", d:[...], ci:0}  đường (ci = chỉ số ô màu trong c)
           {k:"h", d:[...], ci}    cột histogram
           {k:"f", d:[{top,bottom}|null,...], ci, al:.1}  vùng tô giữa 2 đường
   Hàm tiện ích dùng được ngay: sma, ema, rma, wma, sdv (độ lệch chuẩn), trg (true range), rsiOf, srcOf(A,"close"|"hl2"|...), P_(n) (làm tròn chu kỳ >= 1), L1(d) (1 đường). */

IND.mine={
  n:"My Indicator (mẫu)",t:"osc",
  d:"Mẫu: chênh lệch giữa giá đóng cửa và SMA. Sửa hàm f bên dưới để thử ý tưởng của bạn.",
  p:[["period","Chu kỳ",20,"i",{min:1}]],
  c:["#35b6ff"],L:["Close - SMA"],hl:[{y:0,al:.5}],
  f:(A,p)=>{
    const m=sma(A.c,P_(p.period));
    return L1(A.c.map((v,i)=>m[i]==null?null:v-m[i]));
  }
};

/* ===== HVN Profile: vùng volume dày (High Volume Node) theo từng chu kỳ, kéo sang phải đến khi giá chạm lại =====
   Kiểu "of" nên không đi qua hàm f; phần tính + vẽ nằm ở js/hvn-profile.js. ver:2 = làm lại, cài đặt cũ đã lưu sẽ về mặc định mới. */
IND.hvn={
  n:"HVN Profile",t:"of",ver:2,
  d:"Tìm các node volume dày (High Volume Node) trong từng chu kỳ (1 phút đến Tuần), kèm POC, % volume và độ mạnh, tách hỗ trợ/kháng cự, rồi kéo sang phải đến khi giá chạm lại (hoặc nhảy qua) thì đóng vùng, phân loại giữ/phá và có thể báo. Dùng tick thật khi có, không thì ước lượng từ nến M1.",
  p:[["tf","Chu kỳ profile","3600","s",{g:"Profile",o:[["60","1 phút"],["300","5 phút"],["900","15 phút"],["1800","30 phút"],["3600","1 giờ"],["14400","4 giờ"],["86400","Ngày"],["604800","Tuần"]],tt:"Mỗi chu kỳ dựng một profile riêng. Intraday hay dùng 30 phút, swing hay dùng Ngày."}],
     ["src","Nguồn volume","auto","s",{o:[["auto","Tự động (tick nếu có)"],["m1","Chỉ nến M1"]],tt:"Tự động: nếu đã tải tick (bật Footprint, Big Trade hoặc Statistic) thì phân bổ volume theo tick thật, không thì theo đường đi của giá trong nến M1."}],
     ["rows","Số hàng giá mỗi profile",100,"i",{min:20,max:400,tt:"Nhiều hàng thì chi tiết hơn nhưng nhiễu hơn. Kích thước hàng tự làm tròn theo bước giá của mã."}],
     ["hw","Bề rộng histogram (% chu kỳ)",50,"i",{min:5,max:100}],
     ["meth","Cách nhận diện","peak","s",{g:"Nhận diện HVN",o:[["peak","Đỉnh nổi bật (khuyên dùng)"],["level","Theo ngưỡng"]],hp:["Hai cách nhận diện","Đỉnh nổi bật: tìm các đỉnh volume của profile đã làm mượt, giữ đỉnh đủ cao và đủ nổi bật so với thung lũng quanh nó. Biên vùng dừng ở thung lũng giữa 2 đỉnh nên các node kề nhau được tách riêng.","Theo ngưỡng: mọi hàng có volume từ ngưỡng % của đỉnh lớn nhất trở lên đều là HVN, các hàng gần nhau gộp thành cụm. Đơn giản hơn nhưng dễ dính các node kề nhau thành một."]}],
     ["thr","Ngưỡng biên vùng (% đỉnh)",60,"i",{min:10,max:95,tt:"Đỉnh nổi bật: vùng mở rộng từ đỉnh đến khi volume tụt dưới ngưỡng này (hoặc gặp thung lũng). Theo ngưỡng: so với đỉnh lớn nhất của cả profile. Thấp hơn thì vùng rộng hơn."}],
     ["prom","Độ nổi bật tối thiểu (% đỉnh lớn nhất)",15,"i",{min:0,max:90,on:p=>p.meth!=="level",tt:"Đỉnh phải cao hơn thung lũng quanh nó ít nhất chừng này so với đỉnh lớn nhất, để loại các gợn nhỏ trên sườn."}],
     ["smooth","Số lần làm mượt",2,"i",{min:0,max:10,tt:"Làm mượt trung bình 3 điểm, lặp lại. Nhiều lần thì các đỉnh răng cưa dính thành một cao nguyên."}],
     ["gapr","Khoảng trống cho phép trong cụm (hàng)",1,"i",{min:0,max:10,on:p=>p.meth==="level"}],
     ["minr","Kích thước vùng tối thiểu (hàng)",2,"i",{min:1,max:50}],
     ["mins","Volume tối thiểu của vùng (% profile)",3,"n",{g:"Lọc chất lượng",min:0,max:100,step:0.5,tt:"Vùng có volume nhỏ hơn chừng này % tổng volume của profile thì bỏ. Dùng để loại vùng yếu."}],
     ["mpv","Bỏ chu kỳ volume thấp (% so với trung vị)",30,"i",{min:0,max:100,tt:"Chu kỳ có tổng volume thấp hơn chừng này % so với trung vị các chu kỳ đã đóng (nghỉ lễ, phiên mỏng) thì không vẽ. 0 = tắt."}],
     ["touch","Khi nào vùng bị dùng hết","edge","s",{g:"Kéo dài vùng",o:[["edge","Giá chạm mép vùng"],["poc","Giá chạm POC"],["close","Nến đóng cửa vào hoặc vượt vùng"]],tt:"Giá nhảy qua vùng (gap) luôn tính là đã dùng hết. Chế độ đóng cửa chỉ xét nến đã đóng nên không bị tính nhầm vì râu nến."}],
     ["grace","Số nến bỏ qua trước khi tính chạm",1,"i",{min:0,max:50,tt:"Bỏ qua chừng này nến đầu tiên sau khi chu kỳ kết thúc rồi mới xét chạm vùng."}],
     ["pocx","Kéo dài POC cùng vùng",true,"b"],
     ["shwt","Hiện vùng đã bị chạm (cắt tại nến chạm)",true,"b",{tt:"Vùng bị phá (nến đóng cửa xuyên qua) mờ hơn và POC nét đứt; vùng giữ (bật lại) mờ vừa."}],
     ["sdc","Màu theo hỗ trợ / kháng cự",true,"b",{g:"Hiển thị",tt:"Vùng dưới giá đóng cuối chu kỳ là hỗ trợ, vùng trên là kháng cự (đổi màu ở tab Kiểu dáng)."}],
     ["cfl","Hiện số vùng chồng nhau (×N)",true,"b"],
     ["live","Hiện profile đang chạy",true,"b"],
     ["lop","Độ mờ profile đang chạy",0.3,"n",{min:0.05,max:1,step:0.05}],
     ["zop","Độ mờ vùng HVN",0.14,"n",{min:0.02,max:1,step:0.02,tt:"Vùng mạnh hơn (volume lớn hơn) đậm hơn."}],
     ["hop","Độ mờ histogram",0.5,"n",{min:0.05,max:1,step:0.05}],
     ["maxb","Số nến quét ngược tối đa",3000,"i",{min:100,max:20000,tt:"Giới hạn để chart nhẹ. Tối đa 400 chu kỳ gần nhất được vẽ."}],
     ["alert","Báo khi giá chạm vùng HVN",false,"b",{g:"Cảnh báo",tt:"Hiện thông báo trên thanh trạng thái và phát tiếng bíp khi nến đang chạy chạm vào một vùng HVN còn hiệu lực."}]],
  c:["#35b6ff","#ffb02e","#98a2d8","#b388ff","#26c882","#ff5c8a"],L:["Vùng HVN (trung tính)","POC","Histogram","Profile đang chạy","Hỗ trợ (dưới giá)","Kháng cự (trên giá)"],
  lab:p=>tfName(+p.tf),f:()=>[]
};
