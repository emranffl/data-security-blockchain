import type { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import prisma from "@functionalities/DB/prismainstance"
import {
	satellite_info_status,
	ground_station_info_status,
	mobile_info_status,
} from "@prisma/client"
import { shuffle } from "@functionalities/shufflearray"
import $ from "jquery"
import { Network } from "vis-network"
import { Links, Device } from "@pages/_app"
import { randomInRange } from "@functionalities/helper"
import AddNodesTab from "@components/add/NodesTab"
// @ts-ignore
import Graph from "vis-react"

const NODE_COLOR = {
		Positioned: "#0099DD",
		Active: "#1fd655",
		Inactive: "#DBF227",
		Decommissioned: "#FF5F5D",
	},
	ACTIVE_GRAPH_DENSITY: { [key: number]: number } = {
		1: 97,
		2: 89,
		3: 83,
		4: 79,
		5: 73,
		6: 71,
		7: 67,
		8: 61,
		9: 59,
		10: 53,
		11: 47,
		12: 43,
		13: 41,
		14: 37,
		15: 31,
		16: 29,
		17: 23,
		18: 19,
		19: 17,
		20: 13,
		21: 11,
		22: 7,
		23: 5,
		24: 3,
		25: 2,
	},
	GRAPH_DENSITY_LEVEL: number = 1,
	MIN_SATELLITE_NODE = 20,
	MAX_SATELLITE_NODE = 70 / 2,
	MIN_GROUND_STATION_NODE = Math.ceil(MIN_SATELLITE_NODE * (7 / 30)),
	MAX_GROUND_STATION_NODE = Math.ceil(MAX_SATELLITE_NODE * (7 / 30)),
	MIN_PHASED_ARRAY_ANTENNA_NODE = Math.ceil(MIN_SATELLITE_NODE * (3 / 30)),
	MAX_PHASED_ARRAY_ANTENNA_NODE = Math.ceil(MAX_SATELLITE_NODE * (3 / 7)),
	MIN_MOBILE_NODE = Math.ceil(MIN_SATELLITE_NODE * (20 / 30)),
	MAX_MOBILE_NODE = Math.ceil(MAX_SATELLITE_NODE * (20 / 30))

export interface NodeDataSet {
	deviceType:
		| typeof Device.Type.Satellite
		| typeof Device.Type.GroundStation
		| typeof Device.Type.PhasedArrayAntenna
		| typeof Device.Type.Mobile
	id: string
	label: string
	shape: string
	image?: { unselected: string }
	imagePadding?: number
	shapeProperties?: { useBorderWithImage: boolean }
	group: ground_station_info_status
	color: { background: string }
}

export interface EdgeDataSet {
	arrows?: string
	dashes?: boolean
	from: string
	to: string
	color: {
		color: string
		highlight: string
	}
}

export const getServerSideProps = async () => {
	let nodes: NodeDataSet[] = [],
		edges: EdgeDataSet[] = [],
		satelliteNodeLimit = randomInRange(MIN_SATELLITE_NODE, MAX_SATELLITE_NODE),
		groundStationNodeLimit = randomInRange(
			MIN_GROUND_STATION_NODE,
			MAX_GROUND_STATION_NODE
		),
		phasedArrayAntennaNodeLimit = randomInRange(
			MIN_PHASED_ARRAY_ANTENNA_NODE,
			MAX_PHASED_ARRAY_ANTENNA_NODE
		),
		mobileNodeLimit = randomInRange(MIN_MOBILE_NODE, MAX_MOBILE_NODE),
		//* data fetching from database
		[satelliteData, gs_data, phased_array_antenna_data, mobile_data] =
			await prisma.$transaction([
				prisma.satellite_info.findMany({
					take: satelliteNodeLimit,
					skip: randomInRange(0, 50),
				}),
				prisma.ground_station_info.findMany({
					take: groundStationNodeLimit,
					skip: randomInRange(0, 20),
				}),
				prisma.phased_array_antenna_info.findMany({
					take: phasedArrayAntennaNodeLimit,
					skip: randomInRange(0, 50),
				}),
				prisma.mobile_info.findMany({
					take: mobileNodeLimit,
					skip: randomInRange(0, 20),
				}),
			])

	//? satellite constellation node data
	satelliteData.forEach((sat, index) => {
		nodes.push({
			deviceType: Device.Type.Satellite,
			id: sat.NORAD,
			label: sat.name,
			shape: "circularImage",
			image: {
				unselected: "/satellite.png",
			},
			imagePadding: 5,
			shapeProperties: {
				useBorderWithImage: true,
			},
			group: sat.status,
			color: {
				background: NODE_COLOR[sat.status],
			},
		})
	})

	//? ground station node data
	gs_data.forEach((gs, index) => {
		nodes.push({
			deviceType: Device.Type.GroundStation,
			id: gs.id.toString(),
			label: gs.name,
			shape: "circularImage",
			image: { unselected: "/ground-station.png" },
			imagePadding: 3,
			shapeProperties: {
				useBorderWithImage: true,
			},
			group: gs.status,
			color: {
				background: NODE_COLOR[gs.status],
			},
		})
	})

	//? phased array antenna node data
	phased_array_antenna_data.forEach((paa, index) => {
		nodes.push({
			deviceType: Device.Type.PhasedArrayAntenna,
			id: paa.id.toString(),
			label: paa.name,
			shape: "image",
			image: {
				unselected: "/paa.png",
			},
			imagePadding: 5,
			shapeProperties: {
				useBorderWithImage: true,
			},
			group: paa.status,
			color: {
				background: NODE_COLOR[paa.status],
			},
		})
	})

	//? mobile node data
	mobile_data.forEach((mobile, index) => {
		nodes.push({
			deviceType: Device.Type.Mobile,
			id: mobile.IMEI,
			label: mobile.name,
			shape: "image",
			image: {
				unselected: "/mobile.png",
			},
			imagePadding: 5,
			shapeProperties: {
				useBorderWithImage: true,
			},
			group:
				mobile.status == mobile_info_status.Registered ? "Active" : "Inactive",
			color: {
				background:
					mobile.status == mobile_info_status.Registered
						? NODE_COLOR["Active"]
						: NODE_COLOR["Inactive"],
			},
		})
	})

	let nodeCount = {
			Positioned: 0,
			Active: 0,
			Inactive: 0,
			Decommissioned: 0,
		},
		dysfunctionalNodes: NodeDataSet[] = []

	Object.values(ground_station_info_status).forEach(currentStatusInLoop => {
		//* connecting active nodes
		if (currentStatusInLoop == "Active") {
			//? filter nodes based on device types
			let [
				satelliteData,
				groundStationData,
				phasedArrayAntennaData,
				mobileData,
			] = [
				shuffle(
					nodes.filter(node => {
						return (
							node.deviceType == Device.Type.Satellite && node.group == "Active"
						)
					}) as []
				) as typeof nodes,
				shuffle(
					nodes.filter(node => {
						return (
							node.deviceType == Device.Type.GroundStation &&
							node.group == "Active"
						)
					}) as []
				) as typeof nodes,
				shuffle(
					nodes.filter(node => {
						return (
							node.deviceType == Device.Type.PhasedArrayAntenna &&
							node.group == "Active"
						)
					}) as []
				) as typeof nodes,
				shuffle(
					nodes.filter(node => {
						return (
							node.deviceType == Device.Type.Mobile && node.group == "Active"
						)
					}) as []
				) as typeof nodes,
			]
			nodeCount[currentStatusInLoop] =
				satelliteData.length +
				groundStationData.length +
				phasedArrayAntennaData.length +
				mobileData.length

			for (let [index, node] of Object.entries(
				shuffle(phasedArrayAntennaData)
			)) {
				edges.push({
					from: node.id,
					to: (() => {
						const x = shuffle(satelliteData)
						return x[randomInRange(0, x.length - 1)].id
					})(),
					color: {
						color: "#D92525",
						highlight: "#8C1F28",
					},
				})
			}

			for (let [index, node] of Object.entries(shuffle(mobileData))) {
				const x = shuffle(
					(Math.random() * 77) % 3 == 0 ? satelliteData : groundStationData
				)

				edges.push({
					from: node.id,
					to: (() => {
						return x[randomInRange(0, x.length - 1)].id
					})(),
					color: {
						color: "#D92525",
						highlight: "#8C1F28",
					},
				})
			}

			const y = shuffle([...satelliteData, ...groundStationData])

			for (let node of y.length > 0 ? y : []) {
				// implement y.len=0
				let index = randomInRange(0, y.length - 1),
					z = y[index]

				if (
					node.id != z.id &&
					edges.some(edge => {
						return edge.from != z.id
					})
				)
					edges.push({
						from: node.id,
						to: z.id,
						color: {
							color: "#D92525",
							highlight: "#8C1F28",
						},
					})

				// check cluster logic
				// if (edges.some((edge) => { return edge.from == z.id || edge.to == z.id }))
				//   y.splice(index, 1)
				// console.log(y.length)
			}
		}
		//* grouping positioned/inactive/decommissioned nodes
		else
			nodes.filter(node => {
				if (node.group == currentStatusInLoop) {
					dysfunctionalNodes.push(node)
					nodeCount[currentStatusInLoop]++
				}
			})
	})

	//* connecting positioned/inactive/decommissioned nodes
	dysfunctionalNodes.forEach((node, index) => {
		if (index != dysfunctionalNodes.length - 1)
			edges.push({
				from: node.id,
				to: (dysfunctionalNodes[index + 1] as NodeDataSet).id,
				dashes: true,
				color: {
					color: "#D92525",
					highlight: "#8C1F28",
				},
			})
	})

	return {
		props: { nodes, edges, nodeCount },
	}
}

interface HomePageProps {
	nodes: NodeDataSet[]
	edges: EdgeDataSet[]
	nodeCount: { [key in satellite_info_status]: number }
}

const Home: NextPage<HomePageProps> = ({ nodes, edges, nodeCount }) => {
	// console.log({ nodes, edges })

	const [networkNodesState, setNetworkNodes] = useState(nodes),
		[networkEdgesState, setNetworkEdges] = useState(edges),
		[networkNodeCountState, setNetworkNodeCount] = useState(nodeCount),
		[selectedAddNodeCategory, setSelectedAddNodeCategory] = useState<
			string | null
		>(null),
		[selectedNodeType, setSelectedNodeType] = useState<string | null>(null)

	useEffect(() => {
		setSelectedNodeType(
			$("input[name='radioNodeType']:checked").val() as string
		)
	}, [])

	useEffect(() => {
		//* create a network
		new Network(
			$("#network-graph")[0],
			{ nodes: networkNodesState, edges: networkEdgesState },
			{
				interaction: {
					hover: true,
				},
				physics: { enabled: true },
			}
		)
	}, [networkEdgesState, networkNodesState])

	useEffect(() => {
		const network = fetch("/api/initialize").then(async response => {
			const res = await response.json()
			console.log(res)
		})
	}, [])
	return (
		<>
			<Head>
				<title>Home | Blockchain</title>
			</Head>

			<main className="">
				<section className="grid grid-cols-3 gap-2">
					<div className="col-span-2 border border-1">
						<div className="flex justify-between mx-5 my-3">
							<h1 className="text-lg">Network Graph</h1>

							<div className="flex space-x-3">
								{networkNodeCountState["Positioned"] ? (
									<span className="flex space-x-1 items-center">
										<div
											className="h-6 w-7 rounded border"
											style={{ backgroundColor: NODE_COLOR["Positioned"] }}
										></div>
										<span className="font-light">Positioned</span>
										<small className="inline-flex justify-center items-center ml-2 mb-1 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">
											{networkNodeCountState["Positioned"]}
										</small>
									</span>
								) : null}

								{networkNodeCountState["Active"] ? (
									<span className="flex space-x-1 items-center">
										<div
											className="h-6 w-7 rounded border"
											style={{ backgroundColor: NODE_COLOR["Active"] }}
										></div>
										<span className="font-light">Active</span>
										<small className="inline-flex justify-center items-center ml-2 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">
											{networkNodeCountState["Active"]}
										</small>
									</span>
								) : null}

								{networkNodeCountState["Inactive"] ? (
									<span className="flex space-x-1 items-center">
										<div
											className="h-6 w-7 rounded border"
											style={{ backgroundColor: NODE_COLOR["Inactive"] }}
										></div>
										<span className="font-light">Inactive</span>
										<small className="inline-flex justify-center items-center ml-2 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">
											{networkNodeCountState["Inactive"]}
										</small>
									</span>
								) : null}

								{networkNodeCountState["Decommissioned"] ? (
									<span className="flex space-x-1 items-center">
										<div
											className="h-6 w-7 rounded border"
											style={{ backgroundColor: NODE_COLOR["Decommissioned"] }}
										></div>
										<span className="font-light">Decommissioned</span>
										<small className="inline-flex justify-center items-center ml-2 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">
											{networkNodeCountState["Decommissioned"]}
										</small>
									</span>
								) : null}
							</div>
						</div>

						<div className="h-[92vh]" id="network-graph">
							{/* <Graph
                graph={{ nodes: networkNodesState, edges: networkEdgesState }}
                options={{
                  interaction: {
                    hover: true,
                  },
                  physics: { enabled: true },
                }}
              // events={events}
              // style={style}
              // getNetwork={this.getNetwork}
              // getEdges={this.getEdges}
              // getNodes={this.getNodes}
              // vis={vis => (this.vis = vis)}
              /> */}
						</div>
					</div>

					<div className="col-span-1 border border-1">
						<form
							className="mx-3 mb-10"
							onSubmit={e => {
								e.preventDefault()
								e.stopPropagation()
							}}
						>
							<AddNodesTab
								selectedAddNodeCategory={selectedAddNodeCategory}
								setSelectedAddNodeCategory={setSelectedAddNodeCategory}
								selectedNodeType={selectedNodeType}
								setSelectedNodeType={setSelectedNodeType}
							/>

							<fieldset>
								<div className="grid md:grid-cols-2 md:gap-x-3">
									<div className="mb-2">
										<label
											htmlFor="selectNodeConnect"
											className="block mb-2 text-sm font-normal text-gray-500"
										>
											Connect To
										</label>
										<select
											className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
											id="selectNodeConnect"
											data-category="edge_connect"
											data-name="connect_to"
											required
										>
											<option value="" hidden>
												Select Node...
											</option>
											{Object.values(networkNodesState).map((nodes, index) => (
												<option
													key={index}
													data-device-type={nodes.deviceType}
													value={nodes.id}
												>
													{nodes.label}
												</option>
											))}
										</select>
										<small className="mt-2 text-sm text-red-500"></small>
									</div>
								</div>
							</fieldset>

							<small
								className="min-h-[2rem] mb-3 text-sm text-red-500 border border-red-600 rounded-sm hidden"
								id="foregroundErr"
							></small>

							<button
								type="submit"
								className="btn-blue-shadow"
								onClick={async () => {
									let dbData: {
											[key: string]: { [key: string]: any }
										} = {
											satellite_info: {},
											ground_station_info: {},
										},
										dbDataTarget = $(
											"input[data-category=satellite_info], select[data-category=satellite_info], input[data-category=ground_station_info], select[data-category=ground_station_info]"
										)

									//* db table data collection upon validation
									for (let count = 0; count < dbDataTarget.length; count++) {
										// return on empty input
										if ($(dbDataTarget[count]).is(":invalid")) return

										dbData[
											$(dbDataTarget[count]).attr("data-category") as string
										][$(dbDataTarget[count]).attr("data-name") as string] = $(
											dbDataTarget[count]
										).val()
									}

									//* edge data validation
									if ($("select[data-category=edge_connect]").is(":invalid"))
										return

									// node & edge data collection
									let nodeData: NodeDataSet = {
											deviceType: selectedNodeType!,
											id:
												selectedNodeType == Device.Type.Satellite
													? dbData.satellite_info.NORAD
													: dbData.ground_station_info.id,
											label:
												selectedNodeType == Device.Type.Satellite
													? dbData.satellite_info.name
													: dbData.ground_station_info.name,
											shape:
												selectedNodeType == Device.Type.Satellite
													? "image"
													: "circularImage",
											image: {
												unselected:
													selectedNodeType == Device.Type.Satellite
														? "/satellite.png"
														: "/ground-station.png",
											},
											imagePadding:
												selectedNodeType == Device.Type.Satellite ? 5 : 3,
											group:
												selectedNodeType == Device.Type.Satellite
													? dbData.satellite_info.status
													: dbData.ground_station_info.status,
											color: { background: "#7AB8BF" },
										},
										edgeData: EdgeDataSet = {
											arrows: "to",
											dashes: true,
											from:
												selectedNodeType == Device.Type.Satellite
													? dbData.satellite_info.NORAD
													: dbData.ground_station_info.id,
											to: $("#selectNodeConnect").val() as string,
											color: {
												color: "#889C9B",
												highlight: "#A67458",
											},
										}

									//* add node & edge to the network
									setNetworkNodes([...networkNodesState, nodeData])
									setNetworkEdges([...networkEdgesState, edgeData])

									//* submit data to server
									await fetch(Links.API.add.newnode, {
										method: "POST",
										headers: {
											"Content-Type": "application/json",
										},
										body: JSON.stringify({
											deviceType: selectedNodeType,
											deviceData:
												selectedNodeType == Device.Type.Satellite
													? dbData.satellite_info
													: dbData.ground_station_info,
											connectToNode: {
												device_type: $(
													"#selectNodeConnect option:selected"
												).attr("data-device-type"),
												device_id: $("#selectNodeConnect").val(),
											},
										}),
									})
										.then(async serverResponse => {
											let responseData = await serverResponse.json()

											// on connection success

											// on connection failure
											console.log(serverResponse, responseData)

											//* display errors on server side validation
											if (serverResponse.status == 400) {
												const { name, category, error, foreground } =
													responseData

												// on major prisma error
												if (foreground)
													return $(`#foregroundErr`)
														.removeClass("hidden")
														.addClass("block")
														.text(JSON.stringify(error))
												else
													$(`#foregroundErr`)
														.removeClass("block")
														.addClass("hidden")
														.text("")

												return $(
													`input[data-category=${category}][data-name=${name}]`
												)
													.siblings("small")
													.text(error)
											}

											// remove error message on valid input
											$(`small`).map((index, small) => $(small).text(""))
										})
										.catch(err => console.log(err))

									// form reset
								}}
							>
								Submit
							</button>
						</form>
					</div>
				</section>
			</main>
		</>
	)
}

export default Home
