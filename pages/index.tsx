import type { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import prisma from "@functionalities/DB/prismainstance"
import { satellite_info_status, ground_station_info_status, mobile_info_status } from "@prisma/client"
import { shuffle } from "@functionalities/shufflearray"
import $ from "jquery"
import { Network } from "vis-network"
import { Links } from "@pages/_app"
import { randomInRange } from "@functionalities/helper"

const
  NODE_COLOR = {
    "Positioned": "#0099DD",
    "Active": "#1fd655",
    "Inactive": "#DBF227",
    "Decommissioned": "#FF5F5D"
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
    25: 2
  },
  GRAPH_DENSITY_LEVEL: number = 1,
  MIN_SATELLITE_NODE = 20,
  MAX_SATELLITE_NODE = 70,
  MIN_GROUND_STATION_NODE = Math.ceil(MIN_SATELLITE_NODE * (7 / 30)),
  MAX_GROUND_STATION_NODE = Math.ceil(MAX_SATELLITE_NODE * (7 / 30)),
  MIN_DISHY_NODE = Math.ceil(MIN_SATELLITE_NODE * (3 / 30)),
  MAX_DISHY_NODE = Math.ceil(MAX_SATELLITE_NODE * (3 / 7)),
  MIN_MOBILE_NODE = Math.ceil(MIN_SATELLITE_NODE * (20 / 30)),
  MAX_MOBILE_NODE = Math.ceil(MAX_SATELLITE_NODE * (20 / 30))

export interface NodeDataSet {
  deviceType: 'satellite' | 'ground_station' | 'mobile' | 'dishy',
  id: string
  label: string
  shape: string
  image?: { unselected: string }
  imagePadding?: number
  shapeProperties?: { useBorderWithImage: boolean }
  group: ground_station_info_status,
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
  let nodes: NodeDataSet[] = [], edges: EdgeDataSet[] = [],
    satelliteNodeLimit = randomInRange(MIN_SATELLITE_NODE, MAX_SATELLITE_NODE),
    groundStationNodeLimit = randomInRange(MIN_GROUND_STATION_NODE, MAX_GROUND_STATION_NODE),
    dishyNodeLimit = randomInRange(MIN_DISHY_NODE, MAX_DISHY_NODE),
    mobileNodeLimit = randomInRange(MIN_MOBILE_NODE, MAX_MOBILE_NODE),

    //* data fetching from database 
    [satelliteData, gs_data, dishy_data, mobile_data] = await prisma.$transaction([
      prisma.satellite_info.findMany({ take: satelliteNodeLimit, skip: randomInRange(0, 50) }),
      prisma.ground_station_info.findMany({ take: groundStationNodeLimit, skip: randomInRange(0, 20) }),
      prisma.dishy_info.findMany({ take: dishyNodeLimit, skip: randomInRange(0, 50) }),
      prisma.mobile_info.findMany({ take: mobileNodeLimit, skip: randomInRange(0, 20) })
    ])


  //? satellite constellation node data
  satelliteData.forEach((sat, index) => {

    nodes.push({
      deviceType: "satellite",
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
      deviceType: "ground_station",
      id: gs.id,
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

  //? dishy dnode ata
  dishy_data.forEach((dishy, index) => {

    nodes.push({
      deviceType: "dishy",
      id: dishy.id,
      label: 'PAA-' + dishy.id,
      shape: "image",
      image: {
        unselected: "/dishy.png",
      },
      imagePadding: 5,
      shapeProperties: {
        useBorderWithImage: true,
      },
      group: dishy.status,
      color: {
        background: NODE_COLOR[dishy.status],
      },
    })

  })

  mobile_data.forEach((mobile, index) => {

    nodes.push({
      deviceType: "mobile",
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
      group: mobile.status == mobile_info_status.Registered ? 'Active' : 'Inactive',
      color: {
        background: mobile.status == mobile_info_status.Registered ? NODE_COLOR['Active'] : NODE_COLOR['Inactive'],
      },
    })

  })

  let nodeCount = {
    "Positioned": 0,
    "Active": 0,
    "Inactive": 0,
    "Decommissioned": 0
  }

  //* connecting nodes based on groups 
  Object.values(ground_station_info_status).forEach((currentStatusInLoop) => {

    //? filter nodes based on groups
    let filteredNodes = shuffle(nodes.filter((node) => { return node.group == currentStatusInLoop }) as []) as typeof nodes

    nodeCount[currentStatusInLoop] = filteredNodes.length

    filteredNodes.forEach((node, index) => {

      if (node.group == "Active") {

        if (index != filteredNodes.length - 1) {

          edges.push({
            from: node.id,
            to: filteredNodes[index + 1].id,
            color: {
              color: "#0CABA8",
              highlight: "#015958"
            },
          })

          // if (node.label.match('SL-GS'))
          for (let checkLoopCount = 0; checkLoopCount < index; checkLoopCount++) {
            const checkLoopNode = filteredNodes[checkLoopCount]

            if (
              // checkLoopNode.label.match('SL-GS') &&
              edges.every((edge) => { if (edge.from == checkLoopNode.id && edge.to == node.id) return false; return true }) &&
              (randomInRange(0, 99) % ACTIVE_GRAPH_DENSITY[GRAPH_DENSITY_LEVEL] == 0)
            )
              edges.push({
                from: node.id,
                to: checkLoopNode.id,
                color: {
                  color: "#0CABA8",
                  highlight: "#015958"
                },
              })

          }
        }

      } else {
        if (index != filteredNodes.length - 1)
          edges.push({
            from: node.id,
            to: filteredNodes[index + 1].id,
            dashes: true,
            color: {
              color: "#D92525",
              highlight: "#8C1F28"
            }
          })
      }

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
    [selectedNodeType, setSelectedNodeType] = useState<null | string>(null)

  useEffect(() => {
    setSelectedNodeType($("input[name='radioNodeType']:checked").val() as string)
  }, [])

  useEffect(() => {

    //* create a network
    new Network($("#network-graph")[0],
      { nodes: networkNodesState, edges: networkEdgesState },
      {
        interaction: {
          hover: true,
        },
        physics: { enabled: true },
      })

  }, [networkEdgesState, networkNodesState])

  return (
    <>
      <Head>
        <title>Data Security | Blockchain</title>
      </Head>

      <main className="">

        <section className="grid grid-cols-3 gap-2">
          <div className="col-span-2 border border-1">

            <div className="flex justify-between mx-5 my-3">

              <h1 className="text-lg">Network Graph</h1>

              <div className="flex space-x-3">
                {networkNodeCountState['Positioned'] ? <span className="flex space-x-1 items-center">
                  <div className="h-6 w-7 rounded border" style={{ backgroundColor: NODE_COLOR["Positioned"] }}></div>
                  <span className="font-light">
                    Positioned
                  </span>
                  <small className="inline-flex justify-center items-center ml-2 mb-1 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">{networkNodeCountState['Positioned']}</small>
                </span> : null}

                {networkNodeCountState['Active'] ? <span className="flex space-x-1 items-center">
                  <div className="h-6 w-7 rounded border" style={{ backgroundColor: NODE_COLOR["Active"] }}></div>
                  <span className="font-light">
                    Active
                  </span>
                  <small className="inline-flex justify-center items-center ml-2 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">{networkNodeCountState['Active']}</small>
                </span> : null}

                {networkNodeCountState['Inactive'] ? <span className="flex space-x-1 items-center">
                  <div className="h-6 w-7 rounded border" style={{ backgroundColor: NODE_COLOR["Inactive"] }}></div>
                  <span className="font-light">
                    Inactive
                  </span>
                  <small className="inline-flex justify-center items-center ml-2 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">{networkNodeCountState['Inactive']}</small>
                </span> : null}

                {networkNodeCountState['Decommissioned'] ? <span className="flex space-x-1 items-center">
                  <div className="h-6 w-7 rounded border" style={{ backgroundColor: NODE_COLOR["Decommissioned"] }}></div>
                  <span className="font-light">
                    Decommissioned
                  </span>
                  <small className="inline-flex justify-center items-center ml-2 w-7 h-7 text-xs font-medium text-gray-800 bg-slate-200 rounded-full">{networkNodeCountState['Decommissioned']}</small>
                </span> : null}

              </div>
            </div>

            <div className="h-[82vh]" id="network-graph"></div>
          </div>

          <div className="col-span-1 border border-1">


            <form className="mx-5 my-10"
              onSubmit={e => {
                e.preventDefault()
                e.stopPropagation()
              }}>

              <fieldset className="mb-5">
                <div className="flex space-x-5 justify-start">
                  <h3 className="font-light text-gray-700 flex items-center">Node Type</h3>
                  <div className="flex items-center font-mono">
                    <input
                      className="w-5 h-5 border-gray-300"
                      id="radioNodeSatellite"
                      type="radio"
                      name="radioNodeType"
                      value="Sat"
                      onChange={(e) => setSelectedNodeType(e.currentTarget.value)}
                      defaultChecked
                    />
                    <label htmlFor="radioNodeSatellite" className="block ml-2 text-sm font-medium text-gray-900 py-1 cursor-pointer">
                      Satellite
                    </label>
                  </div>

                  <div className="flex items-center font-mono">
                    <input
                      className="w-5 h-5 border-gray-300"
                      id="radioNodeGS"
                      type="radio"
                      name="radioNodeType"
                      value="GS"
                      onChange={(e) => setSelectedNodeType(e.currentTarget.value)}
                    />
                    <label htmlFor="radioNodeGS" className="block ml-2 text-sm font-medium text-gray-900 py-1 cursor-pointer">
                      Ground Station
                    </label>
                  </div>
                </div>
              </fieldset>

              {selectedNodeType == "Sat" ?
                <fieldset className="animate__animated animate__fadeIn animate__slow">

                  <div className="grid md:grid-cols-2 md:gap-x-3">

                    <div className="mb-2">
                      <label htmlFor="inputSatNORAD" className="block mb-2 text-sm font-normal text-gray-500">NORAD</label>
                      <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        type="number"
                        id="inputSatNORAD"
                        placeholder="e.g. 14652"
                        min={0}
                        max={99999}
                        data-category="satellite_info"
                        data-name="NORAD"
                        required
                        onInput={(e) => {
                          let len = 5
                          if (e.currentTarget.value.length > len)
                            e.currentTarget.value = e.currentTarget.value.slice(0, len)
                        }}
                      />
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                    <div className="mb-2">
                      <label htmlFor="inputSatName" className="block mb-2 text-sm font-normal text-gray-500">Name</label>
                      <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        type="text"
                        id="inputSatName"
                        placeholder="e.g. STARLINK-1234"
                        data-category="satellite_info"
                        data-name="name"
                        required
                        onInput={(e) => {
                          let len = 255
                          if (e.currentTarget.value.length > len)
                            e.currentTarget.value = e.currentTarget.value.slice(0, len)
                        }}
                      />
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                    <div className="mb-2">
                      <label htmlFor="inputSatAltitude" className="block mb-2 text-sm font-normal text-gray-500">Altitude (KM)</label>
                      <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        type="number"
                        id="inputSatAltitude"
                        placeholder="e.g. 550.25"
                        min={0}
                        max={999}
                        step={0.1}
                        data-category="satellite_info"
                        data-name="altitude"
                        required
                        onInput={(e) => {
                          let len = 7
                          if (e.currentTarget.value.length > len)
                            e.currentTarget.value = e.currentTarget.value.slice(0, len)
                        }}
                      />
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                    <div className="mb-2">
                      <label htmlFor="selectSatStatus" className="block mb-2 text-sm font-normal text-gray-500">Status</label>
                      <select
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        id="selectSatStatus"
                        data-category="satellite_info"
                        data-name="status"
                        required
                      >
                        <option value="" hidden>Select Status...</option>
                        {
                          Object.keys(satellite_info_status).map(
                            (key, index) => <option key={index} value={key}>{key}</option>
                          )
                        }
                      </select>
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                  </div>

                </fieldset> : null}


              {selectedNodeType == "GS" ?
                <fieldset className="animate__animated animate__fadeIn animate__slow">

                  <div className="grid md:grid-cols-2 md:gap-x-3">

                    <div className="mb-2">
                      <label htmlFor="inputGSId" className="block mb-2 text-sm font-normal text-gray-500">UUID</label>
                      <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        type="text"
                        id="inputGSId"
                        placeholder="e.g. 12345"
                        data-category="ground_station_info"
                        data-name="id"
                        required
                        onInput={(e) => {
                          let len = 5
                          if (e.currentTarget.value.length > len)
                            e.currentTarget.value = e.currentTarget.value.slice(0, len)
                        }}
                      />
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                    <div className="mb-2">
                      <label htmlFor="inputGSName" className="block mb-2 text-sm font-normal text-gray-500">Name</label>
                      <input
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        type="text"
                        id="inputGSName"
                        placeholder="e.g. SL-GS-00C9"
                        data-category="ground_station_info"
                        data-name="name"
                        required
                        onInput={(e) => {
                          let len = 255
                          if (e.currentTarget.value.length > len)
                            e.currentTarget.value = e.currentTarget.value.slice(0, len)
                        }}
                      />
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-3 flex gap-2">
                        <div className="mb-2">
                          <label htmlFor="inputGSLat" className="block mb-2 text-sm font-normal text-gray-500">Latitude</label>
                          <input
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            type="number"
                            id="inputGSLat"
                            placeholder="e.g. 89.04689"
                            min={-90.0}
                            max={90.0}
                            step={0.00001}
                            data-category="ground_station_info"
                            data-name="latitude"
                            required
                            onInput={(e) => {
                              let len = 9,
                                value: number | string = parseFloat(e.currentTarget.value)

                              if (value < parseFloat(e.currentTarget.min) || value > parseFloat(e.currentTarget.max)) {
                                e.currentTarget.value = ''
                              }

                              if (e.currentTarget.value.length > len)
                                e.currentTarget.value = e.currentTarget.value.slice(0, len)
                            }}
                          />
                          <small className="mt-2 text-sm text-red-500"></small>
                        </div>

                        <div className="mb-2">
                          <label htmlFor="inputGSLon" className="block mb-2 text-sm font-normal text-gray-500">Longitude</label>
                          <input
                            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                            type="number"
                            id="inputGSLon"
                            placeholder="e.g. -109.11452"
                            min={-180.0}
                            max={180.0}
                            step={0.00001}
                            data-category="ground_station_info"
                            data-name="longitude"
                            required
                            onInput={(e) => {
                              let len = 10,
                                value: number | string = parseFloat(e.currentTarget.value)

                              if (value < parseFloat(e.currentTarget.min) || value > parseFloat(e.currentTarget.max)) {
                                e.currentTarget.value = ''
                              }

                              if (e.currentTarget.value.length > len)
                                e.currentTarget.value = e.currentTarget.value.slice(0, len)
                            }}
                          />
                          <small className="mt-2 text-sm text-red-500"></small>
                        </div>
                      </div>
                      <div className="col-span-1 flex flex-col align-middle justify-center">
                        <button type="button" className="btn-gradient-duotone-purple mb-1 px-[0!important]"
                          onClick={() => {
                            // get current location from the browser
                            navigator.geolocation.getCurrentPosition((position) => {
                              let lat = position.coords.latitude.toFixed(5),
                                lon = position.coords.longitude.toFixed(5)

                              $('#inputGSLat').val(lat.toString())
                              $('#inputGSLon').val(lon.toString())
                            })
                          }}
                        >
                          <i className="mb-0 bi bi-pin-map-fill"></i>
                        </button>
                      </div>
                    </div>

                    <div className="mb-2">
                      <label htmlFor="selectGSStatus" className="block mb-2 text-sm font-normal text-gray-500">Status</label>
                      <select
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        id="selectGSStatus"
                        data-category="ground_station_info"
                        data-name="status"
                        required
                      >
                        <option value="" hidden>Select Status...</option>
                        {
                          Object.keys(satellite_info_status).map(
                            (key, index) => <option key={index} value={key}>{key}</option>
                          )
                        }
                      </select>
                      <small className="mt-2 text-sm text-red-500"></small>
                    </div>

                  </div>

                </fieldset> : null}

              <fieldset>

                <div className="grid md:grid-cols-2 md:gap-x-3">

                  <div className="mb-2">
                    <label htmlFor="selectNodeConnect" className="block mb-2 text-sm font-normal text-gray-500">Connect To</label>
                    <select
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      id="selectNodeConnect"
                      data-category="edge_connect"
                      data-name="connect_to"
                      required
                    >
                      <option value="" hidden>Select Node...</option>
                      {
                        Object.values(networkNodesState).map(
                          (key, index) => <option key={index} data-device-type={key.deviceType} value={key.id}>{key.label}</option>
                        )
                      }
                    </select>
                    <small className="mt-2 text-sm text-red-500"></small>
                  </div>

                </div>

              </fieldset>

              <small className="min-h-[2rem] mb-3 text-sm text-red-500 border border-red-600 rounded-sm hidden" id="foregroundErr"></small>

              <button type="submit" className="btn-blue-shadow"
                onClick={async () => {
                  let dbData: {
                    [key: string]: { [key: string]: any }
                  } = {
                    satellite_info: {},
                    ground_station_info: {},
                    connect_to: {
                      device_type: $('#selectNodeConnect').attr('data-device-type'),
                      device_id: $('#selectNodeConnect').val(),
                    }
                  }, dbDataTarget = $("input[data-category=satellite_info], select[data-category=satellite_info], input[data-category=ground_station_info], select[data-category=ground_station_info]")

                  //* db table data collection upon validation
                  for (let count = 0; count < dbDataTarget.length; count++) {
                    // return on empty input
                    if ($(dbDataTarget[count]).is(':invalid')) return

                    dbData[$(dbDataTarget[count]).attr('data-category') as string]
                    [$(dbDataTarget[count]).attr('data-name') as string] = $(dbDataTarget[count]).val()

                  }


                  //* edge data validation
                  if ($("select[data-category=edge_connect]").is(":invalid"))
                    return

                  // node & edge data collection
                  let nodeData: NodeDataSet = {
                    deviceType: selectedNodeType == "Sat" ? "satellite" : "ground_station",
                    id: selectedNodeType == "Sat" ?
                      dbData.satellite_info.NORAD : dbData.ground_station_info.id,
                    label: selectedNodeType == "Sat" ?
                      dbData.satellite_info.name : dbData.ground_station_info.name,
                    shape: selectedNodeType == "Sat" ?
                      "image" : "circularImage",
                    image: {
                      unselected: selectedNodeType == "Sat" ?
                        "/satellite.png" : "/ground-station.png"
                    },
                    imagePadding: selectedNodeType == "Sat" ? 5 : 3,
                    group: selectedNodeType == "Sat" ?
                      dbData.satellite_info.status : dbData.ground_station_info.status,
                    color: { background: "#7AB8BF" }
                  },
                    edgeData: EdgeDataSet = {
                      arrows: 'to',
                      dashes: true,
                      from: selectedNodeType == "Sat" ?
                        dbData.satellite_info.NORAD : dbData.ground_station_info.id,
                      to: $('#selectNodeConnect').val() as string,
                      color: {
                        color: "#889C9B",
                        highlight: "#A67458"
                      }
                    }

                  //* add node & edge to the network
                  setNetworkNodes([...networkNodesState, nodeData])
                  setNetworkEdges([...networkEdgesState, edgeData])

                  //* submit data to server
                  await fetch(Links.API.post.addnewnode, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      nodeCategory: selectedNodeType == "Sat" ?
                        "satellite" : selectedNodeType == "GS" ? "ground_station" : "Unknown",
                      nodeData: selectedNodeType == "Sat" ?
                        dbData.satellite_info : dbData.ground_station_info,
                      connectToDevice: dbData.connect_to
                    })
                  })
                    .then(async serverResponse => {
                      let responseData = await serverResponse.json()


                      // on connection success

                      // on connection failure
                      console.log(serverResponse, responseData)

                      //* display errors on server side validation
                      if (serverResponse.status == 400) {
                        const { name, category, error, foreground } = responseData

                        // on major prisma error
                        if (foreground)
                          return $(`#foregroundErr`).removeClass('hidden').addClass('block').text(JSON.stringify(error))
                        else $(`#foregroundErr`).removeClass('block').addClass('hidden').text('')

                        return $(`input[data-category=${category}][data-name=${name}]`).siblings('small').text(error)
                      }

                      // remove error message on valid input
                      $(`small`).map((index, small) => $(small).text(''))
                    })
                    .catch(err => console.log(err))

                  // form reset

                }
                }
              >Submit</button>
            </form>

          </div>
        </section>
      </main>
    </>
  )
}

export default Home
