import { Link } from "react-router-dom";

function CheckInLanding() {
  return (
    <div className="bg-[#111827] text-white min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-4xl font-bold leading-tight">
          Welcome to <span className="text-blue-400">Seek</span> 👋
        </h1>
        <p className="text-gray-300 text-lg">
          Discover who’s out and about. Check in and connect at real venues in your city.
        </p>

        <Link
          to="/checkin"
          className="inline-block bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow"
        >
          Check In Now
        </Link>

        <div className="flex justify-center gap-4 text-sm text-gray-400 pt-4">
          <Link to="/hot" className="hover:underline">Trending</Link>
          <Link to="/map" className="hover:underline">Hot Map</Link>
        </div>
      </div>
    </div>
  );
}

export default CheckInLanding;
