// Provisional four-day outline. Times, sessions and speakers are NOT confirmed;
// shown only with an "outline" label until the organising committee publishes sessions.
export type OutlineDay = {date: string; short: string; theme: string; rows: [string, string][]};
export const OUTLINE_DAYS: OutlineDay[] = [
 {date:'Monday 15 March 2027',short:'Mon 15 Mar',theme:'Arrival and pre-conference workshop',rows:[
   ['As delegates arrive','Arrival and registration'],
   ['Time to be confirmed','Pre-conference workshop on grant writing']
 ]},
 {date:'Tuesday 16 March 2027',short:'Tue 16 Mar',theme:'Opening and scientific exchange',rows:[
   ['08:30–09:30','Delegate check-in and welcome'],
   ['09:30–10:30','Opening ceremony and conference introduction'],
   ['10:45–12:15','Keynote presentations I and II (speakers to be confirmed)'],
   ['13:15–14:45','Scientific plenary and Humboldt networking'],
   ['15:00–16:30','Research discussions and poster exchange']
 ]},
 {date:'Wednesday 17 March 2027',short:'Wed 17 Mar',theme:'Interdisciplinary science and innovation',rows:[
   ['09:00–10:30','Keynote III and questions'],
   ['10:45–12:30','Parallel biodiversity, climate and food-security research tracks'],
   ['13:30–15:00','Technical presentations and discussions'],
   ['15:15–16:30','Poster sessions and research collaboration forum']
 ]},
 {date:'Thursday 18 March 2027',short:'Thu 18 Mar',theme:'Young researchers and community engagement',rows:[
   ['09:00–10:30','Early-career researcher presentations and mentoring'],
   ['10:45–12:15','Keynote IV / interdisciplinary panel'],
   ['13:15–15:30','Technical workshops or optional local field engagement'],
   ['15:45–17:00','Scientific synthesis and closing resolutions']
 ]}
];
