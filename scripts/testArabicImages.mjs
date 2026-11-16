async function queryArabicPageImages(title) {
  const url = `https://ar.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=images&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
  const data = await res.json();
  console.log(title, 'images =>', data.parse?.images);
}

async function main() {
  await queryArabicPageImages('نادي_أحد');
  await queryArabicPageImages('نادي_الزلفي');
}
main();
