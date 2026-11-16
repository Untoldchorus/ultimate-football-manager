async function searchZulfi() {
  const queries = [
    'Zulfi',
    'الزلفي',
    'Al-Zulfi',
    'Al Zulfi',
    'نادي الزلفي',
    'Al-Zulfe',
    'Marakh',
    'مرخ'
  ];

  for (const q of queries) {
    const url = `https://ar.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + ' شعار')}&format=json`;
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
      const data = await res.json();
      const results = data.query?.search || [];
      console.log(`Search "${q} شعار":`, results.slice(0, 3).map((r: any) => r.title));
    } catch (e: any) {
      console.log('Err:', e.message);
    }
  }
}
searchZulfi();
