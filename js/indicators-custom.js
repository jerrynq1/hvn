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

/* ===== Heavy Absorption v2: lệnh lớn bị thanh khoản thụ động hấp thụ (giá bị chặn), ngưỡng thích nghi theo thống kê =====
   Kiểu "of": phần tính + vẽ nằm ở js/orderflow-absorption.js. Dùng tick (footprint) nên tự tải tick khi bật. */
const HAB_ON=(k,v)=>p=>p[k]===v,HAB_NOT=(k,v)=>p=>p[k]!==v;
IND.hab={
  n:"Heavy Absorption",t:"of",ver:2,
  d:"Tìm các lệnh mua/bán lớn bất thường tại một mức giá trong nến (volume Ask hoặc Bid vượt ngưỡng thống kê thích nghi trong lookback) và kiểm tra giá có thực sự bị chặn hay không: phía mua bị hấp thụ khi giá không đi tiếp qua mép trên cụm, phía bán ở mép dưới. Sau đó theo dõi vài nến để xác nhận hoặc đánh dấu thất bại. Mỗi marker là một vòng tròn, số bên trong là volume. Kết hợp HVN Profile: viền marker nằm trong vùng HVN còn hiệu lực, biết vùng là hỗ trợ hay kháng cự và marker có đúng vai trò không. Với CFD là số ước lượng từ chuỗi báo giá bid/ask.",
  p:[["step","Bước giá (0 = tự động)",0,"n",{g:"Dữ liệu",mn:1,min:0,step:0.01,tt:"Gộp volume theo hàng giá có bề rộng này. 0 = tự động theo trung vị biên độ nến chia số hàng bên dưới (làm tròn 1/2/5)."}],
     ["rows","Số hàng giá mỗi nến (khi tự động)",12,"i",{min:3,max:60,on:p=>!(+p.step>0),tt:"Nhiều hàng thì print nhỏ hơn và chi tiết hơn, ngưỡng cũng thấp hơn. 10 đến 20 là hợp lý."}],
     ["cov","Bỏ nến thiếu tick (độ phủ tối thiểu %)",60,"i",{min:0,max:100,tt:"Nến có ít hơn chừng này % số phút có dữ liệu tick (lịch sử tick bị cắt, mới bật) thì không tham gia thống kê và không có marker, tránh ngưỡng sai vì thiếu dữ liệu."}],
     ["sens","Độ nhạy","normal","s",{g:"Ngưỡng lệnh lớn",mn:1,o:[["low","Thấp (ít marker, mạnh)"],["normal","Vừa"],["high","Cao (nhiều marker)"],["custom","Tuỳ chỉnh hệ số"]],tt:"Thấp ≈ k 3, Vừa ≈ 2, Cao ≈ 1.5 (chế độ log: 3 / 2.5 / 2)."}],
     ["sdk","Hệ số k",2,"n",{mn:1,min:0.5,max:6,step:0.1,on:HAB_ON("sens","custom"),tt:"Ngưỡng = trung bình + k × độ lệch chuẩn. Cao hơn thì ít marker hơn và mạnh hơn."}],
     ["dist","Cách tính ngưỡng","sd","s",{o:[["sd","Trung bình + k·độ lệch chuẩn (như ATAS)"],["log","Theo log volume (ổn định hơn)"]],hp:["Hai cách tính ngưỡng","Trung bình + k·độ lệch chuẩn: đúng mô tả của Heavy Absorption gốc. Volume từng mức giá lệch phải và đuôi dài nên vài print cực lớn kéo độ lệch chuẩn lên, làm các print lớn vừa bị bỏ sót.","Theo log volume: tính trung bình và độ lệch chuẩn trên ln(volume) rồi đổi ngược lại. Phù hợp phân phối đuôi dài, ngưỡng ổn định hơn qua các phiên, bắt được cả lệnh lớn vừa."]}],
     ["lb","Lookback (số nến)",100,"i",{mn:1,min:5,max:1000,tt:"Cửa sổ thống kê: ngưỡng tính từ mọi print của chừng này nến gần nhất."}],
     ["minn","Số print tối thiểu trong cửa sổ",30,"i",{min:5,max:5000,tt:"Cửa sổ có ít print hơn mức này thì chưa tính ngưỡng (đầu lịch sử hoặc mới tải tick)."}],
     ["excl","Không tính nến đang xét vào thống kê",true,"b",{tt:"Print lớn của chính nến đang xét không tự nâng trung bình và độ lệch chuẩn, nên nhạy hơn và đúng hơn. Tắt để giống bản gốc (cửa sổ gồm cả nến hiện tại)."}],
     ["minv","Volume tối thiểu (0 = tắt)",0,"i",{min:0,tt:"Ẩn cụm có tổng volume nhỏ hơn mức này (mỗi print cũng phải đạt mức này)."}],
     ["minp","Print tối thiểu (% volume nến, 0 = tắt)",0,"n",{min:0,max:100,step:0.5,tt:"Print phải chiếm ít nhất chừng này % tổng volume của nến, loại các print lớn nhưng chỉ là phần nhỏ của nến volume rất cao."}],
     ["gap","Gộp hàng kề nhau (số hàng trống cho phép)",1,"i",{g:"Hấp thụ",min:0,max:10,tt:"Các print đủ ngưỡng ở hàng kề nhau (cách nhau tối đa chừng này hàng trống) gộp thành một cụm: một marker, volume là tổng cụm."}],
     ["maxm","Tối đa marker mỗi phía mỗi nến",1,"i",{min:1,max:5,tt:"Giữ các cụm có tổng volume lớn nhất."}],
     ["rej","Điều kiện giá bị chặn trong nến","ext","s",{mn:1,o:[["none","Không kiểm tra (chỉ lệnh lớn)"],["ext","Giá không đi quá mức hấp thụ"],["close","Không đi quá và đóng cửa phía bị chặn"]],hp:["Giá bị chặn là gì?","Hấp thụ nghĩa là lệnh lớn đánh vào nhưng giá không đi tiếp. Phía mua bị hấp thụ: đỉnh nến không vượt mép trên của cụm quá số hàng cho phép. Phía bán bị hấp thụ: đáy nến không thấp hơn mép dưới của cụm quá số hàng cho phép.","Chế độ chặt hơn còn yêu cầu nến đóng cửa không vượt mép cụm.","Cụm mà giá chạy xuyên qua ngay trong nến (không bị chặn) bị loại. Chọn \"Không kiểm tra\" để chỉ phát hiện lệnh lớn như bản gốc."]}],
     ["ext","Dung sai vượt mức (hàng)",2,"i",{min:0,max:20,on:HAB_NOT("rej","none"),tt:"Giá được phép vượt mép cụm tối đa chừng này hàng giá vẫn tính là bị chặn. Cũng dùng khi xét các nến xác nhận."}],
     ["conf","Số nến xác nhận",3,"i",{mn:1,min:0,max:30,tt:"Theo dõi chừng này nến sau marker: giá vượt mức hấp thụ thì thất bại, giữ được hết thì xác nhận, chưa đủ nến thì đang chờ (vòng đứt nét). 0 = không xác nhận."}],
     ["cm","Thất bại khi","close","s",{o:[["close","Nến đóng cửa vượt mức"],["wick","Râu nến vượt mức"]],tt:"Đóng cửa: bỏ qua râu nến quét qua rồi quay lại. Râu: chặt hơn, mọi lần chạm vượt đều tính."}],
     ["sts","Hiển thị theo trạng thái","all","s",{o:[["all","Tất cả (thất bại mờ đi)"],["nofail","Ẩn marker thất bại"],["ok","Chỉ marker đã xác nhận"]],tt:"Lưu ý: ẩn thất bại hoặc chỉ hiện xác nhận làm marker xuất hiện hoặc biến mất sau vài nến, vì trạng thái chỉ biết khi các nến sau đã đóng."}],
     ["hvn","Kết hợp HVN Profile","mark","s",{g:"Kết hợp HVN Profile",o:[["off","Không dùng"],["mark","Viền nổi bật khi trong vùng HVN"],["only","Chỉ hiện khi trong vùng HVN"],["align","Chỉ hiện khi trong vùng HVN và đúng vai trò"]],hp:["Kết hợp với HVN Profile","Cần bật cả HVN Profile trên chart. Vùng HVN còn hiệu lực là vùng của chu kỳ đã kết thúc mà giá chưa dùng hết (nến chạm vùng vẫn tính vì đó là phản ứng).","Vai trò theo hướng giá tới: nến mở dưới giữa vùng thì vùng là kháng cự (R), mở trên thì là hỗ trợ (S). Đúng vai trò (viền liền): mua bị hấp thụ tại kháng cự hoặc bán bị hấp thụ tại hỗ trợ. Ngược vai trò: viền đứt nét.","Nhãn POC xuất hiện khi POC của vùng nằm sát cụm. Nếu HVN Profile đang tắt thì mục này không có tác dụng."]}],
     ["htol","Dung sai quanh vùng HVN (hàng)",1,"i",{min:0,max:20,on:HAB_NOT("hvn","off"),tt:"Cụm chỉ cần nằm sát vùng trong chừng này hàng giá là tính là trong vùng."}],
     ["sz","Cỡ vòng tròn theo","thr","s",{g:"Hiển thị",o:[["thr","Số lần ngưỡng (ổn định khi cuộn/zoom)"],["vis","Marker lớn nhất đang hiển thị (như ATAS)"]],tt:"Theo ngưỡng: cỡ phụ thuộc volume so với ngưỡng của nến đó nên không đổi khi cuộn chart. Theo marker lớn nhất: cỡ co giãn theo các marker đang nhìn thấy."}],
     ["cap","Cỡ lớn nhất khi volume gấp (lần ngưỡng)",5,"n",{min:1.5,max:50,step:0.5,on:HAB_ON("sz","thr")}],
     ["dmin","Đường kính nhỏ nhất",14,"i",{min:6,max:80}],["dmax","Đường kính lớn nhất",44,"i",{min:10,max:160}],
     ["op","Độ mờ",0.55,"n",{min:0.1,max:1,step:0.05}],["hol","Rỗng ruột",false,"b"],
     ["txt","Hiện số volume",true,"b"],
     ["tm","Nội dung chữ","vol","s",{o:[["vol","Volume"],["z","Điểm σ (độ mạnh thống kê)"],["both","Volume và σ"]],tt:"σ = print lớn nhất của cụm cách trung bình bao nhiêu độ lệch chuẩn (theo cách tính ngưỡng đang chọn)."}],
     ["tsz","Cỡ chữ",11,"i",{min:7,max:20}],
     ["lvl","Kẻ mức hấp thụ sang phải",true,"b",{tt:"Đường ngang từ marker đến khi giá phá mức (thất bại) hoặc hết số nến tối đa. Có thể dùng làm hỗ trợ/kháng cự ngắn hạn."}],
     ["len","Kéo dài tối đa (nến)",20,"i",{min:1,max:300,on:p=>p.lvl}],
     ["live","Hiện marker nến đang chạy",true,"b",{tt:"Nến đang chạy chưa đóng nên marker có thể đổi hoặc biến mất theo từng tick (vòng đứt nét = đang chờ)."}],
     ["alm","Cảnh báo","off","s",{g:"Cảnh báo",o:[["off","Tắt"],["bar","Khi nến có marker đóng"],["ok","Khi marker được xác nhận"]],tt:"Hiện thông báo trên thanh trạng thái và phát tiếng bíp. Lần mở đầu chỉ ghi nhớ marker cũ, không báo dồn."}]],
  c:["#26c882","#ff5c8a","#ffffff","#ffb02e"],L:["Bull (lệnh mua / Ask)","Bear (lệnh bán / Bid)","Màu chữ","Viền vùng HVN"],lab:p=>(p.sens==="custom"?p.sdk:p.sens==="low"?"thấp":p.sens==="high"?"cao":"vừa")+"/"+p.lb,f:()=>[]
};


/* ===== DOM / MBO: sổ lệnh (Depth of Market) từ cTrader, bảng bên phải chart + histogram thanh khoản ở mép phải =====
   Kiểu "of": phần tính + vẽ nằm ở js/orderflow-dom.js. Dữ liệu là kênh depth của cTrader Open API (mỗi báo giá có ID riêng nên tách được từng lệnh). */
IND.dom={
  n:"DOM / MBO",t:"of",ver:1,
  d:"Sổ lệnh (Depth of Market) lấy từ kênh depth của cTrader: bảng Bid | Giá | Ask | VP nằm bên phải ngoài chart, và histogram thanh khoản dựng ngay mép phải vùng vẽ, thẳng hàng với trục giá. Mỗi báo giá trong sổ có ID riêng nên tách được từng lệnh (MBO), đếm số lệnh mỗi mức, nháy ô khi lệnh được thêm hoặc rút, và tô nổi các mức thanh khoản mạnh bất thường kèm đường ngang sang trái. Với forex/CFD đây là thanh khoản tổng hợp do broker báo, không phải sổ lệnh sàn tập trung.",
  p:[["panel","Hiện bảng DOM bên phải",true,"b",{g:"Bảng DOM",mn:1}],
     ["pw","Bề rộng bảng (px)",250,"i",{min:150,max:500,on:p=>p.panel}],
     ["rh","Chiều cao hàng (px)",18,"i",{min:12,max:36,on:p=>p.panel}],
     ["step","Gộp giá (0 = tự động)",0,"n",{min:0,step:0.01,tt:"Gộp các lệnh vào hàng giá có bề rộng này. 0 = tự động theo spread hiện tại (làm tròn 1/2/5), không nhỏ hơn bước giá của mã."}],
     ["unit","Đơn vị size","lot","s",{o:[["lot","Lot"],["unit","Đơn vị hợp đồng (oz, EUR...)"],["raw","Số thô của cTrader (1/100 đơn vị)"]],tt:"Size trong giao thức cTrader tính theo 1/100 đơn vị. Lot = size / lotSize của mã."}],
     ["vp","Cột VP (volume đã khớp theo giá)",true,"b",{on:p=>p.panel,tt:"Volume đã khớp theo giá trong khoảng thời gian bên dưới, lấy từ tick footprint nên bật cột này sẽ tự tải tick (3 ngày gần nhất)."}],
     ["vpm","VP: số phút gần nhất",240,"i",{min:5,max:4320,on:p=>p.panel&&p.vp}],
     ["ord","Hiện số lệnh mỗi mức (×N)",true,"b",{on:p=>p.panel,tt:"Số lệnh riêng lẻ (ID khác nhau) đang nằm ở mức giá đó."}],
     ["flow","Nháy ô khi lệnh thêm / rút",true,"b",{on:p=>p.panel,tt:"Ô sáng màu Bid/Ask khi size mức đó tăng, màu ngược lại khi giảm trong 1,2 giây gần nhất. Giảm size có thể là rút lệnh hoặc bị khớp, cTrader không phân biệt."}],
     ["edge","Histogram thanh khoản ở mép phải chart",true,"b",{g:"Histogram trên chart",mn:1,tt:"Thanh ngang mỗi mức giá, bám mép phải vùng vẽ: đỏ là Ask phía trên giá, xanh là Bid phía dưới giá."}],
     ["ew","Bề rộng tối đa (% vùng vẽ)",24,"i",{min:5,max:60,on:p=>p.edge}],
     ["mbo","Tách từng lệnh (MBO)",true,"b",{mn:1,on:p=>p.edge,tt:"Mỗi lệnh trong mức giá là một đoạn riêng trong thanh, lệnh lớn nằm sát mép phải."}],
     ["strong","Đánh dấu thanh khoản mạnh",true,"b",{g:"Thanh khoản mạnh",mn:1,tt:"Mức giá có size vượt trung bình + k × độ lệch chuẩn của toàn bộ sổ lệnh được viền nổi, ghi nhãn size và giá."}],
     ["sk","Hệ số k",2,"n",{min:0.5,max:6,step:0.1,on:p=>p.strong,tt:"Cao hơn thì ít mức mạnh hơn."}],
     ["smin","Size tối thiểu để tính là mạnh (0 = tắt)",0,"n",{min:0,step:0.1,on:p=>p.strong,tt:"Tính theo đơn vị size đang chọn ở trên."}],
     ["sline","Kẻ đường ngang từ mức mạnh sang trái",true,"b",{on:p=>p.strong&&p.edge}],
     ["hm","Heatmap lịch sử thanh khoản trên chart",false,"b",{g:"Heatmap (kiểu Bookmap)",mn:1,tt:"Chụp sổ lệnh mỗi giây và tô nền chart theo size từng mức giá theo thời gian: đậm là thanh khoản dày, xanh là Bid, đỏ là Ask. Chỉ có dữ liệu từ lúc bật indicator, mất khi tải lại trang."}],
     ["hmm","Lưu lịch sử (phút)",30,"i",{min:2,max:240,on:p=>p.hm}],
     ["hmr","Độ rộng quanh giá (số hàng mỗi phía)",120,"i",{min:10,max:400,on:p=>p.hm,tt:"Chỉ lưu các mức trong khoảng này quanh giá giữa để nhẹ bộ nhớ."}],
     ["hmo","Độ đậm heatmap",0.5,"n",{min:0.05,max:1,step:0.05,on:p=>p.hm}]],
  c:["#26c882","#ff5c8a","#ffb02e","#35b6ff","#ffd24a"],L:["Bid (mua chờ)","Ask (bán chờ)","Thanh khoản mạnh","Nhấn giá Bid/Ask","VP đã khớp"],
  lab:p=>p.unit==="lot"?"lot":p.unit==="unit"?"đv":"raw",f:()=>[]
};
