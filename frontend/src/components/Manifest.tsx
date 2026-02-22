import { useEffect, useState } from "react";
import type {ManifestRow} from "@/types/manifest";
import { mockManifestData } from "@/assets/mockData";

const Manifest = () => {
     const [rows, setRows] = useState<ManifestRow[]>([]);

     useEffect(()=>{
        setRows(mockManifestData);
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
                        <th className="p-3 text-left">Size</th>
                        <th className="p-3 text-left">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id}>
                            <td className="p-2">{row.id}</td>
                            <td className="p-2">{row.locationLine1}</td>
                            <td className="p-2">{row.locationLine2}</td>
                            <td className="p-2">{row.customer}</td>
                            <td className="p-2">{row.container}</td>
                            <td className="p-2">{row.size}</td>
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




        </div>
    )
}

export default Manifest
