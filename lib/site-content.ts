// Approved public conference content (carried over verbatim from the previously
// published homepage). Edit here, not in components, so wording stays consistent.

export const CONFERENCE = {
  name: 'Akure Humboldt Kolleg 2027',
  shortName: 'Akure Humboldt Kolleg',
  theme: 'Biodiversity, Climate Change and Food Security',
  focus: 'The role of science, innovation and community engagement',
  dates: '22–25 February 2027',
  datesLong: 'Monday 22 – Thursday 25 February 2027',
  venue: 'Federal University of Technology, Akure (FUTA)',
  venueShort: 'FUTA, Akure, Nigeria',
  city: 'Akure, Ondo State, Nigeria',
  participation: 'Free participation'
} as const;

export const ABOUT = {
  lead: 'A scientific meeting focused on biodiversity conservation, climate change and food security.',
  paragraphs: [
    'A Humboldt Kolleg brings alumni of the Alexander von Humboldt Foundation together with researchers in the host region. The Akure meeting addresses questions linked across West African farming systems: the management of soils and crop diversity, changing weather conditions and decisions about land use.',
    'The scientific programme is being developed around five sub-themes, with research presentations and discussion among scientists and practitioners.'
  ],
  facts: [
    {value: '4', label: 'Days at FUTA', detail: '22–25 February 2027'},
    {value: '5', label: 'Scientific sub-themes', detail: 'From conservation to new technologies'},
    {value: '₦0', label: 'Participation fee', detail: 'No registration or abstract-submission fee'}
  ]
} as const;

export const AUDIENCE = {
  intro: 'The meeting is intended for researchers and practitioners working on biodiversity, climate and food security, particularly early-career scientists at West African institutions.',
  groups: [
    'Humboldt Foundation alumni',
    'Researchers and academics',
    'Climate and biodiversity professionals',
    'Agricultural scientists',
    'One Health practitioners',
    'Early-career scientists and students',
    'Technology and data innovators'
  ]
} as const;

export const SUBTHEMES_INTRO =
  'The planned call for abstracts covers five sub-themes on biodiversity, climate adaptation, food security, One Health and emerging technologies.';

export const SUBTHEMES = [
  {no: '01', title: 'Climate change, sustainable natural resources, biodiversity conservation and food security',
    text: 'Understanding connected pressures on ecosystems, natural resources and resilient food systems.'},
  {no: '02', title: 'Youth-led innovation for climate-smart agroecological systems and environmental advocacy',
    text: 'Creating space for emerging leaders, youth-driven climate solutions and transformative advocacy.'},
  {no: '03', title: 'Indigenous and nature-based solutions for the biodiversity–climate–food security nexus',
    text: 'Connecting place-based knowledge and nature-positive approaches with scientific evidence.'},
  {no: '04', title: 'One Health approaches, human health and food security under climate change',
    text: 'Investigating how people, ecosystems, health and food systems influence one another.'},
  {no: '05', title: 'Emerging technologies and innovations for the biodiversity–climate–food nexus',
    text: 'Exploring digital tools, data science and new technologies in service of sustainable solutions.'}
] as const;

export const PROGRAMME = {
  summary: 'The programme is being developed to include keynote lectures, research presentations and posters across the five scientific sub-themes.',
  note: 'Session times, speakers and the detailed agenda will be published when finalised.',
  caveat: 'Subject to confirmation by the organising committee.'
} as const;

export const PARTICIPATION_STEPS = [
  {title: 'Register', text: 'Participant details and institutional affiliation'},
  {title: 'Submit an abstract', text: '250–300 words under one of the five sub-themes'},
  {title: 'Track your submission', text: 'Review updates through a private author portal'}
] as const;

export const VENUE = {
  intro: 'FUTA is the host institution for the Kolleg in Akure, Ondo State, south-western Nigeria. Details of the meeting hall, accommodation and travel arrangements will be published with the programme.',
  mapNote: 'The map shows the FUTA campus area. The exact conference hall, entrance and travel arrangements will be confirmed by the organising committee.',
  mapEmbed: 'https://www.openstreetmap.org/export/embed.html?bbox=5.1185%2C7.2960%2C5.1505%2C7.3122&layer=mapnik&marker=7.30409%2C5.13146',
  mapLarger: 'https://www.openstreetmap.org/?mlat=7.30409&mlon=5.13146#map=15/7.30409/5.13146',
  directions: 'https://www.google.com/maps/dir/?api=1&destination=Federal%20University%20of%20Technology%20Akure%2C%20Nigeria',
  locate: 'https://www.google.com/maps/search/?api=1&query=Federal+University+of+Technology+Akure+Nigeria',
  photo: {
    src: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Federal_University_of_Technology%2C_Akure%2C_Ondo_State11.jpg',
    alt: 'Main entrance gate of the Federal University of Technology, Akure',
    credit: 'MediaMOF / Wikimedia Commons',
    creditUrl: 'https://commons.wikimedia.org/wiki/File:Federal_University_of_Technology,_Akure,_Ondo_State11.jpg',
    licence: 'CC BY-SA 4.0',
    licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/'
  }
} as const;

// Approved institutional identities (see ASSET_SOURCES.md). Logos are the approved
// hotlinked files; a text fallback is shown if a remote logo cannot be loaded.
export const INSTITUTIONS = {
  host: {
    role: 'Host institution',
    name: 'Federal University of Technology, Akure',
    short: 'FUTA',
    url: 'https://futa.edu.ng/',
    logo: 'https://space4water.org/s4w/web/sites/default/files/images/organizations/logos/2024-08/AU%2BREC%2Blogos%2B-%2B2022-03-31T140738.693.png',
    logoAlt: 'Federal University of Technology, Akure (FUTA) crest',
    logoWidth: 88, logoHeight: 88
  },
  sponsor: {
    role: 'Sponsored by',
    name: 'Alexander von Humboldt Foundation',
    short: 'AvH',
    url: 'https://www.humboldt-foundation.de/en/',
    logo: 'https://www.humboldt-foundation.de/fileadmin/Entdecken/Organisation/Styleguide/Logo/AvH_Logo_rgb.svg',
    logoAlt: 'Alexander von Humboldt Foundation logo',
    logoWidth: 240, logoHeight: 80
  }
} as const;

export const CONTACT = {
  intro: 'Enquiries about Akure Humboldt Kolleg 2027 may be addressed to the conference convener.',
  name: 'Prof. Jonathan C. Onyekwelu',
  role: 'Conference convener',
  department: 'Department of Forestry and Wood Technology (FWT)',
  institution: 'Federal University of Technology, Akure, Nigeria',
  email: 'jconyekwelu@futa.edu.ng',
  profile: 'https://fwt.futa.edu.ng/home/profile/938',
  note: 'Current conference enquiry email supplied by the organising team; the contact may be updated when a dedicated secretariat mailbox is established.'
} as const;

export const HERO_IMAGE = {
  src: '/assets/nigerian-rainforest-hero.webp',
  alt: 'Lush green tropical forest landscape',
  caption: 'Conceptual artwork: tropical forest landscape'
} as const;
