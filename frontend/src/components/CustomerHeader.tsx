

type CustomerHeaderProps = {
  location: string
};

const CustomerHeader = ({location}:CustomerHeaderProps) => {
  const date = new Date();
  return (
    <div className="flex justify-between items-center mb-6">
      <span className="font-medium">{date.toDateString()}</span>
      <span className="font-medium">{location}</span>
    </div>
  )
}

export default CustomerHeader