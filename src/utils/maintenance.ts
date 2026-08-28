export function getWIBDate() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 7));
}

export function getMaintenanceState() {
  const wibTime = getWIBDate();
  const day = wibTime.getDay();
  const hours = wibTime.getHours();
  const mins = wibTime.getMinutes();
  const timeVal = hours + (mins / 60);
  
  let isMaintenance = false;
  let targetTimeWIB = new Date(wibTime);

  // Senin (1) sebelum jam 07:15
  if (day === 1 && timeVal < 7.25) {
    isMaintenance = true;
    targetTimeWIB.setHours(7, 15, 0, 0);
  } 
  // Jumat (5) setelah jam 23:00
  else if (day === 5 && timeVal >= 23) {
    isMaintenance = true;
    targetTimeWIB.setDate(targetTimeWIB.getDate() + 1); // Sabtu
    targetTimeWIB.setHours(6, 0, 0, 0);
  }
  // Sabtu (6) sebelum jam 06:00
  else if (day === 6 && timeVal < 6) {
    isMaintenance = true;
    targetTimeWIB.setHours(6, 0, 0, 0);
  }

  // Convert targetTimeWIB back to Local Date for countdown purposes
  let targetTimeLocal: Date | null = null;
  if (isMaintenance) {
    const utcTarget = targetTimeWIB.getTime() - (3600000 * 7);
    targetTimeLocal = new Date(utcTarget);
  }

  return { isMaintenance, targetTimeLocal };
}

export function getFridayNotifState() {
  const wibTime = getWIBDate();
  const day = wibTime.getDay();
  const hours = wibTime.getHours();
  // Khusus hari jumat (5) setelah jam 07:00
  if (day === 5 && hours >= 7 && hours < 23) {
    return true;
  }
  return false;
}
