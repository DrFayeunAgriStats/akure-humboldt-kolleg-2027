import {join} from 'node:path';
import PDFDocument from 'pdfkit';
import {CONTACT, CONFERENCE} from './site-content';

type AcceptanceDetails = {
  author: string;
  institution: string;
  title: string;
  reference: string;
  issuedAt: Date;
  isDemo: boolean;
};

const green = '#15392F';
const gold = '#B49043';

export function acceptanceLetter(details: AcceptanceDetails): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: 'LETTER',
      margins: {top: 42, bottom: 52, left: 62, right: 62},
      info: {Title: 'Abstract Acceptance Letter', Author: CONFERENCE.name}
    });
    const chunks: Buffer[] = [];
    pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
    pdf.on('error', reject);
    pdf.on('end', () => resolve(Buffer.concat(chunks)));

    const left = pdf.page.margins.left;
    const right = pdf.page.width - pdf.page.margins.right;
    const width = right - left;
    const centre = {width, align: 'center'} as const;

    pdf.registerFont('Letter Body', join(process.cwd(), 'lib/fonts/NotoSans-Regular.ttf'));
    pdf.registerFont('Letter Bold', join(process.cwd(), 'lib/fonts/NotoSans-Bold.ttf'));
    pdf.registerFont('Letter Masthead', join(process.cwd(), 'lib/fonts/NotoSerif-Bold.ttf'));
    pdf.image(join(process.cwd(), 'public/branding/futa-crest.png'), left, 38, {height: 45});
    pdf.image(join(process.cwd(), 'public/branding/avh-supported-by.png'), right - 100, 38, {width: 100});

    pdf.font('Letter Masthead').fontSize(25).text(CONFERENCE.name, left, 96, centre);
    pdf.font('Letter Body').fontSize(11).fillColor(green).text('Local Organising Committee', centre);
    pdf.moveDown(0.35).fillColor('#000000').fontSize(10)
      .text(`${CONFERENCE.dates}  |  Federal University of Technology, Akure, Nigeria`, centre);
    pdf.moveDown(0.35).text(CONFERENCE.theme, centre);
    const headerRule = pdf.y + 10;
    pdf.strokeColor(gold).lineWidth(1).moveTo(left, headerRule).lineTo(right, headerRule).stroke();
    pdf.y = headerRule + 15;

    if (details.isDemo) {
      pdf.font('Letter Bold').fontSize(11).fillColor(green)
        .text('TEST COPY — NOT FOR OFFICIAL USE').moveDown(0.5);
    }

    const author = details.author.replace(/\s+/gu, " ").trim();
    const institution = details.institution.replace(/\s+/gu, " ").trim();
    const title = details.title.replace(/\s+/gu, " ").trim();
    const compact = author.length * 2 + institution.length + title.length > 350;
    const issued = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Lagos'
    }).format(details.issuedAt);
    pdf.font('Letter Body').fontSize(compact ? 9 : 10.5).fillColor('#000000');
    pdf.text(`Date of issue  ${issued}\nAbstract reference  ${details.reference}`).moveDown(0.65);
    pdf.text(`${author}\n${institution}`).moveDown(0.8);

    pdf.font('Letter Bold').fontSize(18).text('Abstract Acceptance Letter').moveDown(0.55);
    pdf.font('Letter Body').fontSize(compact ? 9 : 11);
    const paragraphs = [
      `Dear ${author},`,
      `On behalf of the Local Organising Committee, I am pleased to confirm that your abstract, “${title}”, has been accepted following peer review for presentation at Akure Humboldt Kolleg 2027. The event will take place from 15 to 18 March 2027 at the Federal University of Technology, Akure, Nigeria.`,
      'Monday, 15 March is reserved for arrival and the pre-conference workshop on grant writing. The three-day conference programme runs from Tuesday, 16 March to Thursday, 18 March.',
      'The secretariat will share your presentation format, schedule and instructions once they are confirmed. Participation is free.',
      'For questions about your presentation, please email the conference secretariat and quote your abstract reference.',
      'Yours sincerely,'
    ];
    for (const paragraph of paragraphs) {
      pdf.text(paragraph, {lineGap: compact ? 0 : 1, paragraphGap: compact ? 4 : 7});
    }

    pdf.moveDown(0.7).font('Letter Bold').text(CONTACT.name);
    pdf.font('Letter Body').text('Conference Convener\nFor the Local Organising Committee');

    const footerRule = pdf.page.height - 50;
    pdf.strokeColor(gold).moveTo(left, footerRule).lineTo(right, footerRule).stroke();
    const bottomMargin = pdf.page.margins.bottom;
    pdf.page.margins.bottom = 20;
    pdf.fontSize(10).fillColor(green)
      .text('secretariat@futahumboldtkolleg.org  |  futahumboldtkolleg.org', left, footerRule + 10, centre);
    pdf.page.margins.bottom = bottomMargin;
    pdf.end();
  });
}
