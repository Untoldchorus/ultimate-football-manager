async function inspect() {
  for (const term of ['Oakland Roots SC', 'Ohod Club', 'Al-Zulfi FC', 'Al-Zulfe FC', 'Al Zulfi']) {
    const sUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(term)}&limit=3&format=json`;
    const res = await fetch(sUrl, { headers: { 'User-Agent': 'UltimateFootballManager/1.0' } });
    const data = await res.json();
    console.log(term, '=>', data[1]);
  }
}
inspect();
