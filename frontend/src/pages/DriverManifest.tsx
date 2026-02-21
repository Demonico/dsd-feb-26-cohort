const DriverManifest = () => {
  return (
    <div>
      <h1 className="text-xl font-bold">Driver Manifest</h1>

      <div className="border-2 rounded-sm my-3 p-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Route ID:
              </span>
              <span className="font-bold">R-1043</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Company:
              </span>
              <span className="font-bold">Golden Oak</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Location:
              </span>
              <span className="font-bold">Springfield, IL</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Driver:
              </span>
              <span className="font-bold">John Doe</span>
            </div>
          </div>

      
          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Date:
              </span>
              <span className="font-bold">Thur, Feb 12th 2026</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Truck:
              </span>
              <span className="font-bold">27AD</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Week Of:
              </span>
              <span className="font-bold">R-1043</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-muted-foreground font-semibold text-lg">
                Container Type:
              </span>
              <span className="font-bold">R-1043</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DriverManifest;