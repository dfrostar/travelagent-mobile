import React from 'react'
import { Dimensions } from 'react-native'
import { PieChart } from 'react-native-chart-kit'
import { theme } from '@/theme'

interface TokenDistributionData {
  name: string
  percentage: number
  color: string
}

interface TokenDistributionChartProps {
  data: TokenDistributionData[]
}

const screenWidth = Dimensions.get('window').width

export const TokenDistributionChart: React.FC<TokenDistributionChartProps> = ({
  data,
}) => {
  const chartData = data.map((item) => ({
    name: item.name,
    population: item.percentage,
    color: item.color,
    legendFontColor: theme.colors.text,
    legendFontSize: 12,
  }))

  return (
    <PieChart
      data={chartData}
      width={screenWidth - 48}
      height={220}
      chartConfig={{
        backgroundColor: theme.colors.background,
        backgroundGradientFrom: theme.colors.background,
        backgroundGradientTo: theme.colors.background,
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
        labelColor: (opacity = 1) => theme.colors.text,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: '6',
          strokeWidth: '2',
          stroke: theme.colors.primary,
        },
      }}
      accessor="population"
      backgroundColor="transparent"
      paddingLeft="0"
      absolute
      hasLegend={false}
      center={[screenWidth / 4, 0]}
    />
  )
}
