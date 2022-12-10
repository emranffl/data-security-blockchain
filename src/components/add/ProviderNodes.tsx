import { satellite_info_status } from "@prisma/client"
import { NextPage } from "next"
import $ from "jquery"
import { Device } from "@pages/_app"

interface ProviderNodesProps {
    selectedNodeType: string | null
    setSelectedNodeType: (nodeType: string) => void
}

const AddProviderNodes: NextPage<ProviderNodesProps> = ({ selectedNodeType, setSelectedNodeType }) => {
    return <>
        <fieldset className="my-5">
            <div className="flex space-x-5 justify-start">
                <h3 className="font-light text-gray-700 flex items-center">Node Type</h3>
                <div className="flex items-center font-mono">
                    <input
                        className="w-5 h-5 border-gray-300"
                        id="radioNodeSatellite"
                        type="radio"
                        name="radioNodeType"
                        value={Device.Type.Satellite}
                        onChange={(e) => setSelectedNodeType(e.currentTarget.value)}
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
                        value={Device.Type.GroundStation}
                        onChange={(e) => setSelectedNodeType(e.currentTarget.value)}
                    />
                    <label htmlFor="radioNodeGS" className="block ml-2 text-sm font-medium text-gray-900 py-1 cursor-pointer">
                        Ground Station
                    </label>
                </div>
            </div>
        </fieldset>

        {selectedNodeType == Device.Type.Satellite ?
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


        {selectedNodeType == Device.Type.GroundStation ?
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

                        <div className="mb-2">
                            <label htmlFor="autoGSLocation" className="block mb-2 text-sm font-normal text-gray-500">Auto</label>
                            <button type="button" className="btn-gradient-duotone-purple" id="autoGSLocation"
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
                                <i className="mb-0 bi-pin-map-fill"></i>
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
    </>
}

export default AddProviderNodes