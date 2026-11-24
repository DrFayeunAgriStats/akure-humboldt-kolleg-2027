'use client';
import {useState} from 'react';
import {OUTLINE_DAYS} from '@/lib/programme-outline';

const days=OUTLINE_DAYS;
export function DraftProgramme(){
 const [active,setActive]=useState(0);
 return <section className="plain-card" aria-label="Outline four-day programme">
   <div className="message" role="note"><strong>Outline programme.</strong> Times, sessions and speakers are provisional and will be confirmed by the organising committee.</div>
   <div className="app-day-tabs" role="tablist" aria-label="Select a programme day">
     {days.map((d,i)=><button key={i} id={'day-tab-'+i} type="button" role="tab" aria-selected={active===i}
       aria-controls="draft-day-panel" className={active===i?'active':''} onClick={()=>setActive(i)}>{i === 0 ? 'Pre-conference' : 'Day ' + i}</button>)}
   </div>
   <div role="tabpanel" id="draft-day-panel" aria-labelledby={'day-tab-'+active}>
     <h2>{days[active].date}</h2>
     <p className="help">{days[active].theme}</p>
     <div className="app-table-scroll" role="region" aria-label={days[active].date+' schedule'} tabIndex={0}><table className="styled-table">
       <thead><tr><th scope="col">Time (WAT)</th><th scope="col">Activity</th></tr></thead>
       <tbody>{days[active].rows.map((r,i)=><tr key={i}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody>
     </table></div>
   </div>
 </section>;
}
