const { ethers } = require('ethers')
const JSBI = require('jsbi') // jsbi@3.2.5
const { abi: IUniswapV3PoolABI } = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const { TickMath, FullMath } = require('@uniswap/v3-sdk')

require('dotenv').config()

const POOL_ADDRESS = '0xc1FF5D622aEBABd51409e01dF4461936b0Eb4E43'
const TOKEN0 = '0xA6FA4fB5f76172d178d61B04b0ecd319C5d1C0aa' // WETH
const TOKEN1 = '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889' // WMATIC
const INFURA_URL_MUMBAI = process.env.INFURA_URL_MUMBAI

const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_MUMBAI)
const poolContract = new ethers.Contract(
    POOL_ADDRESS,
    IUniswapV3PoolABI,
    provider
)


// t0_amount must be fed in as the first command line arg, it is the amount of tokens you'd like to swap from TOKEN0 -> TOKEN1
async function main(t0_amount, pool, seconds) {
    const secondsAgo = [seconds, 0]

    const observeData = await pool.observe(secondsAgo)
    const tickCumulatives = observeData.tickCumulatives.map(v => Number(v))

    const tickCumulativesDelta = tickCumulatives[1] - tickCumulatives[0]

    const arithmeticMeanTick = (tickCumulativesDelta / secondsAgo[0]).toFixed(0)

    const arithmeticMeanTickInt = parseInt(arithmeticMeanTick)
    const sqrtRatioX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTickInt)

    const ratioX192 = JSBI.multiply(sqrtRatioX96, sqrtRatioX96)

    const baseToken = TOKEN0 // WETH
    const quoteToken = TOKEN1 // WMATIC
    const baseAmount = JSBI.BigInt(t0_amount * (10 ** 6))
    const shift = JSBI.leftShift(JSBI.BigInt(1), JSBI.BigInt(192))

    if (baseToken < quoteToken) {
        quoteAmount = FullMath.mulDivRoundingUp(ratioX192, baseAmount, shift)
    } else {
        quoteAmount = FullMath.mulDivRoundingUp(shift, baseAmount, ratioX192)
    }

    console.log('quoteAmount', quoteAmount.toString() / (10 ** 18))

    return quoteAmount;
}

main(1, poolContract, 60);