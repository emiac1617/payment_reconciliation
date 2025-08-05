export function exportToCsv(data: any[], filename: string) {
  if (!data || data.length === 0) {
    console.warn("No data to export.")
    return
  }

  const headers = Object.keys(data[0])
  const csvRows = []

  // Add headers
  csvRows.push(headers.join(","))

  // Add data rows
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Handle null/undefined, escape commas and double quotes
      let formattedValue = value === null || value === undefined ? "" : String(value)
      if (formattedValue.includes(",") || formattedValue.includes('"')) {
        formattedValue = `"${formattedValue.replace(/"/g, '""')}"`
      }
      return formattedValue
    })
    csvRows.push(values.join(","))
  }

  const csvString = csvRows.join("\n")
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (link.download !== undefined) {
    // Browsers that support HTML5 download attribute
    link.setAttribute("href", URL.createObjectURL(blob))
    link.setAttribute("download", filename)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } else {
    // Fallback for older browsers
    window.open(URL.createObjectURL(blob))
  }
}
