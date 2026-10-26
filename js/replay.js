/* ================= BAR REPLAY / MANUAL BACKTEST =================
   Uses the chart's already-loaded historical candles. Replay never displays
   candles beyond the selected index. Live data can continue updating in the
   background, but is hidden from the replay viewport. */
const REPLAY={active:false,index:0,playing:false,timer:null,pickMode:false,refreshBounds(){
  const r=$('rpRange');if(!r)return;
  const max=Math.max(0,agg.length-1);r.max=String(max);
  if(this.index>max)this.index=max;
  this.sync();
},stop(){this.playing=false;if(this.timer)clearInterval(this.timer);this.timer=null;const b=$('rpPlay');if(b)b.textContent='▶ Phát';},
  enter(){if(!agg.length){alert('Chưa có dữ liệu nến. Hãy kết nối cTrader và tải dữ liệu lịch sử trước.');return}
    this.active=true;this.index=Math.max(0,agg.length-1);$('replayPanel').hidden=false;$('replayToggle').classList.add('active');$('replayToggle').textContent='● Đang Replay';this.refreshBounds();this.render();this.sync();
    $('replayPanel').scrollIntoView({behavior:'smooth',block:'nearest'});
  },
  exit(){this.stop();this.active=false;$('replayPanel').hidden=true;$('replayToggle').classList.remove('active');$('replayToggle').textContent='▶ Replay';try{cs.setData(agg);vs.setData(agg.map(c=>({time:c.time,value:c.v,color:vcol(c.open,c.close)})));renderInd();chart.timeScale().scrollToRealTime()}catch(e){}},
  renderIndicators(){if(!this.active){renderInd();return}const full=agg;try{agg=full.slice(0,this.index+1);renderInd()}finally{agg=full}},
  render(){if(!this.active)return;const visible=agg.slice(0,this.index+1);cs.setData(visible);vs.setData(visible.map(c=>({time:c.time,value:c.v,color:vcol(c.open,c.close)})));this.renderIndicators();try{chart.timeScale().scrollToRealTime()}catch{}this.sync();},
  setIndex(i){if(!agg.length)return;this.index=Math.max(0,Math.min(agg.length-1,Math.round(+i||0)));this.stop();this.render();},
  sync(){const r=$('rpRange');if(!r)return;const max=Math.max(0,agg.length-1);r.max=String(max);r.value=String(Math.min(this.index,max));const bar=agg[this.index];const fmt=t=>{if(!t)return'—';try{return new Date(t*1000).toLocaleString('sv-SE').replace('T',' ')}catch{return String(t)}};$('rpFrom').textContent=fmt(agg[0]?.time);$('rpTo').textContent=fmt(agg[max]?.time);$('rpCurrent').textContent=bar?fmt(bar.time):'Chưa có nến';$('rpProgress').textContent=`${this.index+1} / ${agg.length} nến`;$('rpState').textContent=this.playing?'ĐANG PHÁT':'TẠM DỪNG';$('rpInfo').textContent=bar?`${C.sym} · ${tfName(C.tf)} · Giá đóng cửa ${(+bar.close).toFixed(PDIG())}`:'Chưa có dữ liệu';if(bar){const d=new Date(bar.time*1000);if(!Number.isNaN(+d))$('rpDate').value=new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)}} ,
  goDate(){const val=$('rpDate').value;if(!val)return;const target=new Date(val).getTime()/1000;let best=0,dist=Infinity;agg.forEach((b,i)=>{const d=Math.abs(b.time-target);if(d<dist){dist=d;best=i}});this.setIndex(best);},
  play(){if(!this.active)this.enter();if(!this.active)return;if(this.playing){this.stop();this.sync();return}if(this.index>=agg.length-1)this.index=0;this.playing=true;$('rpPlay').textContent='Ⅱ Tạm dừng';this.sync();const delay=()=>Math.max(80,+$('rpSpeed').value||650);this.timer=setInterval(()=>{if(!this.active){this.stop();return}if(this.index>=agg.length-1){this.stop();this.sync();return}this.index++;this.render()},delay());}
};
window.REPLAY=REPLAY;
(()=>{
 const $id=id=>document.getElementById(id);
 $id('replayToggle').addEventListener('click',()=>REPLAY.active?REPLAY.exit():REPLAY.enter());
 $id('replayClose').addEventListener('click',()=>REPLAY.exit());
 $id('rpPlay').addEventListener('click',()=>REPLAY.play());
 $id('rpStart').addEventListener('click',()=>REPLAY.setIndex(0));
 $id('rpBack').addEventListener('click',()=>REPLAY.setIndex(REPLAY.index-1));
 $id('rpNext').addEventListener('click',()=>REPLAY.setIndex(REPLAY.index+1));
 $id('rpEnd').addEventListener('click',()=>REPLAY.setIndex(agg.length-1));
 $id('rpRange').addEventListener('input',e=>REPLAY.setIndex(+e.target.value));
 $id('rpGo').addEventListener('click',()=>REPLAY.goDate());
 $id('rpDate').addEventListener('keydown',e=>{if(e.key==='Enter')REPLAY.goDate()});
 $id('rpPick').addEventListener('click',()=>{REPLAY.pickMode=true;$id('rpPick').classList.add('active');$id('rpPick').textContent='Bấm vào nến…';$id('rpInfo').textContent='Bấm vào nến trên biểu đồ để chọn điểm bắt đầu replay.'});
 chart.subscribeClick(param=>{if(!REPLAY.pickMode||!param||!param.time)return;const t=typeof param.time==='number'?param.time:(param.time.year?Date.UTC(param.time.year,param.time.month-1,param.time.day)/1000:0);let best=0,dist=Infinity;agg.forEach((b,i)=>{const d=Math.abs(b.time-t);if(d<dist){dist=d;best=i}});REPLAY.pickMode=false;$id('rpPick').classList.remove('active');$id('rpPick').textContent='Chọn trên chart';REPLAY.setIndex(best)});
 // Rebuilds caused by symbol/timeframe changes refresh the replay slider bounds.
 setInterval(()=>{if(REPLAY.active)REPLAY.refreshBounds()},1800);
})();
