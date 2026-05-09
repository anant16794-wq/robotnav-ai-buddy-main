export function formatDistance(meters: number) {
  if (!meters) return "0 m";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 1 : 2)} km`;
}

export function formatCompactDistance(meters: number) {
  if (!meters) return "0m";
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 1 : 2)}km`;
}

export function formatDuration(seconds: number) {
  if (!seconds) return "--";
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `~${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `~${hours}h ${remainder}m` : `~${hours}h`;
}
