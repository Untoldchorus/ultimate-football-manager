async function check() {
  for (const title of ['Oakland_Roots_SC', 'Ohod_Club', 'Al-Zulfi_FC']) {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { 'User-Agent': 'UltimateFootballManager/1.0 (admin@example.com)' }
    });
    const d = await res.json();
    console.log(title, 'thumbnail:', d.thumbnail);
    console.log(title, 'originalimage:', d.originalimage);
  }
}
check();
