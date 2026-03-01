

type CustomerHeaderProps = {
  location: string
};

const CustomerHeader = ({location}:CustomerHeaderProps) => {
  const date = new Date();
  return (
    <div className="flex justify-between items-center mb-6">
      <span className="font-bold">{date.toDateString()}</span>
      <span className="font-bold">{location}</span>
    </div>
  )
}

export default CustomerHeader