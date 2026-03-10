    import { useEffect, useState } from "react";
    import { mockManifestData } from "@/assets/mockData";

    const Manifest = () => {

        const [currentPage, setCurrentPage] = useState(1);
        const itemsInPage = 10;

        const totalPages = Math.ceil(mockManifestData.length / itemsInPage);
        const currItems = mockManifestData.slice((currentPage - 1) * itemsInPage, currentPage * itemsInPage);


        const pageNumbers = [];
        for (let i = 1; i <= totalPages; i++) {
            pageNumbers.push(i);
        }


        useEffect(() => {

            // will call api

        }, []);

        return (
            <div className="border rounded-sm mt-2 overflow-x-auto">

                <table className="w-full text-md">
                    <thead className="border-b">
                        <tr className="p-2">
                            <th className="p-3 text-left">#</th>
                            <th className="p-3 text-left">Location</th>
                            <th className="p-3 text-left">Customer</th>
                            <th className="p-3 text-left">Service</th>
                            <th className="p-3 text-left">Container</th>
                            <th className="p-3 text-left">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currItems.map((row) => (
                            <tr key={row.id}>
                                <td className="p-2">{row.id}</td>
                                <td className="p-2">{row.locationLine1}</td>
                                <td className="p-2">{row.locationLine2}</td>
                                <td className="p-2">{row.customer}</td>
                                <td className="p-2">{row.container}</td>
                                <td className="p-2">
                                    <span className={`inline-flex justify-center items-center w-24 px-2 py-1 rounded-xl font-medium ${row.status === "Completed"
                                        ? "bg-green-100 text-green-600"
                                        : row.status === "Skipped"
                                            ? "bg-red-100 text-red-600"
                                            : "bg-gray-100 text-gray-600"} p-1`}>
                                        {row.status}

                                    </span>
                                </td>


                            </tr>
                        ))}
                    </tbody>

                </table>

                <div className="flex justify-end items-center gap-2 p-4">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border disabled:opacity-50 cursor-pointer"
                    >
                        Previous
                    </button>

                    {pageNumbers.map((page) => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-1 cursor-pointer rounded border ${currentPage === page ? "bg-black text-white" : ""}`}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border disabled:opacity-50 cursor-pointer"
                    >
                        Next
                    </button>
                </div>
            </div>
        )
    }

    export default Manifest;
