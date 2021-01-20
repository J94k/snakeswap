import { Token, TokenAmount } from '@uniswap/sdk' // JSBI
import React, { useCallback, useContext, useState, useEffect } from 'react' // useMemo
import { ThemeContext } from 'styled-components'
import { AutoColumn } from '../../components/Column'
import { AutoRow } from '../../components/Row'
import { SearchInput } from '../../components/SearchModal/styleds'
// import { useAllTokenV1Exchanges } from '../../data/V1'
import { useActiveWeb3React } from '../../hooks'
import { useAllTokens, useToken } from '../../hooks/Tokens'
import { useSelectedTokenList } from '../../state/lists/hooks'
// import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { BackArrow, TYPE } from '../../theme'
import { LightCard } from '../../components/Card'
import { BodyWrapper } from '../AppBody'
import { EmptyState } from './EmptyState'
import UniV2PositionCard from '../../components/PositionCard/V1'
// import V1PositionCard from '../../components/PositionCard/V1'
import QuestionHelper from '../../components/QuestionHelper'
import { Dots } from '../../components/swap/styleds'
import { useAddUserToken } from '../../state/user/hooks'
import { isTokenOnList } from '../../utils'
import { useAllUniswapV2Pairs } from '../../data/V2'

export default function MigrateV1() {
  const theme = useContext(ThemeContext)
  const { account, chainId } = useActiveWeb3React()

  const [tokenSearch, setTokenSearch] = useState<string>('')
  const handleTokenSearchChange = useCallback(e => setTokenSearch(e.target.value), [setTokenSearch])

  // automatically add the search token
  const token = useToken(tokenSearch)
  const selectedTokenListTokens = useSelectedTokenList()
  const isOnSelectedList = isTokenOnList(selectedTokenListTokens, token ?? undefined)
  const allTokens = useAllTokens()
  const addToken = useAddUserToken()

  useEffect(() => {
    if (token && !isOnSelectedList && !allTokens[token.address]) {
      addToken(token)
    }
  }, [token, isOnSelectedList, addToken, allTokens])

  // * old version
  // get V1 LP balances
  // const V1Exchanges = useAllTokenV1Exchanges()

  // get UniswapV2 pairs with balances
  //@ts-ignore
  const [uniswapV2Pairs, pairLoading] = useAllUniswapV2Pairs(account)

  // * old version
  // const V1LiquidityTokens: Token[] = useMemo(() => {
  //   return chainId
  //     ? Object.keys(V1Exchanges).map(exchangeAddress => new Token(chainId, exchangeAddress, 18, 'UNI-V1', 'Uniswap V1'))
  //     : []
  // }, [chainId, V1Exchanges])
  // const [V1LiquidityBalances, V1LiquidityBalancesLoading] = useTokenBalancesWithLoadingIndicator(
  //   account ?? undefined,
  //   V1LiquidityTokens
  // )
  // const allV1PairsWithLiquidity = V1LiquidityTokens.filter(V1LiquidityToken => {
  //   const balance = V1LiquidityBalances?.[V1LiquidityToken.address]
  //   return balance && JSBI.greaterThan(balance.raw, JSBI.BigInt(0))
  // }).map(V1LiquidityToken => {
  //   const balance = V1LiquidityBalances[V1LiquidityToken.address]
  //   return balance ? (
  //     <V1PositionCard
  //       key={V1LiquidityToken.address}
  //       token={V1Exchanges[V1LiquidityToken.address]}
  //       V1LiquidityBalance={balance}
  //     />
  //   ) : null
  // })

  const allUniV2WithLiquidity = []
  for (let i = 0; i < uniswapV2Pairs.length; i++) {
    const pair = uniswapV2Pairs[i]

    if (!allTokens?.[pair?.token0]) {
      if (pair?.token0?.toLowerCase() === token?.address?.toLowerCase()) {
        pair.token0 = token.address
      } else {
        continue
      }
    }

    if (!allTokens?.[pair?.token1]) {
      if (pair?.token1?.toLowerCase() === token?.address?.toLowerCase()) {
        pair.token1 = token.address
      } else {
        continue
      }
    }

    //@ts-ignore
    const lpToken = new Token(chainId, pair.pair, 18, 'UNI-V2', 'Uniswap V2')
    const token0 = allTokens[pair.token0] || token
    const token1 = allTokens[pair.token1] || token
    const bal = new TokenAmount(lpToken, pair.balance.toString())
    //@ts-ignore
    const card = <UniV2PositionCard key={pair.pair} token0={token0} token1={token1} V1LiquidityBalance={bal} />
    allUniV2WithLiquidity.push(card)
  }

  // * old version
  // should never always be false, because a V1 exhchange exists for WETH on all testnets
  // const isLoading = Object.keys(V1Exchanges)?.length === 0 || V1LiquidityBalancesLoading

  const isLoading = uniswapV2Pairs?.length === 0 || pairLoading

  return (
    <BodyWrapper style={{ padding: 24 }}>
      <AutoColumn gap="16px">
        <AutoRow style={{ alignItems: 'center', justifyContent: 'space-between' }} gap="8px">
          <BackArrow to="/pool" />
          <TYPE.mediumHeader>Migrate V1 Liquidity</TYPE.mediumHeader>
          <div>
            <QuestionHelper text="Migrate your liquidity tokens from Snakeswap V1 to Snakeswap V2." />
          </div>
        </AutoRow>

        <TYPE.body style={{ marginBottom: 8, fontWeight: 400 }}>
          For each pool shown below, click migrate to remove your liquidity from Snakeswap V1 and deposit it into
          Snakeswap V2.
        </TYPE.body>

        {!account ? (
          <LightCard padding="40px">
            <TYPE.body color={theme.text3} textAlign="center">
              Connect to a wallet to view your V1 liquidity.
            </TYPE.body>
          </LightCard>
        ) : isLoading ? (
          <LightCard padding="40px">
            <TYPE.body color={theme.text3} textAlign="center">
              <Dots>Loading</Dots>
            </TYPE.body>
          </LightCard>
        ) : (
          <>
            <AutoRow>
              <SearchInput
                value={tokenSearch}
                onChange={handleTokenSearchChange}
                placeholder="Enter a token address to find liquidity"
              />
            </AutoRow>
            {allUniV2WithLiquidity?.length > 0 ? (
              <>{allUniV2WithLiquidity}</>
            ) : (
              <EmptyState message="No V1 Liquidity found." />
            )}
          </>
        )}
      </AutoColumn>
    </BodyWrapper>
  )
}
