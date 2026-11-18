'use client';
import {FormEvent,useCallback,useEffect,useMemo,useState} from 'react';
import {useToast} from '@/components/ToastProvider';
import {STATUS_LABEL} from '@/lib/labels';
import {abstractReference,registrationReference} from '@/lib/conference-mode-shared';

type Abstract={id:string;is_demo:boolean;serial_number:number;title:string;track:number;status:string;author_name:string;institution:string;is_published:boolean};
type Registration={id:string;is_demo:boolean;serial_number:number;full_name:string;institution:string;email:string;category:string};
type Report={abstract_id:string;reviewer_id:string;reviewer_email:string;relevance:number;rigour:number;clarity:number;impact:number;recommendation:string;comments:string;updated_at:string};
type Count={abstract_id:string;count:number};
type Reviewer={id:string;email:string};

export function OrganiserPanel({registrations,abstracts,reports,assignmentCounts}:{registrations:Registration[];abstracts:Abstract[];reports:Report[];assignmentCounts:Count[]}){
  const toast=useToast(),[papers,setPapers]=useState(abstracts),[busy,setBusy]=useState(false);
  const [reviewers,setReviewers]=useState<Reviewer[]>([]),[reviewerChoices,setChoices]=useState<Record<string,string>>({});
  const [reviewerEmail,setReviewerEmail]=useState(''),[roleBusy,setRoleBusy]=useState(false);
  const [feedback,setFeedback]=useState('');
  const reportMap=useMemo(()=>{
    const map=new Map<string,Report[]>();for(const r of reports)map.set(r.abstract_id,[...(map.get(r.abstract_id)||[]),r]);
    return map;
  },[reports]);
  const assignedMap=new Map(assignmentCounts.map(x=>[x.abstract_id,x.count]));
  const loadReviewers=useCallback(async()=>{
    try{const res=await fetch('/api/organiser/reviewers',{cache:'no-store'});const data=await res.json();
      if(!res.ok)throw new Error(data.error||'Could not load reviewers');
      setReviewers(data.reviewers||[]);
    }catch(e){toast(e instanceof Error?e.message:'Could not load reviewers.','error');}
  },[toast]);
  useEffect(()=>{void loadReviewers();},[loadReviewers]);

  async function grantReviewer(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setRoleBusy(true);
    try{
      const res=await fetch('/api/organiser/reviewers',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:reviewerEmail.trim()})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Could not grant reviewer access.');
      toast('Reviewer access granted to '+data.reviewer.email+'.','success');
      setReviewerEmail('');await loadReviewers();
    }catch(e){toast(e instanceof Error?e.message:'Could not grant reviewer access.','error');}
    finally{setRoleBusy(false);}
  }

  async function revokeReviewer(r:Reviewer){
    if(!window.confirm('Remove reviewer access for '+r.email+'? Their saved reviews are kept, but they will no longer be able to open or edit assigned abstracts.'))return;
    setRoleBusy(true);
    try{
      const res=await fetch('/api/organiser/reviewers',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({user_id:r.id})});
      const data=await res.json().catch(()=>({}));
      if(!res.ok)throw new Error(data.error||'Could not remove reviewer access.');
      toast('Reviewer access removed for '+r.email+'.','success');
      await loadReviewers();
    }catch(e){toast(e instanceof Error?e.message:'Could not remove reviewer access.','error');}
    finally{setRoleBusy(false);}
  }

  async function assign(abstract_id:string){
    const reviewer_id=reviewerChoices[abstract_id];
    if(!reviewer_id)return toast('Choose a reviewer first.','error');
    setBusy(true);
    try{
      const res=await fetch('/api/organiser/assign-reviewer',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({abstract_id,reviewer_id})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Assignment failed');
      setPapers(list=>list.map(a=>a.id===abstract_id?{...a,status:'under_review'}:a));
      const msg='Reviewer assigned.'+(data.notified?' Email notification sent.':' Email delivery not confirmed.');
      setFeedback(msg);toast(msg,'success');
    }catch(e){toast(e instanceof Error?e.message:'Assignment failed','error');}
    finally{setBusy(false);}
  }

  async function change(id:string,status:string,published:boolean){
    setBusy(true);
    try{
      const res=await fetch('/api/organiser/abstract-status',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,status,is_published:published})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||'Could not save decision.');
      setPapers(list=>list.map(a=>a.id===id?{...a,status,is_published:published}:a));
      const msg='Decision saved.'+(data.notification_required?(data.notified?' Author notified by email.':' Email delivery not confirmed; the author can see the status in their dashboard.'):'');
      setFeedback(msg);toast(msg,'success');
    }catch(e){toast(e instanceof Error?e.message:'Could not save decision.','error');}
    finally{setBusy(false);}
  }

  const bars=[1,2,3,4,5].map(track=>({track,count:papers.filter(a=>a.track===track).length}));
  return <>
    <div className="plain-card">
      <h3>Authorise a conference reviewer</h3>
      <p className="help">The reviewer must first sign in to the conference portal with their own email. Only reviewer access can be granted here; organiser access is controlled separately.</p>
      <form onSubmit={grantReviewer} className="app-inline-form">
        <label htmlFor="reviewer-email">Registered reviewer email</label>
        <input id="reviewer-email" type="email" required value={reviewerEmail} onChange={e=>setReviewerEmail(e.target.value)} placeholder="reviewer@university.edu"/>
        <button className="app-button" disabled={roleBusy}>{roleBusy?'Granting…':'Grant reviewer access'}</button>
      </form>
      <h4>Current reviewers</h4>
      {reviewers.length?<ul className="reviewer-list">{reviewers.map(r=><li key={r.id}><span>{r.email}</span>
        <button type="button" className="app-btn-link" disabled={roleBusy} onClick={()=>void revokeReviewer(r)}>Remove access<span className="sr-only"> for {r.email}</span></button></li>)}</ul>
        :<p className="help">No reviewers authorised yet.</p>}
    </div>
    <div className="plain-card"><h3>Abstracts by scientific track</h3>
      {bars.map(b=><div className="filter-row" key={b.track}>
        <span className="track-label">Sub-theme {b.track}</span>
        <div className="track-bar" style={{width:b.count===0?0:Math.min(100,Math.max(4,b.count*4))+'%'}} aria-hidden="true"/>
        <strong>{b.count}</strong>
      </div>)}
    </div>
    <div className="plain-card">
      <h3>Review reports & committee decisions</h3>
      <p className="help">The committee can inspect saved reviewer scores and comments. A scientific acceptance or rejection requires at least one completed review. Test records cannot be released publicly.</p>
      {feedback&&<div role="status" className="message">{feedback}</div>}
      <div className="app-table-scroll" role="region" aria-label="Abstract decisions table" tabIndex={0}><table className="styled-table">
        <thead><tr><th>Reference & author</th><th>Track</th><th>Peer-review evidence</th><th>Committee decision</th><th>Assign reviewer</th><th>Public release</th></tr></thead>
        <tbody>{papers.map(a=>{
          const myReports=reportMap.get(a.id)||[];
          const assigned=assignedMap.get(a.id)||0;
          const ref=abstractReference(a.serial_number,a.is_demo);
          return <tr key={a.id}>
            <td><strong>{ref}</strong><p>{a.title}</p><p className="help">{a.author_name} · {a.institution}</p></td>
            <td>{a.track}</td>
            <td><strong>{myReports.length} completed / {assigned} assigned</strong>
              {myReports.length?myReports.map((r,i)=><details key={r.reviewer_id+'-'+i} className="app-review-details">
                <summary>{r.reviewer_email}: {r.recommendation}</summary>
                <p className="help">Relevance {r.relevance}/5 · Rigour {r.rigour}/5 · Clarity {r.clarity}/5 · Impact {r.impact}/5</p>
                <p>{r.comments}</p><p className="help">Updated: {new Date(r.updated_at).toLocaleString()}</p>
              </details>):<p className="help">Awaiting review assessment.</p>}
            </td>
            <td><label className="sr-only" htmlFor={'decision-'+a.id}>Scientific decision for {ref}</label>
              <select id={'decision-'+a.id} className="app-input-inline" value={a.status} disabled={busy}
                onChange={e=>void change(a.id,e.target.value,false)}>
                {['submitted','under_review','accepted','rejected'].map(t=><option key={t} value={t} disabled={['accepted','rejected'].includes(t)&&!myReports.length&&t!==a.status}>{STATUS_LABEL[t]}</option>)}
              </select>
            </td>
            <td><div className="app-assign-row">
              <label className="sr-only" htmlFor={'reviewer-'+a.id}>Assign reviewer for {ref}</label>
              <select id={'reviewer-'+a.id} className="app-input-inline" value={reviewerChoices[a.id]||''} disabled={busy}
                onChange={e=>setChoices(current=>({...current,[a.id]:e.target.value}))}>
                <option value="">Select reviewer</option>
                {reviewers.map(r=><option value={r.id} key={r.id}>{r.email}</option>)}
              </select>
              <button type="button" className="app-button" disabled={busy||!['submitted','under_review'].includes(a.status)}
                onClick={()=>void assign(a.id)}>Assign</button>
            </div></td>
            <td>{a.is_demo?<span className="help">Test record: public release disabled</span>:
              <label><input type="checkbox" checked={a.is_published} disabled={busy||a.status!=='accepted'}
                onChange={e=>void change(a.id,a.status,e.target.checked)}/> In public book</label>}
            </td>
          </tr>;
        })}</tbody>
      </table></div>
    </div>
    <div className="plain-card"><h3>Registration and abstract exports</h3>
      <p><a className="app-button" href="/api/organiser/export?table=registrations">Download registration CSV</a>{' '}
        <a className="app-button" href="/api/organiser/export?table=abstracts">Download abstract CSV</a></p>
      <div className="app-table-scroll" role="region" aria-label="Latest registrations table" tabIndex={0}><table className="styled-table">
        <thead><tr><th>Registration reference</th><th>Delegate</th><th>Institution</th><th>Category</th></tr></thead>
        <tbody>{registrations.map(r=><tr key={r.id}>
          <td>{registrationReference(r.serial_number,r.is_demo)}</td>
          <td>{r.full_name}</td><td>{r.institution}</td><td>{r.category}</td>
        </tr>)}</tbody>
      </table></div>
    </div>
  </>;
}
