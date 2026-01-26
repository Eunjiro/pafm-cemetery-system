import Link from "next/link"

interface ServiceCardProps {
  title: string
  description: string
  icon: string
  href: string
}

export default function ServiceCard({ title, description, icon, href }: ServiceCardProps) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 border border-gray-200 h-full flex flex-col">
        <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <span className="text-3xl">{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 flex-grow">{description}</p>
        <div className="mt-4 flex items-center text-green-600 font-medium">
          Learn more
          <svg
            className="w-4 h-4 ml-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  )
}
