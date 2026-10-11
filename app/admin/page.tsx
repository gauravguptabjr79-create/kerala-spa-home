'use client';
import {useEffect,useState,type FormEvent} from 'react';

const BASE='https://xmkdiqoejeyzvkyfsusb.supabase.co';
const KEY='sb_publishable_0QtMPpCvai9lX088rI9eaQ_aMCePXtP';
type RecordItem={id:string;created_at?:string;status?:string;[key:string]:unknown};
type Session={access_token:string;refresh_token:string;expires_at:number};
const tables=['customer_bookings','spa_specialist_applications'] as const;
const label=(x:unknown)=>typeof x==='string'?x:typeof x==='number'?String(x):'—';
export default function Admin(){
 const [session,setSession]=useState<Session|null>(null);
 const [email,setEmail]=useState('gauravguptabjr79@gmail.com');
 const [password,setPassword]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [recovery,setRecovery]=useState(false);
 const [loading,setLoading]=useState(false);
 const [message,setMessage]=useState('');
 const [rows,setRows]=useState<Record<string,RecordItem[]>>({});
 const [tab,setTab]=useState<typeof tables[number]>('customer_bookings');
 useEffect(()=>{
  const hash=new URLSearchParams(window.location.hash.slice(1));
  const access=hash.get('access_token'),refresh=hash.get('refresh_token');
  if(access&&refresh){
   const s={access_token:access,refresh_token:refresh,expires_at:Math.floor(Date.now()/1000)+Number(hash.get('expires_in')||3600)};
   sessionStorage.setItem('ksh_admin_session',JSON.stringify(s));setSession(s);
   setRecovery(hash.get('type')==='recovery'||hash.get('type')==='invite');
   history.replaceState(null,'',window.location.pathname);return;
  }
  const saved=sessionStorage.getItem('ksh_admin_session');
  if(saved){try{setSession(JSON.parse(saved))}catch{sessionStorage.removeItem('ksh_admin_session')}}
 },[]);
 async function auth(path:string,body:object,token?:string){
  const res=await fetch(BASE+'/auth/v1/'+path,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
  const json=await res.json();if(!res.ok)throw Error(json.msg||json.error_description||json.message||'Authentication failed');return json;
 }
 async function login(e:FormEvent){e.preventDefault();setLoading(true);setMessage('');try{
  const s=await auth('token?grant_type=password',{email,password});
  const value={access_token:s.access_token,refresh_token:s.refresh_token,expires_at:Math.floor(Date.now()/1000)+s.expires_in};
  sessionStorage.setItem('ksh_admin_session',JSON.stringify(value));setSession(value);setPassword('');
 }catch(e){setMessage(e instanceof Error?e.message:'Login failed')}finally{setLoading(false)}}
 async function reset(){setLoading(true);setMessage('');try{
  await auth('recover?redirect_to='+encodeURIComponent(window.location.origin+'/admin/'),{email});setMessage('Password reset email requested. Check your inbox.'); 
 }catch(e){setMessage(e instanceof Error?e.message:'Unable to send email')}finally{setLoading(false)}}
 async function updatePassword(e:FormEvent){e.preventDefault();if(!session)return;setLoading(true);try{
  const res=await fetch(BASE+'/auth/v1/user',{method:'PUT',headers:{apikey:KEY,Authorization:'Bearer '+session.access_token,'Content-Type':'application/json'},body:JSON.stringify({password:newPassword})});
  if(!res.ok)throw Error('Could not update password');setRecovery(false);setNewPassword('');setMessage('Password saved. You can now manage requests.');
 }catch(e){setMessage(e instanceof Error?e.message:'Password update failed')}finally{setLoading(false)}}
 async function request(path:string,method='GET',body?:object){
  if(!session)throw Error('Please log in.');
  const run=async(token:string)=>fetch(BASE+'/rest/v1/'+path,{method,headers:{apikey:KEY,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},...(body?{body:JSON.stringify(body)}:{})});
  let res=await run(session.access_token);
  if(res.status===401&&session.refresh_token){
   const next=await auth('token?grant_type=refresh_token',{refresh_token:session.refresh_token});
   const s={access_token:next.access_token,refresh_token:next.refresh_token,expires_at:Math.floor(Date.now()/1000)+next.expires_in};
   sessionStorage.setItem('ksh_admin_session',JSON.stringify(s));setSession(s);res=await run(s.access_token);
  }
  if(!res.ok)throw Error(res.status===403||res.status===401?'Admin access is not active. Ask to authorize your verified Supabase Auth User ID.':'Database request failed ('+res.status+').');
  return res.json();
 }
 async function load(){setLoading(true);setMessage('');try{
  const [bookings,specialists]=await Promise.all(tables.map(t=>request(t+'?select=*&order=created_at.desc&limit=100')));
  setRows({customer_bookings:bookings,spa_specialist_applications:specialists});
 }catch(e){setMessage(e instanceof Error?e.message:'Unable to load records')}finally{setLoading(false)}}
 useEffect(()=>{if(session&&!recovery)void load()},[session?.access_token,recovery]);
 async function changeStatus(id:string,status:string){if(!confirm('Change status to '+status+'?'))return;setLoading(true);try{
  await request(tab+'?id=eq.'+encodeURIComponent(id),'PATCH',{status});await load();
 }catch(e){setMessage(e instanceof Error?e.message:'Status update failed')}finally{setLoading(false)}}
 function logout(){sessionStorage.removeItem('ksh_admin_session');setSession(null);setRows({});setMessage('')}
 const fieldNames=tab==='customer_bookings'?['customer_name','phone','service_name','preferred_date','address','city']:['full_name','phone','city','specializations','experience_years'];
 return <main style={{minHeight:'100vh',background:'#f5f7f3',padding:'24px 16px',color:'#153f36',fontFamily:'system-ui,sans-serif'}}>
 <div style={{maxWidth:900,margin:'0 auto'}}>
 <a href="/" style={{color:'#153f36'}}>← Kerala Spa Home</a><h1 style={{marginTop:24}}>Admin Dashboard</h1>
 <p style={{color:'#527368'}}>Private booking & specialist management</p>
 {!session?<form onSubmit={login} style={{background:'white',padding:24,borderRadius:12,maxWidth:440,display:'grid',gap:12}}>
 <h2>Secure sign in</h2><label>Email<input style={{display:'block',width:'100%',padding:12}} type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
 <label>Password<input style={{display:'block',width:'100%',padding:12}} type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label>
 <button disabled={loading} style={{padding:12,background:'#176a57',color:'white',border:0,borderRadius:6}}>Sign in</button>
 <button type="button" disabled={loading} onClick={reset} style={{padding:10}}>Send password reset email</button></form>:
 <div>{recovery?<form onSubmit={updatePassword} style={{background:'white',padding:24,display:'grid',gap:12,maxWidth:440}}>
 <h2>Set your password</h2><input type="password" minLength={12} required placeholder="New password (12+ characters)" value={newPassword} onChange={e=>setNewPassword(e.target.value)}/>
 <button disabled={loading}>Save password</button></form>:<>
 <div style={{display:'flex',gap:10,flexWrap:'wrap',margin:'20px 0'}}>
 <button onClick={()=>setTab('customer_bookings')} aria-pressed={tab==='customer_bookings'}>Customer Bookings ({rows.customer_bookings?.length??'—'})</button>
 <button onClick={()=>setTab('spa_specialist_applications')} aria-pressed={tab==='spa_specialist_applications'}>Specialist Applications ({rows.spa_specialist_applications?.length??'—'})</button>
 <button onClick={load} disabled={loading}>Refresh</button><button onClick={logout}>Sign out</button></div>
 {(rows[tab]||[]).map(item=><article key={item.id} style={{background:'white',borderRadius:12,padding:18,marginBottom:12,overflowWrap:'anywhere'}}>
 <p><strong>Status: {label(item.status)}</strong> · {item.created_at?new Date(item.created_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'}):''}</p>
 {fieldNames.map(k=><p key={k}><strong>{k.replaceAll('_',' ')}:</strong> {label(item[k])}</p>)}
 <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{(tab==='customer_bookings'?['pending','confirmed','cancelled']:['pending','approved','rejected']).map(s=><button key={s} disabled={loading||item.status===s} onClick={()=>changeStatus(item.id,s)} style={{padding:9}}>{s}</button>)}</div></article>)}
 </>}</div>}
 {message&&<p role="status" style={{padding:12,background:'#fff2df'}}>{message}</p>}
 <p style={{fontSize:12,color:'#527368'}}>Access to records is enforced by Supabase RLS. A signed-in user is not automatically an admin.</p>
 </div></main>
}
