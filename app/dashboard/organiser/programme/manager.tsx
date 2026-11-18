'use client';
import {FormEvent,useState} from 'react';
import {createBrowserClient} from '@supabase/ssr';
import {SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY} from '@/lib/supabase/public-config';
import {useToast} from '@/components/ToastProvider';

type Session={id:string;title:string;description:string|null;starts_at:string;ends_at:string;room:string|null;session_type:string;published:boolean};
type Speaker={id:string;name:string;institution:string|null;talk_title:string|null;short_bio:string|null;photo_url:string|null;published:boolean;sort_order:number};
type SessionForm={id:string;title:string;description:string;starts_at:string;ends_at:string;room:string;session_type:string;published:boolean};
type SpeakerForm={id:string;name:string;institution:string;talk_title:string;short_bio:string;photo_url:string;published:boolean};
const newSession:SessionForm={id:'',title:'',description:'',starts_at:'2027-02-22T09:00',ends_at:'2027-02-22T10:00',room:'',session_type:'technical',published:false};
const newSpeaker:SpeakerForm={id:'',name:'',institution:'',talk_title:'',short_bio:'',photo_url:'',published:false};
const toWAT=(value:string)=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Africa/Lagos',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value)).replace(' ','T');
const fromWAT=(value:string)=>new Date(value+':00+01:00').toISOString();
const formatDate=(date:string)=>new Date(date).toLocaleString('en-NG',{timeZone:'Africa/Lagos',dateStyle:'medium',timeStyle:'short'})+' WAT';

export function ConferenceContentManager({initialSessions,initialSpeakers}:{initialSessions:Session[];initialSpeakers:Speaker[]}){
  const [sessions,setSessions]=useState(initialSessions),[speakers,setSpeakers]=useState(initialSpeakers);
  const [sessionForm,setSessionForm]=useState<SessionForm>(newSession),[speakerForm,setSpeakerForm]=useState<SpeakerForm>(newSpeaker);
  const [busy,setBusy]=useState(false),toast=useToast();
  function client(){
    if(!SUPABASE_PUBLIC_URL||!SUPABASE_PUBLIC_KEY)throw new Error('Conference authentication unavailable.');
    return createBrowserClient(SUPABASE_PUBLIC_URL,SUPABASE_PUBLIC_KEY);
  }
  function handleError(err:unknown){toast(err instanceof Error?err.message:'Could not save changes.','error');}

  async function saveSession(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);
    try{
      if(sessionForm.title.trim().length<5)throw new Error('A session title must contain at least five characters.');
      const starts_at=fromWAT(sessionForm.starts_at),ends_at=fromWAT(sessionForm.ends_at);
      if(Date.parse(ends_at)<=Date.parse(starts_at))throw new Error('The session must end after it begins.');
      const payload={title:sessionForm.title.trim(),description:sessionForm.description.trim()||null,starts_at,ends_at,
        room:sessionForm.room.trim()||null,session_type:sessionForm.session_type,published:sessionForm.published};
      const db=client();
      const r=sessionForm.id?
        await db.from('sessions').update(payload).eq('id',sessionForm.id).select('id,title,description,starts_at,ends_at,room,session_type,published').single():
        await db.from('sessions').insert(payload).select('id,title,description,starts_at,ends_at,room,session_type,published').single();
      if(r.error||!r.data)throw new Error(r.error?.message||'Could not save session.');
      const saved=r.data as Session;
      setSessions(items=>[...items.filter(x=>x.id!==saved.id),saved].sort((a,b)=>a.starts_at.localeCompare(b.starts_at)));
      setSessionForm({...newSession});
      toast('Session saved. '+(saved.published?'It is visible on the programme page.':'It remains unpublished.'),'success');
    }catch(e){handleError(e);}finally{setBusy(false);}
  }
  async function toggleSession(row:Session){
    setBusy(true);
    try{
      const r=await client().from('sessions').update({published:!row.published}).eq('id',row.id)
        .select('id,title,description,starts_at,ends_at,room,session_type,published').single();
      if(r.error||!r.data)throw new Error(r.error?.message||'Update failed.');
      setSessions(items=>items.map(item=>item.id===row.id?r.data as Session:item));
      toast(r.data.published?'Session published.':'Session hidden from public programme.','success');
    }catch(e){handleError(e);}finally{setBusy(false);}
  }
  async function deleteSession(row:Session){
    if(!window.confirm('Delete session "'+row.title+'"? This will remove it from the programme.'))return;
    setBusy(true);
    try{const r=await client().from('sessions').delete().eq('id',row.id);
      if(r.error)throw r.error;
      setSessions(items=>items.filter(item=>item.id!==row.id));
      toast('Session deleted.','success');
    }catch(e){handleError(e);}finally{setBusy(false);}
  }
  async function saveSpeaker(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);
    try{
      if(speakerForm.name.trim().length<3)throw new Error('Enter the speaker name.');
      if(speakerForm.photo_url.trim()&&!/^https:\/\//i.test(speakerForm.photo_url.trim()))throw new Error('Speaker photo URL must start with https://');
      const payload={name:speakerForm.name.trim(),institution:speakerForm.institution.trim()||null,
        talk_title:speakerForm.talk_title.trim()||null,short_bio:speakerForm.short_bio.trim()||null,
        photo_url:speakerForm.photo_url.trim()||null,published:speakerForm.published};
      const db=client();
      const r=speakerForm.id?
        await db.from('speakers').update(payload).eq('id',speakerForm.id)
          .select('id,name,institution,talk_title,short_bio,photo_url,published,sort_order').single():
        await db.from('speakers').insert(payload)
          .select('id,name,institution,talk_title,short_bio,photo_url,published,sort_order').single();
      if(r.error||!r.data)throw new Error(r.error?.message||'Could not save speaker.');
      const saved=r.data as Speaker;
      setSpeakers(items=>[...items.filter(s=>s.id!==saved.id),saved].sort((a,b)=>a.name.localeCompare(b.name)));
      setSpeakerForm({...newSpeaker});
      toast('Speaker saved. '+(saved.published?'Visible on the website.':'Unpublished.'),'success');
    }catch(e){handleError(e);}finally{setBusy(false);}
  }
  async function toggleSpeaker(row:Speaker){
    setBusy(true);
    try{
      const r=await client().from('speakers').update({published:!row.published}).eq('id',row.id)
        .select('id,name,institution,talk_title,short_bio,photo_url,published,sort_order').single();
      if(r.error||!r.data)throw new Error(r.error?.message||'Could not update speaker.');
      setSpeakers(items=>items.map(s=>s.id===row.id?r.data as Speaker:s));
      toast(r.data.published?'Speaker published.':'Speaker unpublished.','success');
    }catch(e){handleError(e);}finally{setBusy(false);}
  }
  async function deleteSpeaker(row:Speaker){
    if(!window.confirm('Delete the speaker record for '+row.name+'?'))return;
    setBusy(true);
    try{const r=await client().from('speakers').delete().eq('id',row.id);
      if(r.error)throw r.error;
      setSpeakers(items=>items.filter(s=>s.id!==row.id));toast('Speaker deleted.','success');
    }catch(e){handleError(e);}finally{setBusy(false);}
  }
  return <div className="conference-admin">
    <section className="plain-card" aria-labelledby="sessions-heading">
      <h2 id="sessions-heading">Programme sessions</h2>
      <p className="help">Create a draft session, edit its timing in West Africa Time (WAT), and explicitly publish it. Dates and venues should reflect approved information, not invented details.</p>
      <div className="app-table-scroll" role="region" aria-label="Sessions table" tabIndex={0}><table className="styled-table">
        <thead><tr><th>Date & time (WAT)</th><th>Session</th><th>Room</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{sessions.length?sessions.map(s=><tr key={s.id}>
          <td>{formatDate(s.starts_at)} – {new Date(s.ends_at).toLocaleTimeString('en-NG',{timeZone:'Africa/Lagos',hour:'2-digit',minute:'2-digit'})}</td>
          <td><strong>{s.title}</strong><p className="help">{s.session_type} · {s.description||'No description'}</p></td>
          <td>{s.room||'Not assigned'}</td>
          <td>{s.published?'Published':'Draft'}</td>
          <td><div className="app-assign-row">
            <button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>setSessionForm({
              id:s.id,title:s.title,description:s.description||'',starts_at:toWAT(s.starts_at),ends_at:toWAT(s.ends_at),
              room:s.room||'',session_type:s.session_type,published:s.published
            })}>Edit</button>
            <button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>void toggleSession(s)}>{s.published?'Unpublish':'Publish'}</button>
            <button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>void deleteSession(s)}>Delete</button>
          </div></td>
        </tr>):<tr><td colSpan={5}>No organiser sessions added. The public site displays a clearly labelled illustrative programme.</td></tr>}</tbody>
      </table></div>
      <form className="app-form" onSubmit={saveSession}>
        <h3>{sessionForm.id?'Edit existing session':'Create programme session'}</h3>
        <label>Session title<input required maxLength={180} value={sessionForm.title}
          onChange={e=>setSessionForm(p=>({...p,title:e.target.value}))}/></label>
        <label>Session description (optional)<textarea rows={3} maxLength={1500} value={sessionForm.description}
          onChange={e=>setSessionForm(p=>({...p,description:e.target.value}))}/></label>
        <div className="app-field-grid">
          <label>Start (WAT)<input type="datetime-local" required value={sessionForm.starts_at}
            onChange={e=>setSessionForm(p=>({...p,starts_at:e.target.value}))}/></label>
          <label>End (WAT)<input type="datetime-local" required value={sessionForm.ends_at}
            onChange={e=>setSessionForm(p=>({...p,ends_at:e.target.value}))}/></label>
        </div>
        <div className="app-field-grid">
          <label>Session type<select value={sessionForm.session_type} onChange={e=>setSessionForm(p=>({...p,session_type:e.target.value}))}>
            <option value="keynote">Keynote</option><option value="technical">Technical</option>
            <option value="poster">Poster</option><option value="social">Networking / social</option>
          </select></label>
          <label>Room or venue (optional)<input maxLength={150} value={sessionForm.room}
            onChange={e=>setSessionForm(p=>({...p,room:e.target.value}))}/></label>
        </div>
        <label className="checkbox-row"><input type="checkbox" checked={sessionForm.published}
          onChange={e=>setSessionForm(p=>({...p,published:e.target.checked}))}/> Publish this session on the website</label>
        <div className="app-assign-row">
          <button type="submit" disabled={busy}>{busy?'Saving…':sessionForm.id?'Save changes':'Add session'}</button>
          {sessionForm.id&&<button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>setSessionForm({...newSession})}>Cancel edit</button>}
        </div>
      </form>
    </section>
    <section className="plain-card" aria-labelledby="speakers-heading">
      <h2 id="speakers-heading">Speakers</h2>
      <p className="help">Add only real, confirmed or authorised speaker details. Draft entries remain private to organisers.</p>
      <div className="app-table-scroll" role="region" aria-label="Speakers table" tabIndex={0}><table className="styled-table">
        <thead><tr><th>Name</th><th>Institution</th><th>Presentation</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>{speakers.length?speakers.map(s=><tr key={s.id}>
          <td><strong>{s.name}</strong></td><td>{s.institution||'Not set'}</td><td>{s.talk_title||'Not set'}</td><td>{s.published?'Published':'Draft'}</td>
          <td><div className="app-assign-row">
            <button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>setSpeakerForm({
              id:s.id,name:s.name,institution:s.institution||'',talk_title:s.talk_title||'',short_bio:s.short_bio||'',photo_url:s.photo_url||'',published:s.published
            })}>Edit</button>
            <button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>void toggleSpeaker(s)}>{s.published?'Unpublish':'Publish'}</button>
            <button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>void deleteSpeaker(s)}>Delete</button>
          </div></td>
        </tr>):<tr><td colSpan={5}>No confirmed speakers have been added.</td></tr>}</tbody>
      </table></div>
      <form className="app-form" onSubmit={saveSpeaker}>
        <h3>{speakerForm.id?'Edit speaker':'Add a speaker'}</h3>
        <label>Speaker name<input required maxLength={150} value={speakerForm.name}
          onChange={e=>setSpeakerForm(p=>({...p,name:e.target.value}))}/></label>
        <label>Institution<input maxLength={180} value={speakerForm.institution}
          onChange={e=>setSpeakerForm(p=>({...p,institution:e.target.value}))}/></label>
        <label>Presentation title<input maxLength={220} value={speakerForm.talk_title}
          onChange={e=>setSpeakerForm(p=>({...p,talk_title:e.target.value}))}/></label>
        <label>Short profile<textarea rows={3} maxLength={1500} value={speakerForm.short_bio}
          onChange={e=>setSpeakerForm(p=>({...p,short_bio:e.target.value}))}/></label>
        <label>Photo URL (optional; HTTPS)<input type="url" maxLength={600} value={speakerForm.photo_url}
          onChange={e=>setSpeakerForm(p=>({...p,photo_url:e.target.value}))}/></label>
        <label className="checkbox-row"><input type="checkbox" checked={speakerForm.published}
          onChange={e=>setSpeakerForm(p=>({...p,published:e.target.checked}))}/> Publish speaker details on the website</label>
        <div className="app-assign-row">
          <button disabled={busy}>{busy?'Saving…':speakerForm.id?'Save changes':'Add speaker'}</button>
          {speakerForm.id&&<button type="button" className="app-button app-btn-secondary" disabled={busy} onClick={()=>setSpeakerForm({...newSpeaker})}>Cancel edit</button>}
        </div>
      </form>
    </section>
  </div>;
}
