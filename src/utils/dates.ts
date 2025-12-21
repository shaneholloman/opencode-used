// Date utilities for heatmap generation

export function generateWeeksForYear(year: number): string[][] {
  const weeks: string[][] = [];
  
  // Start from Jan 1st of the year
  const startDate = new Date(year, 0, 1);
  
  // Adjust to start from the first Sunday (or the day itself if it's Sunday)
  const startDay = startDate.getDay();
  const adjustedStart = new Date(startDate);
  if (startDay !== 0) {
    adjustedStart.setDate(startDate.getDate() - startDay);
  }
  
  // End date is Dec 31st or today if it's the current year
  const now = new Date();
  const isCurrentYear = year === now.getFullYear();
  const endDate = isCurrentYear ? now : new Date(year, 11, 31);
  
  let currentDate = new Date(adjustedStart);
  let currentWeek: string[] = [];
  
  while (currentDate <= endDate || currentWeek.length > 0) {
    const dayOfWeek = currentDate.getDay();
    
    // Format date as YYYY-MM-DD
    const dateStr = formatDateKey(currentDate);
    
    // Only include dates within the year
    if (currentDate.getFullYear() === year && currentDate <= endDate) {
      currentWeek.push(dateStr);
    } else if (currentDate.getFullYear() === year) {
      // Pad with empty strings for dates outside range but in the week
      currentWeek.push("");
    }
    
    // If it's Saturday (end of week) or we've passed the end date
    if (dayOfWeek === 6) {
      if (currentWeek.length > 0 && currentWeek.some(d => d !== "")) {
        weeks.push(currentWeek);
      }
      currentWeek = [];
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
    
    // Safety: stop if we've gone too far past the year
    if (currentDate.getFullYear() > year + 1) break;
  }
  
  // Add any remaining days
  if (currentWeek.length > 0 && currentWeek.some(d => d !== "")) {
    weeks.push(currentWeek);
  }
  
  return weeks;
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getIntensityLevel(
  count: number,
  maxCount: number
): 0 | 1 | 2 | 3 | 4 {
  if (count === 0) return 0;
  if (maxCount === 0) return 0;
  
  const ratio = count / maxCount;
  
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

export function isWrappedAvailable(year: number): { available: boolean; message?: string } {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate();
  
  // Past years are always available
  if (year < currentYear) {
    return { available: true };
  }
  
  // Future years are never available
  if (year > currentYear) {
    return {
      available: false,
      message: `OpenCode Wrapped ${year} isn't available yet. The future hasn't been written!`,
    };
  }
  
  // Current year: only available after Dec 20
  if (currentMonth < 12 || (currentMonth === 12 && currentDay < 20)) {
    const daysUntil = calculateDaysUntilDec20(now);
    return {
      available: false,
      message: `OpenCode Wrapped ${year} isn't ready yet!\n\nCome back on December 20th to unwrap your coding year in review.\n\nOnly ${daysUntil} days to go!`,
    };
  }
  
  return { available: true };
}

function calculateDaysUntilDec20(now: Date): number {
  const dec20 = new Date(now.getFullYear(), 11, 20); // Month is 0-indexed
  const diffTime = dec20.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
