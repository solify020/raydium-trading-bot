const axios = require('axios');

const getPoolData = async(tokenAddress) => {
    const url = `https://api-v3.raydium.io/pools/info/mint?mint1=So11111111111111111111111111111111111111112&mint2=${tokenAddress}&poolType=standard&poolSortField=liquidity&sortType=asc&pageSize=1000&page=1`
    const response = await axios.get(url);
    return response.data.data.data;
}

module.exports = { getPoolData }