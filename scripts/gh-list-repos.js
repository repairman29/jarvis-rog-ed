let data = '';
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  const raw = JSON.parse(data);
  const repos = Array.isArray(raw[0]) ? raw.flat() : raw;
  repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  repos.forEach((r) => {
    const desc = (r.description || '').replace(/\t|\n/g, ' ');
    console.log(
      `${r.name}\t${r.private}\t${r.updated_at}\t${desc}\t${r.html_url}`
    );
  });
});
