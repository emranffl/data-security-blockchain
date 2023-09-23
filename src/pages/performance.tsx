import prisma from "@functionalities/DB/prismainstance"
import { blockchain_type } from "@prisma/client"
import { NextPage } from "next"
import Head from "next/head"
import { Chart } from "react-google-charts"
import dcd from "@resources/metrics.json"

export async function getServerSideProps() {
	const [
		{
			attempts_to_mine_blocks,
			consumed_mining_time,
			cpu_mining_usage,
			mem_mining_usage,
			mined_block_count,
			average_attempts_to_mine_block_per_device_type,
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
			average_attempts_to_mine_block_per_device_type: true,
		},
	})

	let count = 0,
		transformed_difficulty_based_attempt_comparison_data: (
			| string
			| number
		)[][] = [],
		transformed_difficulty_based_time_comparison_data: (string | number)[][] =
			[]

	Object.values(dcd.attempt).map((val, index) => {
		if (index === 0)
			transformed_difficulty_based_attempt_comparison_data.push([
				"Block(n)",
				"Satellite",
				"Ground Station",
				"Phased Array Antenna",
				"Mobile",
				"Aircraft",
				"Vehicle",
				"Watercraft",
			])

		Object.values(val).map((arr, ind) => {
			if (ind === 0) return
			transformed_difficulty_based_attempt_comparison_data.push([
				index,
				arr[1],
				arr[2],
				arr[3],
				arr[4],
				arr[5],
				arr[6],
				arr[7],
			])
		})
	})

	Object.values(dcd.time).map((val, index) => {
		if (index === 0)
			transformed_difficulty_based_time_comparison_data.push([
				"Block(n)",
				"Time(ms)",
			])

		Object.values(val).map((arr, ind) => {
			if (ind === 0) return
			transformed_difficulty_based_time_comparison_data.push([count++, arr[1]])
		})
	})

	return {
		props: {
			attempts_to_mine_blocks,
			consumed_mining_time,
			cpu_mining_usage,
			mem_mining_usage,
			mined_block_count,
			transformed_difficulty_based_attempt_comparison_data,
			transformed_difficulty_based_time_comparison_data,
			average_attempts_to_mine_block_per_device_type,
		},
	}
}

interface PerformanceProps {
	attempts_to_mine_blocks: any
	consumed_mining_time: any
	cpu_mining_usage: any
	mem_mining_usage: any
	mined_block_count: any
	transformed_difficulty_based_attempt_comparison_data: any
	transformed_difficulty_based_time_comparison_data: any
	average_attempts_to_mine_block_per_device_type: any
}

const Performance: NextPage<PerformanceProps> = ({
	attempts_to_mine_blocks,
	consumed_mining_time,
	cpu_mining_usage,
	mem_mining_usage,
	mined_block_count,
	transformed_difficulty_based_attempt_comparison_data,
	transformed_difficulty_based_time_comparison_data,
	average_attempts_to_mine_block_per_device_type,
}) => {
	const colors = [
		"913175",
		"f6c90e",
		"D00400",
		"f26419",
		"008080",
		"5d5c61",
		"0a3d62",
		"ed553b",
		"CD5C5C", // unused
	]
	// [
	// 	"#913175",
	// 	"#f6c90e",
	// 	"#f26419",
	// 	"#008080",
	// 	"#FF5733",
	// 	"#21618C",
	// 	"#FF5733",
	// ]
	console
		.log
		// attempts_to_mine_blocks
		// consumed_mining_time,
		// cpu_mining_usage,
		// mem_mining_usage,
		// mined_block_count
		// transformed_difficulty_comparison_data
		// average_attempts_to_mine_block_per_device_type
		()

	return (
		<>
			<Head>
				<title>Performance | Network Security</title>
			</Head>

			<section className="mx-10 my-20 min-h-screen flex justify-center flex-col gap-y-20">
				<Chart
					className="p-5"
					chartType="Bar"
					// chartType="ComboChart"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={attempts_to_mine_blocks}
					options={{
						// chart: {
						title:
							"Number of attempts required to calculate hash for each block in the blockchain",
						subtitle: "in count (n)",
						// },
						colors,
						curveType: "function",
						bars: "vertical",
						// seriesType: "bars",
						// series: { 3: { type: "line" } },
					}}
				/>

				<Chart
					className="p-5"
					chartType="Scatter"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={attempts_to_mine_blocks}
					options={{
						chart: {
							title:
								"Number of attempts required to calculate hash for each block in the blockchain",
							subtitle: "in count (n)",
						},
						colors,
						curveType: "function",
						bars: "vertical",
					}}
				/>

				<Chart
					className="p-5"
					chartType="Line"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={consumed_mining_time}
					options={{
						chart: {
							title: "Time required to mine each block in the blockchain",
							subtitle: "in milliseconds (ms)",
						},
						colors: ["913175"],
						curveType: "function",
						bars: "vertical",
					}}
				/>

				<Chart
					className="p-10"
					chartType="Bar"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={average_attempts_to_mine_block_per_device_type}
					options={{
						title:
							"Average number of attempts required to mine each block in the blockchain based on device type",
						// legend: { position: "none" },
						colors,
						// histogram: { lastBucketPercentile: 5 },
						// vAxis: { title: "Attempts" },
					}}
				/>

				<Chart
					className="p-5"
					chartType="SteppedAreaChart"
					data={cpu_mining_usage}
					options={{
						title: "CPU usage time per block while mining in milliseconds (ms)",
						hAxis: {
							title: "Block(n)",
						},
						vAxis: {
							title: "Time(ms)",
							minValue: 0,
						},
						chartArea: {
							width: "80%",
							height: "80%",
						},
						series: {
							0: { areaOpacity: 0.35 },
						},
					}}
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
				/>

				<Chart
					className="px-5 -ml-10"
					chartType="AreaChart"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={mem_mining_usage}
					options={{
						title:
							"Memory usage space per block while mining in megabytes (MB)",
						hAxis: {
							title: "Block(n)",
						},
						vAxis: {
							title: "Memory(MB)",
						},
						chartArea: {
							width: "75%",
							height: "75%",
						},
						series: {
							0: { areaOpacity: 0.65 },
							1: { curveType: "function" },
						},
					}}
				/>

				<Chart
					chartType="PieChart"
					loader={<div>Loading Chart...</div>}
					data={mined_block_count}
					options={{
						title: "Mined blocks ratio per device type in the blockchain",
						legend: {
							position: "right",
							alignment: "center",
							textStyle: {
								color: "black",
								fontSize: 16,
							},
						},
						colors,
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
					width="100%"
					height="100vh"
				/>

				{/* // + static charts */}
				<Chart
					className="p-5"
					chartType="Bar"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={transformed_difficulty_based_attempt_comparison_data}
					options={{
						chart: {
							title:
								"Attempts required to mine each block in the blockchain based on difficulty",
							subtitle: "in count (n)",
						},
						// colors: ["913175"],
						curveType: "function",
						bars: "vertical",
					}}
				/>

				<Chart
					className="p-5"
					chartType="Line"
					width="100%"
					height="95vh"
					loader={<div>Loading Chart...</div>}
					data={transformed_difficulty_based_time_comparison_data}
					options={{
						chart: {
							title:
								"Time required to mine each block in the blockchain based on difficulty",
							subtitle: "in milliseconds (ms)",
						},
						colors: ["913175"],
						curveType: "function",
						bars: "vertical",
					}}
				/>
			</section>
		</>
	)
}

export default Performance
