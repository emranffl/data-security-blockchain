import { NextPage } from "next"
import Link from "next/link"
import AddProviderNodes from "./addProviderNodes"

interface AddNodesTabProps {
    selectedAddNodeCategory: string | null
    setSelectedAddNodeCategory: (selectedAddNodeCategory: string | null) => void
    selectedNodeType: string | null
    setSelectedNodeType: (selectedNodeTypes: string | null) => void
}

const AddNodesTab: NextPage<AddNodesTabProps> = ({
    selectedAddNodeCategory, setSelectedAddNodeCategory,
    selectedNodeType, setSelectedNodeType
}) => {
    return <>
        <nav className="relative flex flex-wrap items-center justify-between px-2 py-3 bg-gray-800 mb-3 -mx-3">
            <div className="container px-4 mx-auto flex flex-wrap items-center justify-between">
                <div className="w-full relative flex justify-between lg:w-auto  px-4 lg:static lg:block lg:justify-start">
                    {/* <Link href={Links.App.home}>
            <a className="text-xl font-bold leading-relaxed inline-block mr-4 py-2 whitespace-nowrap uppercase text-white" >
              Internal System
            </a>
          </Link> */}
                    {/* <button className="cursor-pointer text-xl leading-none px-3 py-1 border border-solid border-transparent rounded bg-transparent block lg:hidden outline-none focus:outline-none" type="button">
            <span className="block relative w-6 h-px rounded-sm bg-white"></span>
            <span className="block relative w-6 h-px rounded-sm bg-white mt-1"></span>
            <span className="block relative w-6 h-px rounded-sm bg-white mt-1"></span>
          </button> */}
                </div>

                {/* <div className="flex items-center">
          <Link href={Links.App.home}>
            <a className="">Home</a>
          </Link>
        </div> */}

                <div className="flex flex-grow items-center">
                    <ul className="flex flex-row list-none m-auto">
                        <li>
                            <Link href='/node/add'>
                                <a className="px-3 py-2 flex items-center font-mono leading-snug text-white hover:opacity-75">
                                    <i className="mb-0 bi-plus-square" />
                                    <span className="ml-2">Add</span>
                                </a>
                            </Link>
                        </li>
                        <li>
                            <Link href='/node/edit'>
                                <a className="px-3 py-2 flex items-center font-mono leading-snug text-white hover:opacity-75">
                                    <i className="mb-0 bi-pencil-square" />
                                    <span className="ml-2">Edit</span>
                                </a>
                            </Link>
                        </li>
                        <li>
                            <Link href='/node/verify'>
                                <a className="px-3 py-2 flex items-center font-mono leading-snug text-white hover:opacity-75">
                                    <i className="mb-0 bi-patch-check" />
                                    <span className="ml-2">Verify</span>
                                </a>
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>

        <fieldset>
            <div className="flex space-x-5">
                <div className="flex items-center font-mono">
                    <input
                        className="w-5 h-5 border-gray-300"
                        id="radioNodeCategoryProvider"
                        type="radio"
                        name="radioNodeCategory"
                        value="Provider"
                        onChange={(e) => setSelectedAddNodeCategory(e.currentTarget.value)}
                    />
                    <label htmlFor="radioNodeCategoryProvider" className="block ml-2 text-lg font-medium text-gray-900 py-1 cursor-pointer">
                        Provider Node
                    </label>
                </div>
                <div className="flex items-center font-mono">
                    <input
                        className="w-5 h-5 border-gray-300"
                        id="radioNodeCategoryConsumer"
                        type="radio"
                        name="radioNodeCategory"
                        value="Consumer"
                        onChange={(e) => setSelectedAddNodeCategory(e.currentTarget.value)}
                    />
                    <label htmlFor="radioNodeCategoryConsumer" className="block ml-2 text-lg font-medium text-gray-900 py-1 cursor-pointer">
                        Consumer Node
                    </label>
                </div>
            </div>
        </fieldset>

        <div><hr /></div>

        {selectedAddNodeCategory == "Provider" &&
            <AddProviderNodes selectedNodeType={selectedNodeType} setSelectedNodeType={setSelectedNodeType} />}

    </>
}

export default AddNodesTab