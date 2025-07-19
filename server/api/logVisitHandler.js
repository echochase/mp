// backend/logVisitHandler.js

const GIST_ID = process.env.GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Determine if date is in daylight saving time (AEDT)
function isDaylightSavings(date) {
  const year = date.getUTCFullYear();

  // First Sunday in October
  const dstStart = new Date(Date.UTC(year, 9, 1)); // October 1 UTC
  while (dstStart.getUTCDay() !== 0) dstStart.setUTCDate(dstStart.getUTCDate() + 1);

  // First Sunday in April
  const dstEnd = new Date(Date.UTC(year, 3, 1)); // April 1 UTC
  while (dstEnd.getUTCDay() !== 0) dstEnd.setUTCDate(dstEnd.getUTCDate() + 1);

  // DST starts at 2:00am local = 16:00 UTC previous day in October
  // DST ends at 3:00am local = 16:00 UTC previous day in April
  const dstStartUTC = new Date(dstStart.getTime() - 14 * 60 * 60 * 1000);
  const dstEndUTC = new Date(dstEnd.getTime() - 13 * 60 * 60 * 1000);

  return date >= dstStartUTC || date < dstEndUTC;
}

// Format date to YYYY-MM-DD HH:mm:ss AEST/AEDT
function formatDateAESTorAEDT(date) {
  const isDST = isDaylightSavings(date);
  const offsetHours = isDST ? 11 : 10;
  const offsetMs = offsetHours * 60 * 60 * 1000;
  const localDate = new Date(date.getTime() + offsetMs);

  const YYYY = localDate.getUTCFullYear();
  const MM = String(localDate.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(localDate.getUTCDate()).padStart(2, '0');
  const hh = String(localDate.getUTCHours()).padStart(2, '0');
  const mm = String(localDate.getUTCMinutes()).padStart(2, '0');
  const ss = String(localDate.getUTCSeconds()).padStart(2, '0');

  return `${YYYY}-${MM}-${DD} ${hh}:${mm}:${ss} ${isDST ? 'AEDT' : 'AEST'}`;
}

const handler = async (req, res) => {
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;

  // Use manual AEST/AEDT formatting here:
  const timestamp = formatDateAESTorAEDT(new Date());
  const line = `${timestamp} ${ip}\n`;

  try {
    const gistRes = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'log-ip-script',
      },
    });

    const gistData = await gistRes.json();
    const filename = Object.keys(gistData.files)[0];
    const currentContent = gistData.files[filename].content;
    const updatedContent = currentContent + line;

    await fetch(`https://api.github.com/gists/${GIST_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'User-Agent': 'log-ip-script',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [filename]: { content: updatedContent },
        },
      }),
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Failed to update gist:', err);
    res.status(500).json({ error: 'Failed to update gist' });
  }
};

module.exports = handler;
