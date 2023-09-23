import { useQuery } from "@tanstack/react-query"

// Define your fetch function (replace with your own fetch logic)
const fetchData = async () => {
  const response = await fetch("api/fetch/graph")
  const data = await response.json()
  return data
}

// Custom hook for polling data
const usePollingQuery = () => {
  // Use useQuery with a unique key
  const { data, error, isLoading } = useQuery(["pollingData"], fetchData, {
    refetchInterval: 10000, // Set the polling interval to 10 seconds (10000 milliseconds)
  })

  return { data, error, isLoading }
}

export default usePollingQuery
