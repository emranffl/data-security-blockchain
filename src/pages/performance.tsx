import prisma from '@functionalities/DB/prismainstance'
import { NextPage } from 'next'
import Head from 'next/head'
import { Chart } from 'react-google-charts'

export async function getServerSideProps() {
	const [{ consumed_mining_time, cpu_mining_usage, mem_mining_usage }] =
		await prisma.metrics.findMany({
			where: {
				id: 1,
			},
			select: {
				consumed_mining_time: true,
				cpu_mining_usage: true,
				mem_mining_usage: true,
			},
		})

	return {
		props: {
			c1data: consumed_mining_time,
			c2data: cpu_mining_usage,
			c3data: mem_mining_usage,
		},
	}
}

interface PerformanceProps {
	c1data: any
	c2data: any
	c3data: any
}

const Performance: NextPage<PerformanceProps> = ({
	c1data,
	c2data,
	c3data,
}) => {
	console.log(typeof c1data, typeof c2data)

	return (
		<>
			<Head>
				<title>Performance | Blockchain</title>
			</Head>

			<section className='container my-20 min-h-screen flex justify-center flex-col gap-y-20'>
				<Chart
					chartType='Bar'
					width='100%'
					height='75vh'
					loader={<div>Loading Chart...</div>}
					data={c1data}
					options={{
						chart: {
							title: 'Time required to mine each block in the blockchain',
							subtitle: 'in milliseconds (ms)',
						},
						colors: ['913175'],
						curveType: 'function',
						bars: 'vertical',
					}}
				/>

				<Chart
					chartType='AreaChart'
					data={c2data}
					options={{
						title: 'CPU Usage per Block while mining',
						hAxis: {
							title: 'Block(n)',
						},
						vAxis: {
							title: 'CPU Usage',
							minValue: 0,
						},
						chartArea: {
							width: '80%',
							height: '80%',
						},
						series: {
							0: { areaOpacity: 0.35 },
						},
					}}
					width='100%'
					height='75vh'
					loader={<div>Loading Chart...</div>}
				/>

				<Chart
					chartType='AreaChart'
					width='100%'
					height='75vh'
					loader={<div>Loading Chart...</div>}
					data={c3data}
					options={{
						title: 'Memory Usage per Block while mining',
						hAxis: {
							title: 'Block(n)',
						},
						vAxis: {
							title: 'Memory(MB)',
						},
						chartArea: {
							width: '80%',
							height: '80%',
						},
						series: {
							0: { areaOpacity: 0.65 },
							1: { curveType: 'function' },
						},
					}}
				/>
			</section>
		</>
	)
}

export default Performance
