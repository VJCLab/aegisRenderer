function genCandySelOpts(candidateMap) {
    const list = [];
    for (const [key, candidates] of candidateMap.entries()) {
        list.push({
            key,
            options: candidates.map((c, i) => ({
                label: `${c.type}: ${c.text}`,
                value: `${key}__${i}`,
                raw: c,
            }))
        });
    }
    return list;
}
export default genCandySelOpts;