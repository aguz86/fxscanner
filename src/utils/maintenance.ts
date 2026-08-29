export function getWIBDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

export function getMaintenanceState() {
  const wibTime = getWIBDate();
  const day = wibTime.getDay();
  const hours = wibTime.getHours();
  const mins = wibTime.getMinutes();
  const timeVal = hours + mins / 60;

  let isMaintenance = false;
  let targetTimeWIB = new Date(wibTime);

  // Senin (1) sebelum jam 07:15
  if (day === 1 && timeVal < 7.25) {
    isMaintenance = true;
    targetTimeWIB.setHours(7, 15, 0, 0);
  }
  // Weekend / Sabtu-Minggu sekarang tidak ada maintenance agar selalu bisa diakses

  // Convert targetTimeWIB back to true Local Date for countdown purposes
  let targetTimeLocal: Date | null = null;
  if (isMaintenance) {
    const localOffset = targetTimeWIB.getTimezoneOffset() * 60000;
    const trueTargetTimestamp =
      targetTimeWIB.getTime() - localOffset - 3600000 * 7;
    targetTimeLocal = new Date(trueTargetTimestamp);
  }

  return { isMaintenance, targetTimeLocal };
}

export function getFridayNotifState() {
  const wibTime = getWIBDate();
  const day = wibTime.getDay();
  const hours = wibTime.getHours();
  // Khusus hari jumat (5) setelah jam 07:00 sampai 23:59
  if (day === 5 && hours >= 7 && hours <= 23) {
    return true;
  }
  return false;
}

export function getFakeSignalWarningState() {
  const wibTime = getWIBDate();
  const day = wibTime.getDay();
  const hours = wibTime.getHours();

  // Senin (1) sampai Jumat (5)
  if (day >= 1 && day <= 5) {
    // 21:00 - 23:59 (hours >= 21) OR 00:00 - 07:00 (hours < 7)
    if (hours >= 21 || hours < 7) {
      return true;
    }
  }
  return false;
}

