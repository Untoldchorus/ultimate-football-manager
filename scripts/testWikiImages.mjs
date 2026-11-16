async function queryPageImages(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&piprop=original|thumbnail&pithumbsize=300&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
  const data = await res.json();
  console.log(title, '=>', JSON.stringify(data.query.pages));
}

async function queryImagesOnPage(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(title)}&prop=images&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
  const data = await res.json();
  console.log(title, 'images =>', data.parse?.images);
}

async function main() {
  await queryImagesOnPage('Oakland Roots SC');
  await queryImagesOnPage('Ohod Club');
  await queryImagesOnPage('Al-Zulfi FC');
}
main();
