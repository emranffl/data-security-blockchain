import { Device } from "@pages/_app"
import { ground_station_info_status, mobile_info_status, satellite_info_status } from "@prisma/client"
import type { NextApiRequest, NextApiResponse } from "next"
import { randomInRange } from "@functionalities/helpers"
import prisma from "@functionalities/DB/prismainstance"
import { shuffle } from "@functionalities/shufflearray"
import { MIN_SATELLITE_NODE, MAX_SATELLITE_NODE, MIN_GROUND_STATION_NODE, MAX_GROUND_STATION_NODE, MIN_PHASED_ARRAY_ANTENNA_NODE, MAX_PHASED_ARRAY_ANTENNA_NODE, MIN_MOBILE_NODE, MAX_MOBILE_NODE, NODE_COLOR } from "@functionalities/constants"

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

interface Data {
  nodes: NodeDataSet[]
  edges: EdgeDataSet[]
  nodeCount: { [key in satellite_info_status]: number }
  foreground?: boolean
  error?: unknown
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    let nodes: NodeDataSet[] = [],
      edges: EdgeDataSet[] = [],
      satelliteNodeLimit = randomInRange(MIN_SATELLITE_NODE, MAX_SATELLITE_NODE),
      groundStationNodeLimit = randomInRange(MIN_GROUND_STATION_NODE, MAX_GROUND_STATION_NODE),
      phasedArrayAntennaNodeLimit = randomInRange(
        MIN_PHASED_ARRAY_ANTENNA_NODE,
        MAX_PHASED_ARRAY_ANTENNA_NODE
      ),
      mobileNodeLimit = randomInRange(MIN_MOBILE_NODE, MAX_MOBILE_NODE),
      //* data fetching from database
      [satelliteData, gs_data, phased_array_antenna_data, mobile_data] = await prisma.$transaction([
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
        group: mobile.status == mobile_info_status.Registered ? "Active" : "Inactive",
        color: {
          background:
            mobile.status == mobile_info_status.Registered ? NODE_COLOR["Active"] : NODE_COLOR["Inactive"],
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

    Object.values(ground_station_info_status).forEach((currentStatusInLoop) => {
      //* connecting active nodes
      if (currentStatusInLoop == "Active") {
        //? filter nodes based on device types
        let [satelliteData, groundStationData, phasedArrayAntennaData, mobileData] = [
          shuffle(
            nodes.filter((node) => {
              return node.deviceType == Device.Type.Satellite && node.group == "Active"
            }) as []
          ) as typeof nodes,
          shuffle(
            nodes.filter((node) => {
              return node.deviceType == Device.Type.GroundStation && node.group == "Active"
            }) as []
          ) as typeof nodes,
          shuffle(
            nodes.filter((node) => {
              return node.deviceType == Device.Type.PhasedArrayAntenna && node.group == "Active"
            }) as []
          ) as typeof nodes,
          shuffle(
            nodes.filter((node) => {
              return node.deviceType == Device.Type.Mobile && node.group == "Active"
            }) as []
          ) as typeof nodes,
        ]
        nodeCount[currentStatusInLoop] =
          satelliteData.length + groundStationData.length + phasedArrayAntennaData.length + mobileData.length

        for (let [index, node] of Object.entries(shuffle(phasedArrayAntennaData))) {
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
          const x = shuffle((Math.random() * 77) % 3 == 0 ? satelliteData : groundStationData)

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
            edges.some((edge) => {
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
        nodes.filter((node) => {
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

    return res.status(200).json({ nodes, edges, nodeCount })
  } catch (error) {
    console.error(error)
    return res.status(400).json({
      foreground: true,
      error,
      nodes: [],
      edges: [],
      nodeCount: {
        Positioned: 0,
        Active: 0,
        Inactive: 0,
        Decommissioned: 0,
      },
    })
  }
}
