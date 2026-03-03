type DriverHeaderProps = {
  routeId: string;
  location: string
};


const DriverDashHeader = ({ location, routeId }: DriverHeaderProps) => {
  const date = new Date();
  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <span className="font-bold">{date.toDateString()}</span>
      <div className="text-left font-bold sm:text-right">
        <p>Route ID: {routeId}</p>
        <p>{location}</p>
      </div>
    </div>
  )
}

export default DriverDashHeader;
