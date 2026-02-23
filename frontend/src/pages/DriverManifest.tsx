import RouteDetails from "../components/RouteDetails";
import ManifestDetails from "@/components/ManifestDetails";
const DriverManifest = () => {
  return (
    <div>
      <h1 className="text-xl font-bold">Driver Manifest</h1>
      <RouteDetails/>
      <div className="border-2 p-4 rounded-sm">
        <ManifestDetails/>
      </div>
      

     
    </div>
  );
};

export default DriverManifest;