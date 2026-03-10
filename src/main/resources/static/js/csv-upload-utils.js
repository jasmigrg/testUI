(function initCsvUploadUtils(global) {
  function normalizeHeader(header) {
    return String(header || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function parseCsvLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const next = line[i + 1];
      if (char === '"' && inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values;
  }

  function parseCsvText(text) {
    const lines = String(text || '')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      return { headers: [], normalizedHeaders: [], rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const normalizedHeaders = headers.map(normalizeHeader);
    const rows = lines.slice(1).map((line) => parseCsvLine(line));
    return { headers, normalizedHeaders, rows };
  }

  function toUsDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      return `${isoMatch[2]}/${isoMatch[3]}/${isoMatch[1]}`;
    }

    const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (slashMatch) {
      return `${String(slashMatch[1]).padStart(2, '0')}/${String(slashMatch[2]).padStart(2, '0')}/${slashMatch[3]}`;
    }

    const shortYearMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (shortYearMatch) {
      const year = 2000 + Number(shortYearMatch[3]);
      return `${String(shortYearMatch[1]).padStart(2, '0')}/${String(shortYearMatch[2]).padStart(2, '0')}/${year}`;
    }

    return raw;
  }

  function isValidUsDate(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;

    const month = Number(match[1]);
    const day = Number(match[2]);
    const year = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return false;

    const dt = new Date(year, month - 1, day);
    return dt.getFullYear() === year && dt.getMonth() === month - 1 && dt.getDate() === day;
  }

  function isNumeric(value) {
    const raw = String(value || '').trim();
    return raw !== '' && /^-?\d+(\.\d+)?$/.test(raw);
  }

  function matchesPattern(value, pattern) {
    const raw = String(value || '').trim();
    if (!raw) return false;
    return pattern.test(raw);
  }

  global.CsvUploadUtils = {
    normalizeHeader,
    parseCsvLine,
    parseCsvText,
    toUsDate,
    isValidUsDate,
    isNumeric,
    matchesPattern
  };
})(window);