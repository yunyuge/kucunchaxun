const $=id=>document.getElementById(id);
const selects=['style','size','opening'];
let all=[];
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function fill(id,vals){const el=$(id), cur=el.value; el.innerHTML='<option value="">请选择</option>'+[...new Set(vals.filter(Boolean))].sort().map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join(''); if([...el.options].some(o=>o.value===cur))el.value=cur}
async function load(){
 $('loading').classList.remove('hidden');
 const {data,error}=await supabaseClient.from('door_batches').select('*').gt('pending_quantity',0).order('estimated_shipping_date',{ascending:true});
 $('loading').classList.add('hidden');
 if(error){alert('读取云端数据失败：'+error.message);return}
 all=data||[]; updateFilters();
}
function updateFilters(){
 const style=$('style').value;
 const a=style?all.filter(x=>x.style===style):all;
 fill('style',all.map(x=>x.style)); fill('size',a.map(x=>x.size));
 const size=$('size').value; const b=size?a.filter(x=>x.size===size):a;
 fill('opening',b.map(x=>x.opening));
}
$('style').addEventListener('change',()=>{ $('size').value='';$('opening').value='';updateFilters()});
$('size').addEventListener('change',()=>{ const a=all.filter(x=>(!$('style').value||x.style===$('style').value)&&(!$('size').value||x.size===$('size').value));fill('opening',a.map(x=>x.opening))});
$('query').onclick=async()=>{
 const style=$('style').value,size=$('size').value,opening=$('opening').value,side=$('side').value;
 if(!style||!size||!opening||!side){alert('请完整选择查询条件');return}
 $('result').classList.add('hidden');$('empty').classList.add('hidden');$('loading').classList.remove('hidden');
 const {data,error}=await supabaseClient.from('door_batches').select('*').eq('style',style).eq('size',size).eq('opening',opening).eq('side',side).gt('pending_quantity',0).order('estimated_shipping_date',{ascending:true});
 $('loading').classList.add('hidden');
 if(error){alert(error.message);return}
 if(!data?.length){$('empty').classList.remove('hidden');return}
 const x=data[0], d=x.estimated_shipping_date?new Date(x.estimated_shipping_date+'T00:00:00').toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}):'待确认';
 $('result').innerHTML=`<h2>查询结果</h2><div class="info"><span>款式<b>${esc(x.style)}</b></span><span>尺寸<b>${esc(x.size)}</b></span><span>开向<b>${esc(x.opening)}</b></span><span>左右<b>${esc(x.side)}</b></span></div><div class="date"><small>最快预计出货时间</small><strong>${d}</strong><em>生产编号：${esc(x.production_no||'—')} · 当前未入库：${x.pending_quantity}</em></div>${data.length>1?`<p class="next">另有 ${data.length-1} 个后续匹配批次，下一批：${data[1].estimated_shipping_date||'待确认'}</p>`:''}`;
 $('result').classList.remove('hidden');
};
load();