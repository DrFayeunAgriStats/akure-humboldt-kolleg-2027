// Provisional four-day outline. Times, sessions and speakers are NOT confirmed;
// shown only with an "outline" label until the organising committee publishes sessions.
export type OutlineDay = {date: string; short: string; theme: string; rows: [string, string][]};
export const OUTLINE_DAYS: OutlineDay[] = [
 {date:'Monday 22 February 2027',short:'Mon 22 Feb',theme:'Opening and scientific exchange',rows:[
   ['08:30–09:30','Delegate check-in and welcome'],
   ['09:30–10:30','Opening ceremony and conference introduction'],
   ['10:45–12:15','Keynote presentations I and II (speakers to be confirmed)'],
   ['13:15–14:45','Scientific plenary and Humboldt networking'],
   ['15:00–16:30','Research discussions and poster exchange']
 ]},
 {date:'Tuesday 23 February 2027',short:'Tue 23 Feb',theme:'Interdisciplinary science and innovation',rows:[
   ['09:00–10:30','Keynote III and questions'],
   ['10:45–12:30','Parallel biodiversity, climate and food-security research tracks'],
   ['13:30–15:00','Technical presentations and discussions'],
   ['15:15–16:30','Poster sessions and research collaboration forum']
 ]},
 {date:'Wednesday 24 February 2027',short:'Wed 24 Feb',theme:'Young researchers and community engagement',rows:[
   ['09:00–10:30','Early-career researcher presentations and mentoring'],
   ['10:45–12:15','Keynote IV / interdisciplinary panel'],
   ['13:15–15:30','Technical workshops or optional local field engagement'],
   ['15:45–17:00','Scientific synthesis and closing resolutions']
 ]},
 {date:'Thursday 25 February 2027',short:'Thu 25 Feb',theme:'Follow-up and departure',rows:[
   ['Morning','Optional post-Kolleg networking, subject to committee approval'],
   ['As arranged','Delegate departures and follow-up communication']
 ]}
];
