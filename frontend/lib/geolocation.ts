export interface GeoResult {
  latitude: number;
  longitude: number;
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

function messageFor(code?: number): string {
  // Browsers refuse the Geolocation API outright on non-secure origins
  // (anything but https:// or localhost) — this is the most common cause
  // of "it doesn't work" here, since the site may be reached over plain
  // HTTP by IP during testing.
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return "La géolocalisation exige une connexion sécurisée (HTTPS). Elle est indisponible tant que le site est ouvert en HTTP simple.";
  }
  switch (code) {
    case 1:
      return "Localisation refusée. Autorisez l'accès à la position dans les réglages du navigateur.";
    case 2:
      return "Position indisponible pour le moment. Réessayez dans quelques instants.";
    case 3:
      return "La demande de localisation a expiré. Réessayez.";
    default:
      return "Impossible d'obtenir votre position.";
  }
}

export function getCurrentPosition(): Promise<GeoResult> {
  return new Promise((resolve, reject) => {
    if (!isGeolocationSupported()) {
      reject(new Error("Géolocalisation non disponible sur cet appareil ou ce navigateur."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => reject(new Error(messageFor(err.code))),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}
