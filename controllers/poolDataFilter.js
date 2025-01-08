const poolDataFilter = (data) => {

    const filtered = data.filter(item => item.programId === "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
    return filtered;
}

module.exports = { poolDataFilter };