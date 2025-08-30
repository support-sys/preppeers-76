
export const formatDateTimeIST = (dateString: string) => {
  // If the date string contains 'Z' (UTC) or '+00:00' (UTC offset), we need to handle it specially
  // because the backend stores times as intended local time, not UTC
  if (dateString.includes('Z') || dateString.includes('+00:00')) {
    // Parse the UTC date string manually to avoid timezone conversion issues
    // Handle both 'Z' and '+00:00' formats
    const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
    if (match) {
      const [, year, month, day, hour, minute] = match;
      
      // Create a date object in local timezone with the intended time
      const localDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
      
      return localDate.toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    }
  }
  
  // For non-UTC dates or if parsing failed, use the original logic
  const date = new Date(dateString);
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};

export const formatDateIST = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
};

export const formatTimeIST = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
};
