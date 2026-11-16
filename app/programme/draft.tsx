'use client';
import {useState} from 'react';

const days=[
 {date:'Monday 22 February 2027',theme:'Opening and scientific exchange',rows:[
   ['08:30–09:30','Delegate check-in and welcome'],
   ['09:30–10:30','Opening ceremony and conference introduction'],
   ['10:45–12:15','Proposed keynote presentations I and II (speakers to be confirmed)'],
   ['13:15–14:45','Scientific plenary and Humboldt networking'],
   ['15:00–16:30','Research discussions and poster exchange']
 ]},
 {date:'Tuesday 23 February 2027',theme:'Interdisciplinary science and innovation',rows:[
   ['09:00–10:30','Proposed keynote III and questions'],
   ['10:45–12:30','Parallel biodiversity, climate and food-security research tracks'],
   ['13:30–15:00','Technical presentations and discussions'],
   ['15:15–16:30','Poster sessions and research collaboration forum']
 ]},
 {date:'Wednesday 24 February 2027',theme:'Young researchers and community engagement',rows:[
   ['09:00–10:30','Early-career researcher presentations and mentoring'],
   ['10:45–12:15','Proposed keynote IV / interdisciplinary panel'],
   ['13:15–15:30','Technical workshops or optional local field engagement'],
   ['15:45–17:00','Scientific synthesis and proposed closing resolutions']
 ]},
 {date:'Thursday 25 February 2027',theme:'Follow-up and departure',rows:[
   ['Morning','Optional post-Kolleg networking, subject to committee approval'],
   ['As arranged','Delegate departures and follow-up communication']
 ]}
];
export function DraftProgramme(){
 const [active,setActive]=useState(0);
 return <section className="plain-card" aria-label="Illustrative four-day programme">
   <div className="message warn"><strong>Illustrative programme only.</strong> These activities, times, speakers and venues are not confirmed. This preview demonstrates how the programme could be presented once authorised by the organising committee.</div>
   <div className="app-day-tabs" role="tablist" aria-label="Select a conference day">
     {days.map((d,i)=><button key={i} id={'day-tab-'+i} type="button" role="tab" aria-selected={active===i}
       aria-controls="draft-day-panel" className={active===i?'active':''} onClick={()=>setActive(i)}>Day {i+1}</button>)}
   </div>
   <div role="tabpanel" id="draft-day-panel" aria-labelledby={'day-tab-'+active}>
     <h3>{days[active].date}</h3>
     <p className="help">{days[active].theme}</p>
     <div className="app-table-scroll"><table className="styled-table">
       <thead><tr><th>Time (WAT)</th><th>Illustrative activity</th></tr></thead>
       <tbody>{days[active].rows.map((r,i)=><tr key={i}><td>{r[0]}</td><td>{r[1]}</td></tr>)}</tbody>
     </table></div>
   </div>
 </section>;
}
