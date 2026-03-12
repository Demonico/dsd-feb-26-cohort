import { Input } from "@/components/ui/input"

type ManifestDetailsProps = {
  stops?: number;
  skips?: number;
  extras?: number;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
};

const ManifestDetails = ({
  stops = 0,
  skips = 0,
  extras = 0,
  searchQuery,
  onSearchQueryChange,
}: ManifestDetailsProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 w-full justify-between">
         <Input
           type="search"
           placeholder="Search address or customer.."
           value={searchQuery}
           onChange={(event) => onSearchQueryChange(event.target.value)}
           className="w-full md:w-1/2 py-4 placeholder:font-semibold placeholder:text-black"
         />
         <div className="flex gap-5 mr-12">
           <p>
            <span className="font-bold text-muted-foreground">Stops: </span>
            <span className="font-bold">{stops}</span>
           </p>
           <p>
            <span className="font-bold  text-red-500">Skips: </span>
            <span className="font-bold">{skips}</span>
           </p>
           <p>
            <span className="font-bold text-cyan-400">Extras: </span>
            <span className="font-bold">{extras}</span>
           </p>

         </div>
    </div>
  )
}

export default ManifestDetails
