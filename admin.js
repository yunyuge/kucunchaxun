const $=id=>document.getElementById(id);
let warehouse=localStorage.getItem('selectedWarehouse')||WAREHOUSES[0].id;
function initWarehouses(){const el=$('warehouse');el.innerHTML=WAREHOUSES.map(x=>`<option value="${x.id}">${x.name}</option>`).join('');el.value=warehouse;el.onchange=()=>{warehouse=el.value;localStorage.setItem('selectedWarehouse',warehouse)}}
function status(s){$('progress').textContent=s}
async function check(){const {data:{session}}=await supabaseClient.auth.getSession();$('loginCard').classList.toggle('hidden',!!session);$('panel').classList.toggle('hidden',!session)}
$('login').onclick=async()=>{
 const email=$('email').value.trim(),password=$('password').value;
 if(!email||!password){alert('请输入管理员邮箱和密码');return}
 try{
    const {data,error}=await supabaseClient.auth.signInWithPassword({
   email:email,
   password:password
  });
  if(error){
   const message=error.message.toLowerCase();
   if(message.includes('email not confirmed'))alert('登录失败：邮箱尚未确认，请在 Supabase 用户管理中确认邮箱，或关闭邮箱确认要求。');
   else if(message.includes('invalid login credentials'))alert('登录失败：邮箱或密码错误，请确认 Authentication → Users 中已创建该管理员账号。');
   else alert('登录失败：'+error.message);
   return
  }
  if(data?.session)await check();
 }catch(e){alert('登录失败：无法连接 Supabase，请检查网络、项目 URL 和 Publishable Key。');console.error(e)}
}
 $('logout').onclick=async()=>{await supabaseClient.auth.signOut();check()}
function n(v){const x=Number(v);return Number.isFinite(x)?Math.max(0,Math.round(x)):0}
function excelDate(v,warehouseId){if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);return d?`${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`:null} if(!v)return null; const text=String(v).trim(); if(warehouseId==='warehouse-2'){const m=text.match(/^(\d{1,2})-(\d{1,2})$/);if(m){const year=new Date().getFullYear();return `${year}-${String(Number(m[1])).padStart(2,'0')}-${String(Number(m[2])).padStart(2,'0')}`}} const d=new Date(text);return isNaN(d)?null:d.toISOString().slice(0,10)}
function ship(no,year,style,series){const m=String(no||'').match(/(\d{1,2})-(\d{1,2})/);if(!m)return null; const doorType=`${style||''}${series||''}`;const extraDays=['欧乐（隐藏门楣）','欧力（隐藏门楣）'].includes(style||'')?4:0;const days=(doorType.includes('子母')?10:8)+extraDays; const d=new Date(year,Number(m[1])-1,Number(m[2])+days);return d.toISOString().slice(0,10)}
$('upload').onclick=async()=>{
 const f=$('file').files[0];if(!f){alert('请选择 Excel 文件');return}
 try{
  status('正在读取 Excel...');
  const wb=XLSX.read(await f.arrayBuffer(),{type:'array',cellDates:false});
  const ws=wb.Sheets[wb.SheetNames[0]]; const rows=XLSX.utils.sheet_to_json(ws,{defval:null});
  const out=[]; rows.forEach((r,i)=>{
   const style=String(r['款式']??'').trim(), size=String(r['尺寸']??'').trim(), opening=String(r['开向']??'').trim();
   if(!style||!size||!opening)return;
  const date=excelDate(r['日期'],warehouse); const year=date?new Date(date+'T00:00:00').getFullYear():new Date().getFullYear();
  const series=String(r['系列']??'').trim()||null; const productionNo=String(r['生产编号']??'').trim()||null;
  const common={warehouse,record_date:date,style,series,size,opening,production_no:productionNo,estimated_shipping_date:ship(productionNo,year,style,series)};
   [['左','已入库\n左'],['右','已入库\n右']].forEach(([side,stockCol])=>{
    const original=n(r[side]), stocked=n(r[stockCol]), pending=Math.max(0,original-stocked);
    out.push({...common,source_key:`${warehouse}|${date||'nodate'}|${style}|${size}|${opening}|${side}|${common.production_no||''}|${i}`,side,original_quantity:original,stocked_quantity:stocked,pending_quantity:pending,updated_at:new Date().toISOString()})
   })
  });
  status(`已解析 ${rows.length} 行，准备上传 ${out.length} 条左右明细...`);
    const {error:del}=await supabaseClient.from('door_batches').delete().eq('warehouse',warehouse);if(del)throw del;
    const chunk=200; for(let i=0;i<out.length;i+=chunk){status(`正在上传 ${Math.min(i+chunk,out.length)}/${out.length}...`);const {error}=await supabaseClient.from('door_batches').insert(out.slice(i,i+chunk));if(error)throw error}
  status(`上传完成！云端已更新 ${out.length} 条数据。查询网站现在即可读取最新数据。`);
 }catch(e){console.error(e);status('上传失败：'+e.message)}
}
initWarehouses();check();