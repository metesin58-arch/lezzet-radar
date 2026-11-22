export type District = { name: string; lat: number; lng: number };

export const DISTRICTS: District[] = [
  { name: "Adalar", lat: 40.876, lng: 29.091 },
  { name: "Arnavutköy", lat: 41.184, lng: 28.74 },
  { name: "Ataşehir", lat: 40.983, lng: 29.127 },
  { name: "Avcılar", lat: 40.979, lng: 28.721 },
  { name: "Bağcılar", lat: 41.039, lng: 28.856 },
  { name: "Bahçelievler", lat: 41.002, lng: 28.859 },
  { name: "Bakırköy", lat: 40.98, lng: 28.872 },
  { name: "Başakşehir", lat: 41.093, lng: 28.802 },
  { name: "Bayrampaşa", lat: 41.035, lng: 28.912 },
  { name: "Beşiktaş", lat: 41.043, lng: 29.007 },
  { name: "Beykoz", lat: 41.134, lng: 29.097 },
  { name: "Beylikdüzü", lat: 40.982, lng: 28.64 },
  { name: "Beyoğlu", lat: 41.037, lng: 28.977 },
  { name: "Büyükçekmece", lat: 41.02, lng: 28.585 },
  { name: "Çatalca", lat: 41.143, lng: 28.461 },
  { name: "Çekmeköy", lat: 41.033, lng: 29.179 },
  { name: "Esenler", lat: 41.043, lng: 28.876 },
  { name: "Esenyurt", lat: 41.034, lng: 28.68 },
  { name: "Eyüpsultan", lat: 41.048, lng: 28.934 },
  { name: "Fatih", lat: 41.019, lng: 28.94 },
  { name: "Gaziosmanpaşa", lat: 41.057, lng: 28.915 },
  { name: "Güngören", lat: 41.022, lng: 28.872 },
  { name: "Kadıköy", lat: 40.991, lng: 29.027 },
  { name: "Kağıthane", lat: 41.081, lng: 28.973 },
  { name: "Kartal", lat: 40.889, lng: 29.19 },
  { name: "Küçükçekmece", lat: 41.0, lng: 28.78 },
  { name: "Maltepe", lat: 40.935, lng: 29.13 },
  { name: "Pendik", lat: 40.877, lng: 29.235 },
  { name: "Sancaktepe", lat: 41.002, lng: 29.231 },
  { name: "Sarıyer", lat: 41.167, lng: 29.05 },
  { name: "Silivri", lat: 41.073, lng: 28.246 },
  { name: "Sultanbeyli", lat: 40.968, lng: 29.262 },
  { name: "Sultangazi", lat: 41.106, lng: 28.867 },
  { name: "Şile", lat: 41.176, lng: 29.613 },
  { name: "Şişli", lat: 41.06, lng: 28.987 },
  { name: "Tuzla", lat: 40.816, lng: 29.3 },
  { name: "Ümraniye", lat: 41.016, lng: 29.124 },
  { name: "Üsküdar", lat: 41.023, lng: 29.015 },
  { name: "Zeytinburnu", lat: 40.994, lng: 28.904 },
];

export function nearestDistrict(lat: number, lng: number): District {
  let best = DISTRICTS[0];
  let bestD = Infinity;
  const k = Math.cos((lat * Math.PI) / 180);
  for (const d of DISTRICTS) {
    const dd = (d.lat - lat) ** 2 + ((d.lng - lng) * k) ** 2;
    if (dd < bestD) {
      bestD = dd;
      best = d;
    }
  }
  return best;
}
