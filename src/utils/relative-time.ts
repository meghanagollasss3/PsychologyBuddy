/**
 * Format a date into relative time format (Today, Yesterday, X days ago, etc.)
 */
export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  
  // Reset time to compare only dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  // Calculate difference in days
  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Today
    return 'Today';
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays > 1 && diffDays <= 7) {
    // X days ago (for up to 7 days)
    return `${diffDays} days ago`;
  } else if (diffDays > 7 && diffDays <= 30) {
    // X weeks ago
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays > 30 && diffDays <= 365) {
    // X months ago
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    // More than a year ago, show date
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};

/**
 * Format time with relative date and specific time
 */
export const formatRelativeDateTime = (date: string | Date): string => {
  const now = new Date();
  const targetDate = new Date(date);
  
  // Reset time to compare only dates
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  
  // Calculate difference in days
  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const timeString = targetDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  if (diffDays === 0) {
    // Today with time
    return `Today, ${timeString}`;
  } else if (diffDays === 1) {
    // Yesterday with time
    return `Yesterday, ${timeString}`;
  } else if (diffDays > 1 && diffDays <= 7) {
    // X days ago with time
    return `${diffDays} days ago, ${timeString}`;
  } else if (diffDays > 7 && diffDays <= 30) {
    // X weeks ago
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    // More than a month ago, show date
    return targetDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: targetDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
};
