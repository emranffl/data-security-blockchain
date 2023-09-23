import type { NextPage } from "next"
import Head from "next/head"
import { useEffect, useState } from "react"
import $ from "jquery"
import { Network } from "vis-network"
import { NODE_COLOR } from "@functionalities/constants"
import usePollingQuery from "@functionalities/usePollingQuery"

interface HomePageProps {}

const Home: NextPage<HomePageProps> = ({}) => {
  const { data, error, isLoading } = usePollingQuery()
  const [networkNodesState, setNetworkNodes] = useState([]),
    [networkEdgesState, setNetworkEdges] = useState([]),
    [networkNodeCountState, setNetworkNodeCount] = useState(),
    [selectedAddNodeCategory, setSelectedAddNodeCategory] = useState<string | null>(null),
    [selectedNodeType, setSelectedNodeType] = useState<string | null>(null)

  //   + initial use effect
  useEffect(() => {
    setSelectedNodeType($("input[name='radioNodeType']:checked").val() as string)

    fetch("/api/initialize").then(async (response) => {
      const res = await response.json()
      console.info("initialize", res)
    })
  }, [])

  // + data fetch use effect
  useEffect(() => {
    if (data) {
      console.log("data", data)

      data.nodes.length > 0 && setNetworkNodes(data.nodes)
      data.edges.length > 0 && setNetworkEdges(data.edges)
      data.nodeCount && setNetworkNodeCount(data.nodeCount)

      //* create a network
      // new Network(
      //   $("#network-graph")[0],
      //   { nodes: [], edges: [] },
      //   {
      //     interaction: {
      //       hover: true,
      //     },
      //     physics: { enabled: true },
      //   }
      // )
    }
  }, [data])

  // + network use effect
  useEffect(() => {
    if (networkEdgesState.length > 0 && networkNodesState.length > 0) {
      try {
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
      } catch (error) {
        console.error(error)

        new Network($("#network-graph")[0], { nodes: [], edges: [] })
      }
    }
  }, [networkEdgesState, networkNodesState])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error</div>
  }

  return (
    <>
      <Head>
        <title>Home | Network Security</title>
      </Head>

      <main className="">
        <section className="grid grid-cols-3 gap-2">
          <div className="border-1 col-span-2 border">
            {/* // + topbar */}
            <div className="mx-5 my-3 flex justify-between">
              <h1 className="text-lg">Network Graph</h1>

              {networkNodeCountState && (
                <div className="flex space-x-3">
                  {networkNodeCountState["Positioned"] ? (
                    <span className="flex items-center space-x-1">
                      <div
                        className="h-6 w-7 rounded border"
                        style={{ backgroundColor: NODE_COLOR["Positioned"] }}
                      ></div>
                      <span className="font-light">Positioned</span>
                      <small className="ml-2 mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-gray-800">
                        {networkNodeCountState["Positioned"]}
                      </small>
                    </span>
                  ) : null}

                  {networkNodeCountState["Active"] ? (
                    <span className="flex items-center space-x-1">
                      <div
                        className="h-6 w-7 rounded border"
                        style={{ backgroundColor: NODE_COLOR["Active"] }}
                      ></div>
                      <span className="font-light">Active</span>
                      <small className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-gray-800">
                        {networkNodeCountState["Active"]}
                      </small>
                    </span>
                  ) : null}

                  {networkNodeCountState["Inactive"] ? (
                    <span className="flex items-center space-x-1">
                      <div
                        className="h-6 w-7 rounded border"
                        style={{ backgroundColor: NODE_COLOR["Inactive"] }}
                      ></div>
                      <span className="font-light">Inactive</span>
                      <small className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-gray-800">
                        {networkNodeCountState["Inactive"]}
                      </small>
                    </span>
                  ) : null}

                  {networkNodeCountState["Decommissioned"] ? (
                    <span className="flex items-center space-x-1">
                      <div
                        className="h-6 w-7 rounded border"
                        style={{ backgroundColor: NODE_COLOR["Decommissioned"] }}
                      ></div>
                      <span className="font-light">Decommissioned</span>
                      <small className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-gray-800">
                        {networkNodeCountState["Decommissioned"]}
                      </small>
                    </span>
                  ) : null}
                </div>
              )}
            </div>

            {/* // + graph */}
            <div className="h-[92vh]" id="network-graph" />
          </div>

          <div className="border-1 col-span-1 border">
            {/* // + form */}
            {/* <form
              className="mx-3 mb-10"
              onSubmit={(e) => {
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
                      className="mb-2 block text-sm font-normal text-gray-500"
                    >
                      Connect To
                    </label>
                    <select
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                      id="selectNodeConnect"
                      data-category="edge_connect"
                      data-name="connect_to"
                      required
                    >
                      <option value="" hidden>
                        Select Node...
                      </option>
                      {Object.values(networkNodesState).map((nodes, index) => (
                        <option key={index} data-device-type={nodes.deviceType} value={nodes.id}>
                          {nodes.label}
                        </option>
                      ))}
                    </select>
                    <small className="mt-2 text-sm text-red-500"></small>
                  </div>
                </div>
              </fieldset>

              <small
                className="mb-3 hidden min-h-[2rem] rounded-sm border border-red-600 text-sm text-red-500"
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

                    dbData[$(dbDataTarget[count]).attr("data-category") as string][
                      $(dbDataTarget[count]).attr("data-name") as string
                    ] = $(dbDataTarget[count]).val()
                  }

                  //* edge data validation
                  if ($("select[data-category=edge_connect]").is(":invalid")) return

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
                      shape: selectedNodeType == Device.Type.Satellite ? "image" : "circularImage",
                      image: {
                        unselected:
                          selectedNodeType == Device.Type.Satellite
                            ? "/satellite.png"
                            : "/ground-station.png",
                      },
                      imagePadding: selectedNodeType == Device.Type.Satellite ? 5 : 3,
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
                        device_type: $("#selectNodeConnect option:selected").attr("data-device-type"),
                        device_id: $("#selectNodeConnect").val(),
                      },
                    }),
                  })
                    .then(async (serverResponse) => {
                      let responseData = await serverResponse.json()

                      // on connection success

                      // on connection failure
                      console.log(serverResponse, responseData)

                      //* display errors on server side validation
                      if (serverResponse.status == 400) {
                        const { name, category, error, foreground } = responseData

                        // on major prisma error
                        if (foreground)
                          return $(`#foregroundErr`)
                            .removeClass("hidden")
                            .addClass("block")
                            .text(JSON.stringify(error))
                        else $(`#foregroundErr`).removeClass("block").addClass("hidden").text("")

                        return $(`input[data-category=${category}][data-name=${name}]`)
                          .siblings("small")
                          .text(error)
                      }

                      // remove error message on valid input
                      $(`small`).map((index, small) => $(small).text(""))
                    })
                    .catch((err) => console.log(err))

                  // form reset
                }}
              >
                Submit
              </button>
            </form> */}
          </div>
        </section>
      </main>
    </>
  )
}

export default Home
