import prisma from '@functionalities/DB/prismainstance'
import { blockchain_type } from '@prisma/client'
import { NextPage } from 'next'
import Head from 'next/head'
import { Chart } from 'react-google-charts'

export async function getServerSideProps() {
	const [
		{
			attempts_to_mine_blocks,
			consumed_mining_time,
			cpu_mining_usage,
			mem_mining_usage,
			mined_block_count,
		},
	] = await prisma.metrics.findMany({
		where: {
			id: 1,
		},
		select: {
			attempts_to_mine_blocks: true,
			consumed_mining_time: true,
			cpu_mining_usage: true,
			mem_mining_usage: true,
			mined_block_count: true,
		},
	})

	return {
		props: {
			attempts_to_mine_blocks,
			consumed_mining_time,
			cpu_mining_usage,
			mem_mining_usage,
			mined_block_count,
		},
	}
}

interface PerformanceProps {
	attempts_to_mine_blocks: any
	consumed_mining_time: any
	cpu_mining_usage: any
	mem_mining_usage: any
	mined_block_count: any
}

const Performance: NextPage<PerformanceProps> = ({
	attempts_to_mine_blocks,
	consumed_mining_time,
	cpu_mining_usage,
	mem_mining_usage,
	mined_block_count,
}) => {
	console.log(
		attempts_to_mine_blocks,
		consumed_mining_time,
		cpu_mining_usage,
		mem_mining_usage,
		mined_block_count
	)

	return (
		<>
			<Head>
				<title>Performance | Blockchain</title>
			</Head>

			<section className='container my-20 min-h-screen flex justify-center flex-col gap-y-20'>
				<Chart
					className='px-5'
					chartType='Bar'
					width='100%'
					height='75vh'
					loader={<div>Loading Chart...</div>}
					data={attempts_to_mine_blocks}
					options={{
						chart: {
							title: 'Number of attempts required to calculate hash for each block in the blockchain',
							subtitle: 'in count (n)',
						},
						colors: ['913175'],
						curveType: 'function',
						bars: 'vertical',
					}}
				/>

				<Chart
					className='px-5'
					chartType='Line'
					width='100%'
					height='75vh'
					loader={<div>Loading Chart...</div>}
					data={consumed_mining_time}
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
					className='px-5'
					chartType='AreaChart'
					data={cpu_mining_usage}
					options={{
						title: 'CPU usage time per block while mining in milliseconds (ms)',
						hAxis: {
							title: 'Block(n)',
						},
						vAxis: {
							title: 'Time(ms)',
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
					className='px-5 -ml-10'
					chartType='AreaChart'
					width='100%'
					height='75vh'
					loader={<div>Loading Chart...</div>}
					data={mem_mining_usage}
					options={{
						title: 'Memory usage space per block while mining in megabytes (MB)',
						hAxis: {
							title: 'Block(n)',
						},
						vAxis: {
							title: 'Memory(MB)',
						},
						chartArea: {
							width: '75%',
							height: '75%',
						},
						series: {
							0: { areaOpacity: 0.65 },
							1: { curveType: 'function' },
						},
					}}
				/>

				<Chart
					chartType='PieChart'
					loader={<div>Loading Chart...</div>}
					data={mined_block_count}
					options={{
						title: 'Mined blocks ratio per device type in the blockchain',
						legend: {
							position: 'right',
							alignment: 'center',
							textStyle: {
								color: 'black',
								fontSize: 16,
							},
						},
						// pieSliceText: 'label',
						slices: {
							// 0: { offset: 0.2 },
							// 1: { offset: 0.1 },
							// 2: { offset: 0.4 },
							// 3: { offset: 0.5 },
							// 4: { offset: 0.6 },
							// 5: { offset: 0.6 },
							6: { offset: 0.05 },
							12: { offset: 0.3 },
							14: { offset: 0.4 },
							15: { offset: 0.5 },
						},
					}}
					width='100%'
					height='100vh'
				/>
			</section>
		</>
	)
}

export default Performance
