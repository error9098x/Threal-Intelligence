export default function Header() {
  return (
    <header className="glass-card py-4 px-6 border-b border-blue-900/30">
      <div className="container mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-blue-100 flex items-center">
          <span className="bg-blue-600 text-white p-1 rounded mr-2 text-sm">SA</span>
          SentryAgent
          <span className="ml-2 text-sm text-blue-400 font-normal">Real-Time Threat Intelligence</span>
        </h1>
      </div>
    </header>
  )
}
