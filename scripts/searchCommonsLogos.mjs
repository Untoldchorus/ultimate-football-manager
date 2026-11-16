async function searchCommons(query) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&prop=imageinfo&iiprop=url|mime&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
  const data = await res.json();
  const pages = Object.values(data.query?.pages || {});
  console.log(`Query "${query}" found ${pages.length} files:`);
  for (const p of pages) {
    console.log(` - ${p.title} => ${p.imageinfo?.[0]?.url}`);
  }
}

async function main() {
  await searchCommons('Oakland Roots SC logo');
  await searchCommons('Ohod Club logo');
  await searchCommons('Al-Zulfi FC logo');
}
main();
