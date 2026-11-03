async function test() {
  try {
    const res = await fetch('https://open.spotify.com/embed/playlist/37i9dQZF1DXcBWIGoYBM5M', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });
    const html = await res.text();
    const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (match) {
      const data = JSON.parse(match[1]);
      const state = data?.props?.pageProps?.state?.data?.entity;
      if (state && state.trackList) {
        console.log('Track 0 keys:', Object.keys(state.trackList[0]));
        console.log('Track 0:', JSON.stringify(state.trackList[0], null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  }
}
test();
