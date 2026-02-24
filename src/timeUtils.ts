export function getCurrentTime(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function getEndTime(durationMinutes: number): string {
  const now = new Date();
  const endTime = new Date(now.getTime() + durationMinutes * 60000);
  return endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
