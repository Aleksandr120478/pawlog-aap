interface ICSEvent {
  id: string;
  title: string;
  description: string;
  date: string;
}

export function generateICS(events: ICSEvent[]): string {
  let icsContent = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//PawLog//RU\r\nCALSCALE:GREGORIAN\r\n';
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  events.forEach((event) => {
    const formattedDate = event.date.replace(/-/g, '');
    icsContent += 'BEGIN:VEVENT\r\n';
    icsContent += `UID:${event.id}@pawlog.app\r\n`;
    icsContent += `DTSTAMP:${now}\r\n`;
    icsContent += `DTSTART;VALUE=DATE:${formattedDate}\r\n`;
    icsContent += `SUMMARY:${event.title}\r\n`;
    if (event.description) {
      const safeDesc = event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
      icsContent += `DESCRIPTION:${safeDesc}\r\n`;
    }
    icsContent += 'END:VEVENT\r\n';
  });

  icsContent += 'END:VCALENDAR';
  return icsContent;
}