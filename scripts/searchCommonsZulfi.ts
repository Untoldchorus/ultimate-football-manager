async function search() {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent('الزلفي')}&gsrnamespace=6&prop=imageinfo&iiprop=url&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  console.log('Results:', pages.map((p: any) => p.title));
}
search();
