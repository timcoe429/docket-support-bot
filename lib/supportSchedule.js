/**
 * Docket Websites desk availability (Mountain Time via America/Denver).
 * Used to inject accurate client expectations into Claude's system prompt.
 */

const TZ = 'America/Denver';

/** YYYY-MM-DD in Denver calendar */
export function denverCalendarDate(date = new Date()) {
    const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    return fmt.format(date); // en-CA → YYYY-MM-DD
}

function denverWeekdayLong(date = new Date()) {
    return new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        weekday: 'long'
    }).format(date);
}

function denverMinuteOfDay(date = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    }).formatToParts(date);

    let hour = '0';
    let minute = '0';
    for (const p of parts) {
        if (p.type === 'hour') hour = p.value;
        if (p.type === 'minute') minute = p.value;
    }
    return parseInt(hour, 10) * 60 + parseInt(minute, 10);
}

/** US federal closures we treat as desk-closed days (calendar + common Monday observances where applicable). */
const FEDERAL_CLOSED_DATES = new Set([
    // 2025
    '2025-01-01',
    '2025-01-20',
    '2025-02-17',
    '2025-05-26',
    '2025-06-19',
    '2025-07-04',
    '2025-09-01',
    '2025-10-13',
    '2025-11-11',
    '2025-11-27',
    '2025-12-25',
    // 2026 (July 4 Saturday → Fri Jul 3 observed in many workplaces)
    '2026-01-01',
    '2026-01-19',
    '2026-02-16',
    '2026-05-25',
    '2026-06-19',
    '2026-07-03',
    '2026-09-07',
    '2026-10-12',
    '2026-11-11',
    '2026-11-26',
    '2026-12-25',
    // 2027 forward (extend annually)
    '2027-01-01',
    '2027-01-18',
    '2027-02-15',
    '2027-05-31',
    '2027-06-18',
    '2027-07-05',
    '2027-09-06',
    '2027-10-11',
    '2027-11-11',
    '2027-11-25',
    '2027-12-24',
    '2028-01-17',
    '2028-02-21',
    '2028-05-29',
    '2028-06-19',
    '2028-07-04',
    '2028-09-04',
    '2028-11-10',
    '2028-11-23',
    '2028-12-25'
]);

export function analyzeSupportDesk(date = new Date()) {
    const ymd = denverCalendarDate(date);
    const weekday = denverWeekdayLong(date);
    const displayMoment = new Intl.DateTimeFormat('en-US', {
        timeZone: TZ,
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    }).format(date);

    const isWeekend = weekday === 'Saturday' || weekday === 'Sunday';
    const isFed = FEDERAL_CLOSED_DATES.has(ymd);
    const mins = denverMinuteOfDay(date);
    const inDeskHours = mins >= 7 * 60 && mins < 17 * 60;

    let closedBucket = null;
    if (isWeekend) closedBucket = 'weekend';
    else if (isFed) closedBucket = 'federal_holiday';
    else if (!inDeskHours && mins < 7 * 60) closedBucket = 'before_hours';
    else if (!inDeskHours) closedBucket = 'after_hours';

    const deskOpen = !closedBucket;
    let statusLine;
    let expectationLine;

    if (deskOpen) {
        statusLine = 'DESK OPEN (Monday–Friday, between 7:00 AM – 5:00 PM Mountain Time).';
        expectationLine =
            'You can give practical help immediately. Faster replies typically happen within business hours — do NOT promise instant human takeover, exact countdowns, same-day SLA, or phone callbacks. Align with INTERNAL REFERENCE DOCS on timelines.';
    } else {
        const why =
            closedBucket === 'weekend'
                ? 'Weekend.'
                : closedBucket === 'federal_holiday'
                  ? 'US federal holiday.'
                  : closedBucket === 'before_hours'
                    ? 'Before 7:00 AM Mountain Time.'
                    : 'After 5:00 PM Mountain Time.';

        statusLine = `DESK CLOSED — ${why}`;

        expectationLine =
            'Be upfront: Websites team proactively follows up by email starting the **next business day** (Monday–Friday, excludes weekends / listed US federal holidays). They can still chat for self-help. If escalate_to_team runs off-hours, internal Slack might alert overnight — do **NOT** imply someone will respond tonight or before the next desk day. Stay email-first and patient.';
    }

    return {
        displayMoment,
        deskOpen,
        closedBucket,
        weekday,
        ymdDenver: ymd,
        statusLine,
        expectationLine
    };
}

/**
 * Prepended ahead of INTERNAL REFERENCE DOCS on each model call.
 */
export function buildSupportAvailabilitySystemSection(date = new Date()) {
    const a = analyzeSupportDesk(date);
    return `--- LIVE WEBSITE DESK STATUS (prioritize over guesswork — use THIS for turnaround promises) ---
Current moment (US Mountain Time, America/Denver): ${a.displayMoment}

Published desk hours for the **Docket Websites team** via websites@yourdocket.com and this widget: Monday through Friday, 7:00 AM – 5:00 PM US Mountain Time. Closed Saturdays, Sundays, and the US federal holiday dates mirrored in INTERNAL REFERENCE DOCS.

STATUS: ${a.statusLine}

Client expectation for this reply: ${a.expectationLine}
---
`;
}
