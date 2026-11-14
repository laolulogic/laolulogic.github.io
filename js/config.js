/* Site settings — edit here, not in main.js */
window.LL = {
  // Paste your Google Apps Script Web App URL here (see backend/SETUP.md).
  // While empty, forms and bookings fall back to pre-filled WhatsApp / email messages.
  endpoint: 'https://script.google.com/macros/s/AKfycbxFukmYuBZ7_7w36NTmxSaB9d2_T09ODroBLuuI6HR8tJydF258wxcBgdHIlfOQswCf/exec',

  email: 'laolulogic@gmail.com',
  whatsapp: '2349169731457',          // international format, digits only
  phoneDisplay: '+234 916 973 1457',

  // Booking availability (used for the slot picker; the backend also checks your Google Calendar)
  ownerTimeZoneOffset: 1,             // Africa/Lagos = UTC+1, no daylight saving
  dayStartHour: 7,                    // 07:00 Lagos
  dayEndHour: 23,                     // 23:00 Lagos
  workDays: [0, 1, 2, 3, 4, 5, 6],    // 0 = Sunday
  slotMinutes: 30,
  minNoticeHours: 4,
  daysAhead: 21
};
