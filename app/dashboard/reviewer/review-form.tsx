'use client';
import {FormEvent,useState} from 'react';

type Prior={relevance:number;rigour:number;clarity:number;impact:number;recommendation:string;comments:string};
export function ReviewForm({assignmentId,initialReview}:{assignmentId:string;initialReview?:Prior}){
  const [busy,setBusy]=useState(false),[saved,setSaved]=useState(Boolean(initialReview));
  const [message,setMessage]=useState('');
  async function submit(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setMessage('');
    try{
      const data=Object.fromEntries(new FormData(e.currentTarget).entries());
      const response=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,assignment_id:assignmentId})});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error||'Review could not be saved.');
      setSaved(true);setMessage('Assessment saved. The organiser can now inspect your recommendation.');
    }catch(e){
      const msg=e instanceof Error?e.message:'Network error. Try again.';
      setMessage(msg);
    }finally{setBusy(false);}
  }
  return <form className="app-form" onSubmit={submit}>
    <h3>Scientific assessment {saved?<span className="pill">Saved — editable</span>:null}</h3>
    <p className="help">Score each criterion from 1 (poor) to 5 (excellent). Your recommendation is advisory; the organiser makes the decision.</p>
    {(['relevance','rigour','clarity','impact'] as const).map(field=><label key={field}>
      {field[0].toUpperCase()+field.slice(1)}
      <select name={field} required defaultValue={initialReview?.[field]??''}>
        <option value="" disabled>Select score</option>
        {[1,2,3,4,5].map(n=><option key={n} value={n}>{n} / 5</option>)}
      </select>
    </label>)}
    <label>Recommendation
      <select name="recommendation" required defaultValue={initialReview?.recommendation||''}>
        <option value="" disabled>Select recommendation</option>
        <option value="accept">Recommend acceptance</option>
        <option value="revise">Recommend revision</option>
        <option value="reject">Recommend rejection</option>
      </select>
    </label>
    <label>Reviewer comments
      <textarea name="comments" defaultValue={initialReview?.comments||''} required minLength={15} maxLength={4000} rows={5}/>
    </label>
    <button disabled={busy}>{busy?'Saving…':saved?'Update assessment':'Submit assessment'}</button>
    {message&&<div role={saved?'status':'alert'} className={'message '+(saved?'success':'error')}>{message}</div>}
  </form>;
}
