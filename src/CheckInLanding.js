export default function CheckInLanding() {
    return (
      <section className="bg-gradient-to-b from-white to-blue-50 min-h-screen pt-24 pb-10 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">👋 Welcome to Seek</h1>
          <p className="text-lg text-gray-600 mb-6">
            The real-life social radar.
          </p>
  
          <a
            href="/checkin"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold py-3 px-6 rounded-full transition mb-6"
          >
            ✅ Check In Now
          </a>
  
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            <a
              href="/hot"
              className="text-sm bg-orange-100 text-orange-800 px-5 py-2 rounded-full hover:bg-orange-200 transition"
            >
              🔥 What’s Hot Tonight
            </a>
            <a
              href="/map"
              className="text-sm bg-blue-100 text-blue-800 px-5 py-2 rounded-full hover:bg-blue-200 transition"
            >
              🗺️ View Social Map
            </a>
          </div>
  
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-12">
            Seek shows you who’s out, where, and open to chat. No swiping. Just real-world vibes.
          </p>
  
          <footer className="text-xs text-gray-400 mt-8">
            💙 Built for Gen Z IRL
          </footer>
        </div>
      </section>
    );
  }
  